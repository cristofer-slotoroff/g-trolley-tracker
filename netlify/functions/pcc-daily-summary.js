// pcc-daily-summary.js - Daily aggregation function
// Runs daily at 4 AM Eastern to compute previous day's summary statistics

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event) => {
    console.log('PCC Daily Summary: Starting aggregation at', new Date().toISOString());

    // Validate environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('PCC Daily Summary: Missing Supabase credentials');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Missing database credentials' })
        };
    }

    try {
        // Calculate yesterday's date in Eastern time
        // We want to summarize the previous complete day
        const now = new Date();
        const easternFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Get yesterday in Eastern time
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const parts = easternFormatter.formatToParts(yesterday);
        const year = parts.find(p => p.type === 'year').value;
        const month = parts.find(p => p.type === 'month').value;
        const day = parts.find(p => p.type === 'day').value;
        const summaryDate = `${year}-${month}-${day}`;

        console.log(`PCC Daily Summary: Computing summary for ${summaryDate}`);

        // Get all observations for the target date
        // Using Eastern time boundaries
        const startOfDay = `${summaryDate}T00:00:00-05:00`;
        const endOfDay = `${summaryDate}T23:59:59-05:00`;

        // Only summarize PCC trolleys (exclude buses)
        const { data: observations, error: fetchError } = await supabase
            .from('pcc_observations')
            .select('*')
            .gte('observed_at', startOfDay)
            .lte('observed_at', endOfDay)
            .or('vehicle_type.eq.pcc,vehicle_type.is.null');

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            throw fetchError;
        }

        if (!observations || observations.length === 0) {
            console.log(`PCC Daily Summary: No observations found for ${summaryDate}`);
            // Still create a summary record with zeros for tracking
            const emptySummary = {
                summary_date: summaryDate,
                total_observations: 0,
                unique_vehicles: 0,
                vehicle_ids: [],
                first_observation_time: null,
                last_observation_time: null,
                eastbound_observations: 0,
                westbound_observations: 0,
                peak_concurrent_vehicles: 0,
                updated_at: new Date().toISOString()
            };

            const { error: upsertError } = await supabase
                .from('pcc_daily_summaries')
                .upsert(emptySummary, { onConflict: 'summary_date' });

            if (upsertError) throw upsertError;

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'No data for this date', summary: emptySummary })
            };
        }

        // Compute summary statistics
        const uniqueVehicles = [...new Set(observations.map(o => o.vehicle_id))];
        const eastboundCount = observations.filter(o => o.direction === 'Eastbound').length;
        const westboundCount = observations.filter(o => o.direction === 'Westbound').length;

        // Find first and last observation times
        const times = observations.map(o => new Date(o.observed_at));
        const firstTime = new Date(Math.min(...times));
        const lastTime = new Date(Math.max(...times));

        // Format times as HH:MM:SS for the TIME column
        const formatTime = (date) => {
            return date.toLocaleTimeString('en-US', {
                timeZone: 'America/New_York',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };

        // Calculate peak concurrent vehicles
        // Group observations by their timestamp (5-minute windows) and find max unique vehicles
        const timeWindows = {};
        observations.forEach(o => {
            // Use the timestamp truncated to 5-minute windows
            const windowKey = o.observed_at.substring(0, 16); // YYYY-MM-DDTHH:MM
            if (!timeWindows[windowKey]) {
                timeWindows[windowKey] = new Set();
            }
            timeWindows[windowKey].add(o.vehicle_id);
        });
        const peakConcurrent = Math.max(...Object.values(timeWindows).map(s => s.size));

        // Build summary object
        const summary = {
            summary_date: summaryDate,
            total_observations: observations.length,
            unique_vehicles: uniqueVehicles.length,
            vehicle_ids: uniqueVehicles,
            first_observation_time: formatTime(firstTime),
            last_observation_time: formatTime(lastTime),
            eastbound_observations: eastboundCount,
            westbound_observations: westboundCount,
            peak_concurrent_vehicles: peakConcurrent,
            updated_at: new Date().toISOString()
        };

        // Upsert daily summary (insert or update if exists)
        const { error: upsertError } = await supabase
            .from('pcc_daily_summaries')
            .upsert(summary, { onConflict: 'summary_date' });

        if (upsertError) {
            console.error('Upsert error:', upsertError);
            throw upsertError;
        }

        console.log('PCC Daily Summary: Saved summary:', JSON.stringify(summary, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, summary })
        };

    } catch (error) {
        console.error('PCC Daily Summary error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// Netlify scheduled function configuration
// Runs at 4 AM Eastern (9 AM UTC during EST, 8 AM UTC during EDT)
// Using 9 AM UTC as a safe default
export const config = {
    schedule: "0 9 * * *"
};
