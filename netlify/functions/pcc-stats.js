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

        // Get all PCC observations from last 30 days (exclude buses)
        const { data: observations, error } = await supabase
            .from('pcc_observations')
            .select('observed_at, vehicle_id, direction, next_stop_sequence')
            .gte('observed_at', thirtyDaysAgo)
            .or('vehicle_type.eq.pcc,vehicle_type.is.null')
            .order('observed_at', { ascending: true })
            .limit(50000);

        if (error) throw error;

        // Also get samples data for concurrent trolley counts
        const { data: samples, error: samplesError } = await supabase
            .from('pcc_samples')
            .select('sampled_at, pcc_count, vehicle_ids')
            .gte('sampled_at', thirtyDaysAgo)
            .order('sampled_at', { ascending: true })
            .limit(50000);

        if (samplesError) {
            console.error('Samples query error:', samplesError);
        }

        // Query ALL daily summaries (lightweight) for all-time stats
        const { data: dailySummaries, error: summaryError } = await supabase
            .from('pcc_daily_summaries')
            .select('summary_date, vehicle_ids, total_observations, peak_concurrent_vehicles, first_observation_time, last_observation_time, eastbound_observations, westbound_observations')
            .order('summary_date', { ascending: true });

        if (summaryError) {
            console.error('Daily summaries query error:', summaryError);
        }

        if ((!observations || observations.length === 0) && (!dailySummaries || dailySummaries.length === 0)) {
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
                    concurrencyPattern: [],
                    peakConcurrent: 0
                })
            };
        }

        const stats = processObservations(observations || [], samples || [], dailySummaries || []);

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

function toEasternDateKey(dateObj) {
    // Reliable Eastern time date key extraction
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(dateObj);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return `${y}-${m}-${d}`;
}

function toEasternHour(dateObj) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric', hour12: false
    }).formatToParts(dateObj);
    return parseInt(parts.find(p => p.type === 'hour').value) % 24;
}

function toEasternDayOfWeek(dateObj) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short'
    }).formatToParts(dateObj);
    const dayName = parts.find(p => p.type === 'weekday').value;
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayName);
}

function toEasternTimeStr(dateObj) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric', minute: '2-digit', hour12: true
    }).format(dateObj);
}

function processObservations(observations, samples, dailySummaries) {
    const now = new Date();
    const todayKey = toEasternDateKey(now);
    const todayDow = toEasternDayOfWeek(now);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // ============================================================
    // Group observations by date, hour, vehicle, direction, day-of-week
    // ============================================================
    const byDate = {};
    const byHour = {};           // For all-time hourly pattern
    const byHourServiceDay = {}; // Track which service-days had activity at each hour
    const byVehicle = {};
    const byDayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const serviceDaysByDow = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set(), 5: new Set(), 6: new Set() };

    // Today-specific tracking
    const todayObsByHour = {};
    let todayEbCount = 0;
    let todayWbCount = 0;
    let todayFirstSeen = null;
    let todayLastSeen = null;
    const todayVehicles = new Set();

    for (const obs of observations) {
        const date = new Date(obs.observed_at);
        const dateKey = toEasternDateKey(date);
        const hour = toEasternHour(date);
        const dayOfWeek = toEasternDayOfWeek(date);

        // By date
        if (!byDate[dateKey]) {
            byDate[dateKey] = { count: 0, vehicles: new Set(), ebCount: 0, wbCount: 0, firstObs: date, lastObs: date };
        }
        byDate[dateKey].count++;
        byDate[dateKey].vehicles.add(obs.vehicle_id);
        if (obs.direction === 'Eastbound') byDate[dateKey].ebCount++;
        else if (obs.direction === 'Westbound') byDate[dateKey].wbCount++;
        if (date < byDate[dateKey].firstObs) byDate[dateKey].firstObs = date;
        if (date > byDate[dateKey].lastObs) byDate[dateKey].lastObs = date;

        // By hour (all-time)
        if (!byHour[hour]) {
            byHour[hour] = { count: 0, vehicles: new Set(), daysWithActivity: new Set() };
        }
        byHour[hour].count++;
        byHour[hour].vehicles.add(obs.vehicle_id);
        byHour[hour].daysWithActivity.add(dateKey);

        // By vehicle
        if (!byVehicle[obs.vehicle_id]) {
            byVehicle[obs.vehicle_id] = { count: 0, eastbound: 0, westbound: 0, daysActive: new Set() };
        }
        byVehicle[obs.vehicle_id].count++;
        byVehicle[obs.vehicle_id].daysActive.add(dateKey);
        if (obs.direction === 'Eastbound') byVehicle[obs.vehicle_id].eastbound++;
        else if (obs.direction === 'Westbound') byVehicle[obs.vehicle_id].westbound++;

        // By day of week
        byDayOfWeek[dayOfWeek]++;
        serviceDaysByDow[dayOfWeek].add(dateKey);

        // Today-specific
        if (dateKey === todayKey) {
            todayVehicles.add(obs.vehicle_id);
            if (obs.direction === 'Eastbound') todayEbCount++;
            else if (obs.direction === 'Westbound') todayWbCount++;
            if (!todayFirstSeen || date < todayFirstSeen) todayFirstSeen = date;
            if (!todayLastSeen || date > todayLastSeen) todayLastSeen = date;

            if (!todayObsByHour[hour]) {
                todayObsByHour[hour] = { count: 0, vehicles: new Set() };
            }
            todayObsByHour[hour].count++;
            todayObsByHour[hour].vehicles.add(obs.vehicle_id);
        }
    }

    // ============================================================
    // Process samples for concurrency data
    // ============================================================
    const concurrencyByHour = {};
    let peakConcurrentSamples = 0;

    for (const sample of samples) {
        if (sample.pcc_count > 0) {
            const date = new Date(sample.sampled_at);
            const hour = toEasternHour(date);

            if (!concurrencyByHour[hour]) {
                concurrencyByHour[hour] = { maxCount: 0, totalCount: 0, sampleCount: 0 };
            }
            concurrencyByHour[hour].maxCount = Math.max(concurrencyByHour[hour].maxCount, sample.pcc_count);
            concurrencyByHour[hour].totalCount += sample.pcc_count;
            concurrencyByHour[hour].sampleCount++;

            if (sample.pcc_count > peakConcurrentSamples) {
                peakConcurrentSamples = sample.pcc_count;
            }
        }
    }

    // All-time peak concurrent from daily summaries (more reliable)
    const allTimePeakConcurrent = dailySummaries.length > 0
        ? Math.max(...dailySummaries.map(s => s.peak_concurrent_vehicles || 0), peakConcurrentSamples)
        : peakConcurrentSamples;

    // ============================================================
    // Typical hours (service-days only)
    // ============================================================
    const serviceDays = Object.keys(byDate);
    const numServiceDays = serviceDays.length;

    const activeHours = Object.entries(byHour)
        .filter(([_, data]) => data.count > observations.length * 0.02)
        .map(([hour, _]) => parseInt(hour))
        .sort((a, b) => a - b);

    const firstHour = activeHours.length > 0 ? activeHours[0] : null;
    const lastHour = activeHours.length > 0 ? activeHours[activeHours.length - 1] : null;

    // ============================================================
    // Hourly pattern (service-days only averages)
    // ============================================================
    const hourlyPatternServiceDays = [];
    for (let h = 0; h < 24; h++) {
        const data = byHour[h];
        const daysActive = data ? data.daysWithActivity.size : 0;
        hourlyPatternServiceDays.push({
            hour: h,
            label: formatHour(h),
            totalObs: data?.count || 0,
            avgVehicles: daysActive > 0
                ? Math.round((data.count / daysActive) * 10) / 10
                : 0,
            daysActive
        });
    }

    // ============================================================
    // Concurrency pattern (avg trolleys at each hour, service-days only)
    // ============================================================
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

    // ============================================================
    // Today's hourly breakdown
    // ============================================================
    const todayHourly = [];
    for (let h = 0; h < 24; h++) {
        const data = todayObsByHour[h];
        todayHourly.push({
            hour: h,
            label: formatHour(h),
            vehicleCount: data ? data.vehicles.size : 0,
            vehicles: data ? Array.from(data.vehicles) : [],
            observations: data?.count || 0
        });
    }

    // ============================================================
    // Today data object
    // ============================================================
    const todayData = {
        date: todayKey,
        dayName: dayNames[todayDow],
        vehicleIds: Array.from(todayVehicles),
        pccCount: todayVehicles.size,
        observations: byDate[todayKey]?.count || 0,
        firstSeen: todayFirstSeen ? toEasternTimeStr(todayFirstSeen) : null,
        lastSeen: todayLastSeen ? toEasternTimeStr(todayLastSeen) : null,
        ebCount: todayEbCount,
        wbCount: todayWbCount,
        hourlyBreakdown: todayHourly
    };

    // ============================================================
    // Same day-of-week history from daily summaries
    // ============================================================
    const sameDayHistory = dailySummaries
        .filter(s => {
            const d = new Date(s.summary_date + 'T12:00:00');
            return d.getDay() === todayDow && s.total_observations > 0;
        })
        .map(s => ({
            date: s.summary_date,
            vehicles: s.vehicle_ids || [],
            firstSeen: s.first_observation_time,
            lastSeen: s.last_observation_time,
            ebCount: s.eastbound_observations || 0,
            wbCount: s.westbound_observations || 0,
            peakConcurrent: s.peak_concurrent_vehicles || 0,
            observations: s.total_observations
        }))
        .reverse()  // Most recent first
        .slice(0, 12);

    // ============================================================
    // Best day/time to catch a trolley
    // ============================================================
    // Best day: day of week with highest observation rate per service-day
    let bestDow = 0;
    let bestDowRate = 0;
    for (let dow = 0; dow < 7; dow++) {
        const dowServiceDays = serviceDaysByDow[dow].size;
        if (dowServiceDays > 0) {
            const rate = byDayOfWeek[dow] / dowServiceDays;
            if (rate > bestDowRate) {
                bestDowRate = rate;
                bestDow = dow;
            }
        }
    }

    // Best hour range: consecutive hours with highest average activity
    let bestStartHour = firstHour || 9;
    let bestEndHour = lastHour || 15;
    // Find the peak window: hours with above-median activity
    const hourlyAvgs = hourlyPatternServiceDays
        .filter(h => h.avgVehicles > 0)
        .sort((a, b) => b.avgVehicles - a.avgVehicles);
    if (hourlyAvgs.length > 0) {
        const threshold = hourlyAvgs[0].avgVehicles * 0.5;
        const peakHours = hourlyPatternServiceDays
            .filter(h => h.avgVehicles >= threshold)
            .map(h => h.hour)
            .sort((a, b) => a - b);
        if (peakHours.length > 0) {
            bestStartHour = peakHours[0];
            bestEndHour = peakHours[peakHours.length - 1];
        }
    }

    // ============================================================
    // Daily pattern (observations by day of week)
    // ============================================================
    const dailyPattern = dayNames.map((name, i) => ({
        day: name,
        observations: byDayOfWeek[i],
        serviceDays: serviceDaysByDow[i].size,
        avgObservations: serviceDaysByDow[i].size > 0
            ? Math.round(byDayOfWeek[i] / serviceDaysByDow[i].size)
            : 0
    }));

    // ============================================================
    // All-time vehicle roster from daily summaries
    // ============================================================
    const allTimeVehicleDays = {};
    for (const summary of dailySummaries) {
        if (summary.vehicle_ids && Array.isArray(summary.vehicle_ids)) {
            for (const vid of summary.vehicle_ids) {
                if (!allTimeVehicleDays[vid]) allTimeVehicleDays[vid] = 0;
                allTimeVehicleDays[vid]++;
            }
        }
    }
    // Include today's vehicles in roster
    for (const vid of todayVehicles) {
        if (!allTimeVehicleDays[vid]) allTimeVehicleDays[vid] = 0;
        allTimeVehicleDays[vid]++;
    }
    const allTimeVehicleStats = Object.entries(allTimeVehicleDays)
        .map(([id, daysActive]) => ({ vehicleId: id, daysActive }))
        .sort((a, b) => b.daysActive - a.daysActive);

    // ============================================================
    // Service history (gap-filled recent days)
    // ============================================================
    const recentDays = [];

    const summaryByDate = {};
    for (const s of dailySummaries) {
        summaryByDate[s.summary_date] = s;
    }

    const thirtyDaysAgoDate = new Date(now);
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const firstSummaryDate = dailySummaries.length > 0 ? new Date(dailySummaries[0].summary_date + 'T12:00:00') : thirtyDaysAgoDate;
    const startDate = firstSummaryDate < thirtyDaysAgoDate ? thirtyDaysAgoDate : firstSummaryDate;

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysToShow = Math.ceil((now - startDate) / msPerDay) + 1;

    for (let i = 0; i < daysToShow; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateKey = toEasternDateKey(d);

        const summary = summaryByDate[dateKey];
        const liveData = byDate[dateKey];

        if (dateKey === todayKey) {
            // Today: always show, use live observation data
            recentDays.push({
                date: dateKey,
                isToday: true,
                observations: liveData?.count || 0,
                vehicles: liveData ? Array.from(liveData.vehicles) : [],
                firstSeen: todayFirstSeen ? toEasternTimeStr(todayFirstSeen) : null,
                lastSeen: todayLastSeen ? toEasternTimeStr(todayLastSeen) : null,
                ebCount: todayEbCount,
                wbCount: todayWbCount
            });
        } else if (summary) {
            recentDays.push({
                date: dateKey,
                isToday: false,
                observations: summary.total_observations,
                vehicles: summary.vehicle_ids || [],
                firstSeen: summary.first_observation_time,
                lastSeen: summary.last_observation_time,
                ebCount: summary.eastbound_observations || 0,
                wbCount: summary.westbound_observations || 0
            });
        } else {
            recentDays.push({
                date: dateKey,
                isToday: false,
                observations: 0,
                vehicles: [],
                firstSeen: null,
                lastSeen: null,
                ebCount: 0,
                wbCount: 0
            });
        }
    }

    // ============================================================
    // Days tracked: all-time service days + today if service
    // ============================================================
    const allTimeDaysWithService = dailySummaries.filter(s => s.total_observations > 0).length;
    const todayHasService = todayVehicles.size > 0;
    const totalDaysTracked = allTimeDaysWithService + (todayHasService ? 1 : 0);

    // ============================================================
    // Direction stats (all-time from 30-day observations)
    // ============================================================
    let totalEbObs = 0;
    let totalWbObs = 0;
    for (const obs of observations) {
        if (obs.direction === 'Eastbound') totalEbObs++;
        else if (obs.direction === 'Westbound') totalWbObs++;
    }

    // Hourly pattern (raw observation counts, for backward compat)
    const hourlyPattern = [];
    for (let h = 0; h < 24; h++) {
        hourlyPattern.push({
            hour: h,
            label: formatHour(h),
            observations: byHour[h]?.count || 0
        });
    }

    return {
        totalObservations: observations.length,
        daysWithService: numServiceDays,
        uniqueVehicles: Object.keys(byVehicle).length,
        allTimeUniqueVehicles: Object.keys(allTimeVehicleDays).length,
        allTimeVehicleStats,
        allTimeDaysWithService: totalDaysTracked,
        typicalStartHour: firstHour,
        typicalEndHour: lastHour,
        typicalHoursFormatted: firstHour !== null
            ? `${formatHour(firstHour)} \u2013 ${formatHour(lastHour + 1)}` : 'No data yet',
        peakConcurrent: allTimePeakConcurrent,
        vehicleStats: Object.entries(byVehicle)
            .map(([id, data]) => ({
                vehicleId: id,
                timesSpotted: data.count,
                daysActive: data.daysActive.size,
                eastboundPct: Math.round((data.eastbound / data.count) * 100),
                westboundPct: Math.round((data.westbound / data.count) * 100)
            }))
            .sort((a, b) => b.timesSpotted - a.timesSpotted),
        hourlyPattern,
        hourlyPatternServiceDays,
        dailyPattern,
        concurrencyPattern,
        todayData,
        sameDayHistory,
        bestDay: dayNames[bestDow],
        bestHourRange: `${formatHour(bestStartHour)} \u2013 ${formatHour(bestEndHour + 1)}`,
        totalEbObservations: totalEbObs,
        totalWbObservations: totalWbObs,
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
