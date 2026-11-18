// pcc-lateness.js - Per-day lateness summary endpoint (added 2026-11-18).
// GET ?date=YYYY-MM-DD -> counts only: how late SEPTA reported PCC trolleys and G buses on that day.
// The endpoint returns no row-level data. Every value is a count, a sum, or a median.
// "late_minutes" is SEPTA's own figure from the TransitView feed, saved by pcc-tracker.js every 5 minutes.
// Every value of 900 or more is a SEPTA "unknown" marker. The endpoint counts those apart and keeps them out of every average.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const PAGE = 1000;      // Supabase returns at most 1000 rows per request.
const MAX_PAGES = 12;   // A full day holds far fewer than 12,000 readings.
const UNKNOWN_AT = 900;

// Bucket edges in minutes late. A negative value means early.
const BUCKETS = [
    { key: 'early2plus', test: m => m <= -2 },
    { key: 'onTime', test: m => m >= -1 && m <= 5 },
    { key: 'late6to10', test: m => m >= 6 && m <= 10 },
    { key: 'late11to20', test: m => m >= 11 && m <= 20 },
    { key: 'late21plus', test: m => m >= 21 }
];

function easternOffset(d) {
    const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })
        .formatToParts(d).find(p => p.type === 'timeZoneName').value; // "GMT-4" or "GMT-5"
    const hours = Math.abs(parseInt(tz.replace('GMT', ''), 10) || 5);
    return `-${String(hours).padStart(2, '0')}:00`;
}

function easternHour(iso) {
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' })
        .format(new Date(iso)));
}

function emptyGroup() {
    const g = { readings: 0, unknown: 0, sumLate: 0, values: [], vehicles: new Set() };
    for (const b of BUCKETS) g[b.key] = 0;
    return g;
}

function addReading(g, minutes, vehicleId) {
    g.vehicles.add(vehicleId);
    if (!Number.isFinite(minutes) || Math.abs(minutes) >= UNKNOWN_AT) { g.unknown++; return; }
    g.readings++;
    g.sumLate += minutes;
    g.values.push(minutes);
    for (const b of BUCKETS) { if (b.test(minutes)) { g[b.key]++; break; } }
}

function finishGroup(g) {
    const sorted = g.values.slice().sort((a, b) => a - b);
    const at = p => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : null);
    const out = {
        vehicles: g.vehicles.size,
        readings: g.readings,
        unknown: g.unknown,
        sumLate: g.sumLate,
        avgLate: g.readings ? Math.round((g.sumLate / g.readings) * 10) / 10 : null,
        medianLate: at(0.5),
        p90Late: at(0.9)
    };
    for (const b of BUCKETS) out[b.key] = g[b.key];
    return out;
}

export const handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    const date = (event.queryStringParameters || {}).date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'date parameter required (YYYY-MM-DD)' }) };
    }

    try {
        const offset = easternOffset(new Date(`${date}T12:00:00Z`));
        const startOfDay = `${date}T00:00:00${offset}`;
        const endOfDay = `${date}T23:59:59${offset}`;

        const rows = [];
        let truncated = false;
        for (let page = 0; page < MAX_PAGES; page++) {
            const { data, error } = await supabase
                .from('pcc_observations')
                .select('observed_at, vehicle_id, vehicle_type, late_minutes')
                .gte('observed_at', startOfDay)
                .lte('observed_at', endOfDay)
                .order('observed_at', { ascending: true })
                .range(page * PAGE, page * PAGE + PAGE - 1);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < PAGE) break;
            if (page === MAX_PAGES - 1) truncated = true;
        }

        // Tracker uptime for the day: one sample row per 5-minute run, saved even when no trolley is out.
        const [{ count: samples }, { count: samplesWithPcc }] = await Promise.all([
            supabase.from('pcc_samples').select('*', { count: 'exact', head: true })
                .gte('sampled_at', startOfDay).lte('sampled_at', endOfDay),
            supabase.from('pcc_samples').select('*', { count: 'exact', head: true })
                .gte('sampled_at', startOfDay).lte('sampled_at', endOfDay).gt('pcc_count', 0)
        ]);

        const groups = { pcc: emptyGroup(), bus: emptyGroup() };
        const hourly = {};
        for (const r of rows) {
            const type = r.vehicle_type === 'bus' ? 'bus' : 'pcc'; // Rows from before the bus column are PCC rows.
            const minutes = Number(r.late_minutes);
            addReading(groups[type], minutes, r.vehicle_id);
            const h = easternHour(r.observed_at);
            if (!hourly[h]) hourly[h] = { pcc: emptyGroup(), bus: emptyGroup() };
            addReading(hourly[h][type], minutes, r.vehicle_id);
        }

        const byHour = Object.keys(hourly).map(Number).sort((a, b) => a - b).map(h => {
            const p = finishGroup(hourly[h].pcc);
            const b = finishGroup(hourly[h].bus);
            return {
                hour: h,
                pcc: { readings: p.readings, sumLate: p.sumLate, onTime: p.onTime },
                bus: { readings: b.readings, sumLate: b.sumLate, onTime: b.onTime }
            };
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                date,
                samples: samples ?? null,
                samplesWithPcc: samplesWithPcc ?? null,
                totalRows: rows.length,
                truncated,
                pcc: finishGroup(groups.pcc),
                bus: finishGroup(groups.bus),
                byHour
            })
        };
    } catch (error) {
        console.error('pcc-lateness error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not read lateness data' }) };
    }
};
