// pcc-tracker.js - Scheduled function to collect G1 vehicle up-time data
// Runs every 5 minutes, records active PCC trolleys AND buses to Supabase

import { createClient } from '@supabase/supabase-js';
import { apnsConfigFromEnv, sendPushes, serviceStartedMessage } from '../lib/apns.js';

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

// ---------- Daily "trolleys are out" push alert (added 2026-08-15) ----------

// Calendar date in Philadelphia for a given instant, as YYYY-MM-DD.
function easternDateString(date) {
    return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// The instant Philadelphia's day began, as an ISO string (handles DST via the current offset).
function easternMidnightIso(date) {
    const dateStr = easternDateString(date);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })
        .formatToParts(date);
    const tz = (parts.find(p => p.type === 'timeZoneName') || {}).value || 'GMT-5';
    const m = tz.match(/GMT([+-]\d+)/);
    const offsetHours = m ? parseInt(m[1], 10) : -5;
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d, -offsetHours, 0, 0)).toISOString();
}

// Sends at most one alert per day: the first time a PCC car shows up on the G Line.
// Never throws; tracking must keep working even if alerts break.
async function maybeSendServiceStartedAlert(pccObs, observedAt) {
    if (!pccObs.length) return;
    try {
        const config = apnsConfigFromEnv();
        if (!config) {
            console.log('Push alerts: APNs not configured yet, skipping');
            return;
        }

        // Was any PCC already seen earlier today? Then this is not the first sighting.
        const { data: earlier, error: earlierErr } = await supabase
            .from('pcc_samples')
            .select('sampled_at')
            .gte('sampled_at', easternMidnightIso(observedAt))
            .lt('sampled_at', observedAt.toISOString())
            .gt('pcc_count', 0)
            .limit(1);
        if (earlierErr) { console.error('Push alerts: sample lookup failed', earlierErr); return; }
        if (earlier && earlier.length) {
            console.log('Push alerts: a PCC was already seen today, no alert');
            return;
        }
        console.log(`Push alerts: first PCC sighting today (${pccObs.map(o => o.vehicle_id).join(', ')}), sending`);

        const vehicleIds = [...new Set(pccObs.map(o => o.vehicle_id))];
        const alertDate = easternDateString(observedAt);

        // Claim today's alert. A duplicate key here means another run already sent it.
        const { error: claimErr } = await supabase
            .from('push_alerts_sent')
            .insert({ alert_date: alertDate, alert_type: 'service_started', vehicle_ids: vehicleIds });
        if (claimErr) {
            if (claimErr.code === '23505') console.log('Push alerts: already sent today');
            else console.error('Push alerts: claim insert failed', claimErr);
            return;
        }

        const { data: subs, error: subsErr } = await supabase
            .from('push_subscriptions')
            .select('token')
            .eq('enabled', true)
            .eq('platform', 'ios');
        if (subsErr) { console.error('Push alerts: subscription lookup failed', subsErr); return; }
        const tokens = (subs || []).map(s => s.token);
        console.log(`Push alerts: first PCC of ${alertDate}, ${tokens.length} phones opted in`);

        const message = serviceStartedMessage(vehicleIds);
        const payload = {
            aps: {
                alert: { title: message.title, body: message.body },
                sound: 'default',
                'thread-id': 'service-started'
            },
            type: 'service_started',
            vehicles: vehicleIds
        };
        const result = tokens.length
            ? await sendPushes({ tokens, payload, config })
            : { sent: 0, failed: 0, unregistered: [], errors: [] };
        console.log(`Push alerts: sent ${result.sent}, failed ${result.failed}`, result.errors.slice(0, 5));

        if (result.unregistered.length) {
            await supabase
                .from('push_subscriptions')
                .update({ enabled: false, last_error: 'unregistered', updated_at: new Date().toISOString() })
                .in('token', result.unregistered);
        }
        await supabase
            .from('push_alerts_sent')
            .update({ recipients: result.sent, failed: result.failed, notes: result.errors.slice(0, 5).join('; ') || null })
            .eq('alert_date', alertDate)
            .eq('alert_type', 'service_started');
    } catch (err) {
        console.error('Push alerts: unexpected error', err);
    }
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
            }
        }

        const pccObs = observations.filter(o => o.vehicle_type === 'pcc');
        const busObs = observations.filter(o => o.vehicle_type === 'bus');

        console.log(`PCC Tracker: Found ${pccObs.length} PCC trolleys, ${busObs.length} buses`);

        // Daily alert check runs before this run's sample is saved, so "earlier today" excludes it.
        await maybeSendServiceStartedAlert(pccObs, observedAt);

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
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log(`PCC Tracker: Inserted ${observations.length} observations (${pccObs.length} PCC, ${busObs.length} bus)`);
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
