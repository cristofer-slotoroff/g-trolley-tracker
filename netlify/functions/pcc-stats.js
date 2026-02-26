// pcc-stats.js - API endpoint for trolley statistics
// Returns aggregated stats for the frontend dashboard

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event) => {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Get all PCC observations from last 30 days (exclude buses)
        // NOTE: Supabase defaults to 1000 rows max. 30 days can have ~5000+ rows.
        const { data: observations, error } = await supabase
            .from('pcc_observations')
            .select('observed_at, vehicle_id, direction, next_stop_sequence')
            .gte('observed_at', thirtyDaysAgo)
            .or('vehicle_type.eq.pcc,vehicle_type.is.null')
            .order('observed_at', { ascending: true })
            .limit(50000);

        if (error) throw error;

        // Also get samples data for concurrent trolley counts
        // 30 days × 288 samples/day = ~8640 rows, exceeds default 1000 limit
        const { data: samples, error: samplesError } = await supabase
            .from('pcc_samples')
            .select('sampled_at, pcc_count, vehicle_ids')
            .gte('sampled_at', thirtyDaysAgo)
            .order('sampled_at', { ascending: true })
            .limit(50000);

        if (samplesError) {
            console.error('Samples query error:', samplesError);
            // Continue without samples data
        }

        // Query ALL daily summaries (lightweight - one row per day) for all-time stats
        const { data: dailySummaries, error: summaryError } = await supabase
            .from('pcc_daily_summaries')
            .select('summary_date, vehicle_ids, total_observations, peak_concurrent_vehicles, first_observation_time, last_observation_time')
            .order('summary_date', { ascending: true });

        if (summaryError) {
            console.error('Daily summaries query error:', summaryError);
        }

        if (!observations || observations.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'No data yet',
                    totalObservations: 0,
                    daysWithService: 0,
                    vehicleStats: [],
                    hourlyPattern: [],
                    dailyPattern: [],
                    concurrencyByHour: [],
                    peakConcurrent: 0
                })
            };
        }

        // Process the data
        const stats = processObservations(observations, samples || [], dailySummaries || []);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(stats)
        };

    } catch (error) {
        console.error('Stats error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function processObservations(observations, samples, dailySummaries) {
    // Group by date (Eastern time)
    const byDate = {};
    const byHour = {};
    const byVehicle = {};
    const byDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // Sun-Sat

    // Process samples for concurrency data
    const concurrencyByHour = {};
    let peakConcurrent = 0;
    let peakConcurrentTime = null;

    for (const sample of samples) {
        if (sample.pcc_count > 0) {
            const date = new Date(sample.sampled_at);
            const eastern = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
            const hour = eastern.getHours();

            if (!concurrencyByHour[hour]) {
                concurrencyByHour[hour] = { maxCount: 0, totalCount: 0, sampleCount: 0 };
            }
            concurrencyByHour[hour].maxCount = Math.max(concurrencyByHour[hour].maxCount, sample.pcc_count);
            concurrencyByHour[hour].totalCount += sample.pcc_count;
            concurrencyByHour[hour].sampleCount++;

            if (sample.pcc_count > peakConcurrent) {
                peakConcurrent = sample.pcc_count;
                peakConcurrentTime = eastern;
            }
        }
    }

    for (const obs of observations) {
        const date = new Date(obs.observed_at);
        // Convert to Eastern time for grouping
        const eastern = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const dateKey = eastern.toISOString().split('T')[0];
        const hour = eastern.getHours();
        const dayOfWeek = eastern.getDay();

        // By date
        if (!byDate[dateKey]) {
            byDate[dateKey] = { count: 0, vehicles: new Set() };
        }
        byDate[dateKey].count++;
        byDate[dateKey].vehicles.add(obs.vehicle_id);

        // By hour
        if (!byHour[hour]) {
            byHour[hour] = { count: 0, vehicles: new Set() };
        }
        byHour[hour].count++;
        byHour[hour].vehicles.add(obs.vehicle_id);

        // By vehicle
        if (!byVehicle[obs.vehicle_id]) {
            byVehicle[obs.vehicle_id] = {
                count: 0,
                eastbound: 0,
                westbound: 0,
                daysActive: new Set()
            };
        }
        byVehicle[obs.vehicle_id].count++;
        byVehicle[obs.vehicle_id].daysActive.add(dateKey);
        if (obs.direction === 'Eastbound') {
            byVehicle[obs.vehicle_id].eastbound++;
        } else if (obs.direction === 'Westbound') {
            byVehicle[obs.vehicle_id].westbound++;
        }

        // By day of week
        byDayOfWeek[dayOfWeek]++;
    }

    // Find typical operating hours (hours with >5% of observations)
    const totalObs = observations.length;
    const activeHours = Object.entries(byHour)
        .filter(([_, data]) => data.count > totalObs * 0.02)
        .map(([hour, _]) => parseInt(hour))
        .sort((a, b) => a - b);

    const firstHour = activeHours.length > 0 ? activeHours[0] : null;
    const lastHour = activeHours.length > 0 ? activeHours[activeHours.length - 1] : null;

    // Format hourly pattern for chart (all 24 hours)
    const hourlyPattern = [];
    for (let h = 0; h < 24; h++) {
        hourlyPattern.push({
            hour: h,
            label: formatHour(h),
            observations: byHour[h]?.count || 0
        });
    }

    // Format daily pattern
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyPattern = dayNames.map((name, i) => ({
        day: name,
        observations: byDayOfWeek[i]
    }));

    // Format vehicle stats
    const vehicleStats = Object.entries(byVehicle)
        .map(([id, data]) => ({
            vehicleId: id,
            timesSpotted: data.count,
            daysActive: data.daysActive.size,
            eastboundPct: Math.round((data.eastbound / data.count) * 100),
            westboundPct: Math.round((data.westbound / data.count) * 100)
        }))
        .sort((a, b) => b.timesSpotted - a.timesSpotted);

    // All-time vehicle roster from daily summaries
    const allTimeVehicleDays = {};
    for (const summary of dailySummaries) {
        if (summary.vehicle_ids && Array.isArray(summary.vehicle_ids)) {
            for (const vid of summary.vehicle_ids) {
                if (!allTimeVehicleDays[vid]) allTimeVehicleDays[vid] = 0;
                allTimeVehicleDays[vid]++;
            }
        }
    }
    const allTimeVehicleStats = Object.entries(allTimeVehicleDays)
        .map(([id, daysActive]) => ({ vehicleId: id, daysActive }))
        .sort((a, b) => b.daysActive - a.daysActive);

    // Build gap-filled service history from daily summaries + today's live data
    const recentDays = [];
    const now = new Date();
    const todayET = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const todayKey = todayET.toISOString().split('T')[0];

    // Index daily summaries by date
    const summaryByDate = {};
    for (const s of dailySummaries) {
        summaryByDate[s.summary_date] = s;
    }

    // Find earliest tracked date (first daily summary or 30 days ago, whichever is more recent)
    const thirtyDaysAgoDate = new Date(todayET);
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const firstSummaryDate = dailySummaries.length > 0 ? new Date(dailySummaries[0].summary_date + 'T12:00:00') : thirtyDaysAgoDate;
    const startDate = firstSummaryDate < thirtyDaysAgoDate ? thirtyDaysAgoDate : firstSummaryDate;

    // Calculate number of days to show
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysToShow = Math.ceil((todayET - startDate) / msPerDay) + 1;

    for (let i = 0; i < daysToShow; i++) {
        const d = new Date(todayET);
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];

        const summary = summaryByDate[dateKey];
        const liveData = byDate[dateKey];

        if (dateKey === todayKey && liveData) {
            // Today: use live observation data (daily summary hasn't been computed yet)
            recentDays.push({
                date: dateKey,
                observations: liveData.count,
                vehicles: Array.from(liveData.vehicles),
                firstSeen: null,
                lastSeen: null
            });
        } else if (summary) {
            recentDays.push({
                date: dateKey,
                observations: summary.total_observations,
                vehicles: summary.vehicle_ids || [],
                firstSeen: summary.first_observation_time,
                lastSeen: summary.last_observation_time
            });
        } else {
            recentDays.push({
                date: dateKey,
                observations: 0,
                vehicles: [],
                firstSeen: null,
                lastSeen: null
            });
        }
    }

    // Format concurrency by hour (max and avg trolleys running at each hour)
    const concurrencyPattern = [];
    for (let h = 0; h < 24; h++) {
        const data = concurrencyByHour[h];
        concurrencyPattern.push({
            hour: h,
            label: formatHour(h),
            maxConcurrent: data?.maxCount || 0,
            avgConcurrent: data?.sampleCount > 0
                ? Math.round((data.totalCount / data.sampleCount) * 10) / 10
                : 0
        });
    }

    return {
        totalObservations: observations.length,
        daysWithService: Object.keys(byDate).length,
        uniqueVehicles: Object.keys(byVehicle).length,
        allTimeUniqueVehicles: Object.keys(allTimeVehicleDays).length,
        allTimeVehicleStats,
        allTimeDaysWithService: dailySummaries.filter(s => s.total_observations > 0).length,
        typicalStartHour: firstHour,
        typicalEndHour: lastHour,
        typicalHoursFormatted: firstHour !== null ?
            `${formatHour(firstHour)} - ${formatHour(lastHour + 1)}` : 'No data yet',
        peakConcurrent,
        peakConcurrentFormatted: peakConcurrentTime
            ? `${peakConcurrent} at ${formatHour(peakConcurrentTime.getHours())}`
            : 'N/A',
        vehicleStats,
        hourlyPattern,
        dailyPattern,
        concurrencyPattern,
        recentDays,
        lastUpdated: new Date().toISOString()
    };
}

function formatHour(hour) {
    if (hour === 0 || hour === 24) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
}
