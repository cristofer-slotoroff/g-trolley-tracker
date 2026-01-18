// pcc-tracker.js - Scheduled function to collect PCC trolley up-time data
// Runs every 5 minutes, records active PCC trolleys to Supabase

import { createClient } from '@supabase/supabase-js';

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

                // Only track PCC trolleys (vehicle IDs starting with "23", length 4)
                if (!isPCCTrolley(label)) {
                    continue;
                }

                observations.push({
                    observed_at: observedAt.toISOString(),
                    vehicle_id: label,
                    direction: getDirection(vehicle.destination),
                    destination: vehicle.destination || null,
                    lat: vehicle.lat || null,
                    lng: vehicle.lng || null,
                    next_stop_sequence: vehicle.next_stop_sequence || null,
                    late_minutes: vehicle.late || 0
                });
            }
        }

        console.log(`PCC Tracker: Found ${observations.length} PCC trolleys`);

        // Always record a sample (even if no PCCs found) to track gaps/loop times
        const sampleRecord = {
            sampled_at: observedAt.toISOString(),
            pcc_count: observations.length,
            vehicle_ids: observations.map(o => o.vehicle_id),
            vehicles_data: observations.map(o => ({
                vehicle_id: o.vehicle_id,
                direction: o.direction,
                destination: o.destination,
                lat: o.lat,
                lng: o.lng,
                next_stop_sequence: o.next_stop_sequence,
                late_minutes: o.late_minutes
            }))
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

        // Insert individual observations (only if we found PCCs)
        if (observations.length > 0) {
            const { error } = await supabase
                .from('pcc_observations')
                .insert(observations);

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log(`PCC Tracker: Inserted ${observations.length} observations`);
        } else {
            console.log('PCC Tracker: No PCC trolleys currently running (normal during off-hours)');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                timestamp: observedAt.toISOString(),
                pccCount: observations.length,
                vehicles: observations.map(o => ({
                    id: o.vehicle_id,
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
