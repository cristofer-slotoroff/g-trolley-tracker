// pcc-tracker.js - Scheduled function to collect G1 vehicle up-time data
// Runs every 5 minutes, records active PCC trolleys AND buses to Supabase

import { createClient } from '@supabase/supabase-js';
import { runAlerts, runStopAlerts } from '../lib/alerts.js';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// PCC trolley detection logic (matches app.js)
// PCC cars have 4-digit IDs starting with "23" (e.g., 2322, 2347)
function isPCCTrolley(label) {
    return label && label.startsWith('23') && label.length === 4;
}

// Direction detection based on destination (matches app.js logic)
function getDirection(destination) {
    const dest = (destination || '').toUpperCase();

    // Eastbound destinations (toward Richmond/Delaware River)
    if (['RICHMOND', 'FISHTOWN', 'FRANKFORD', 'DELAWARE', 'WESTMORELAND'].some(d => dest.includes(d))) {
        return 'Eastbound';
    }

    // Westbound destinations (toward 63rd St)
    if (['63RD', 'PARKSIDE', '63'].some(d => dest.includes(d))) {
        return 'Westbound';
    }

    return 'Unknown';
}

export const handler = async (event) => {
    const startTime = new Date();
    console.log('PCC Tracker: Starting scheduled run at', startTime.toISOString());

    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('PCC Tracker: Missing Supabase credentials');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing database credentials' })
        };
    }

    try {
        // Fetch data from SEPTA TransitViewAll API
        const response = await fetch('https://www3.septa.org/api/TransitViewAll/index.php', {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PCC-Trolley-Tracker/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`SEPTA API returned ${response.status}`);
        }

        const data = await response.json();
        const observations = [];
        const alertVehicles = []; // PCC cars with the fields the stop alerts need (not stored)
        const observedAt = startTime;

        // Process routes array from API response
        for (const route of (data.routes || [])) {
            const g1Vehicles = route.G1;
            if (!g1Vehicles || !Array.isArray(g1Vehicles)) continue;

            for (const vehicle of g1Vehicles) {
                const label = String(vehicle.label || '');

                // Skip invalid entries
                if (!label || label === 'None' || label === '0' || label === '') {
                    continue;
                }
                // vehicle_id is varchar(10) in the database; log and skip anything longer (2026-08-16).
                if (label.length > 10) {
                    console.warn('PCC Tracker: skipping vehicle with an unexpectedly long label:', JSON.stringify(vehicle).slice(0, 300));
                    continue;
                }

                observations.push({
                    observed_at: observedAt.toISOString(),
                    vehicle_id: label,
                    vehicle_type: isPCCTrolley(label) ? 'pcc' : 'bus',
                    direction: getDirection(vehicle.destination),
                    destination: vehicle.destination || null,
                    // Columns are varchar(10); SEPTA sometimes sends more decimals now, so round to 6 (fixed 2026-08-16).
                    lat: vehicle.lat != null && vehicle.lat !== '' ? Number(vehicle.lat).toFixed(6) : null,
                    lng: vehicle.lng != null && vehicle.lng !== '' ? Number(vehicle.lng).toFixed(6) : null,
                    next_stop_sequence: vehicle.next_stop_sequence || null,
                    late_minutes: vehicle.late || 0
                });
                if (isPCCTrolley(label)) {
                    alertVehicles.push({
                        vehicle_id: label,
                        direction: getDirection(vehicle.destination),
                        next_stop_id: vehicle.next_stop_id,
                        trip: vehicle.trip
                    });
                }
            }
        }

        const pccObs = observations.filter(o => o.vehicle_type === 'pcc');
        const busObs = observations.filter(o => o.vehicle_type === 'bus');

        console.log(`PCC Tracker: Found ${pccObs.length} PCC trolleys, ${busObs.length} buses`);

        // Alert decisions run before this run's sample is saved, so "earlier today" excludes it. See lib/alerts.js.
        await runAlerts({ supabase, pccObs, observedAt });
        await runStopAlerts({ supabase, vehicles: alertVehicles, observedAt });

        // Always record a sample (even if nothing found) to track gaps/uptime
        const sampleRecord = {
            sampled_at: observedAt.toISOString(),
            pcc_count: pccObs.length,
            vehicle_ids: pccObs.map(o => o.vehicle_id),
            vehicles_data: pccObs.map(o => ({
                vehicle_id: o.vehicle_id,
                direction: o.direction,
                destination: o.destination,
                lat: o.lat,
                lng: o.lng,
                next_stop_sequence: o.next_stop_sequence,
                late_minutes: o.late_minutes
            })),
            bus_count: busObs.length,
            bus_vehicle_ids: busObs.map(o => o.vehicle_id)
        };

        const { error: sampleError } = await supabase
            .from('pcc_samples')
            .insert(sampleRecord);

        if (sampleError) {
            console.error('Supabase sample insert error:', sampleError);
            // Don't throw - still try to insert observations
        } else {
            console.log('PCC Tracker: Recorded sample');
        }

        // Insert individual observations (PCCs and buses)
        if (observations.length > 0) {
            const { error } = await supabase
                .from('pcc_observations')
                .insert(observations);

            if (error) {
                // One bad row should not cost the whole batch: retry row by row and log the culprit (2026-08-16).
                console.error('Supabase batch insert error, retrying rows one at a time:', error.message);
                let saved = 0;
                for (const row of observations) {
                    const { error: rowErr } = await supabase.from('pcc_observations').insert(row);
                    if (rowErr) console.error('PCC Tracker: row rejected:', rowErr.message, JSON.stringify(row));
                    else saved++;
                }
                console.log(`PCC Tracker: Inserted ${saved} of ${observations.length} observations after row-by-row retry`);
            } else {
                console.log(`PCC Tracker: Inserted ${observations.length} observations (${pccObs.length} PCC, ${busObs.length} bus)`);
            }
        } else {
            console.log('PCC Tracker: No G1 vehicles currently running (normal during off-hours)');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                timestamp: observedAt.toISOString(),
                pccCount: pccObs.length,
                busCount: busObs.length,
                vehicles: observations.map(o => ({
                    id: o.vehicle_id,
                    type: o.vehicle_type,
                    direction: o.direction
                }))
            })
        };

    } catch (error) {
        console.error('PCC Tracker error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

// Netlify scheduled function configuration
// Runs every 5 minutes
export const config = {
    schedule: "*/5 * * * *"
};
