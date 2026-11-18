// pcc-headway.js - Per-day pass times at fixed points on the G line (added 2026-11-18).
// GET ?date=YYYY-MM-DD -> for each checkpoint and direction, the minute of day when a vehicle passed.
// The G line runs west to east, so a longitude identifies one point on the line.
// A pass is two readings of one vehicle, at most 12 minutes apart, on opposite sides of the checkpoint.
// The pass time is the straight-line estimate between the two readings. Readings come every 5 minutes.
// A rising longitude is an eastbound pass. A falling longitude is a westbound pass.
// Optional ?at=lng,lng,lng replaces the default checkpoints.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const PAGE = 1000;      // Supabase returns at most 1000 rows per request.
const MAX_PAGES = 12;
const MAX_GAP_MIN = 12; // Two readings further apart than this are not joined.

const DEFAULT_POINTS = [
    { name: '52nd St', lng: -75.2255 },
    { name: 'Broad St', lng: -75.1596 },
    { name: 'Front St', lng: -75.1362 }
];

function easternOffset(d) {
    const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })
        .formatToParts(d).find(p => p.type === 'timeZoneName').value;
    const hours = Math.abs(parseInt(tz.replace('GMT', ''), 10) || 5);
    return `-${String(hours).padStart(2, '0')}:00`;
}

export const handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=600'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

    const q = event.queryStringParameters || {};
    const date = q.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'date parameter required (YYYY-MM-DD)' }) };
    }

    let points = DEFAULT_POINTS;
    if (q.at) {
        const lngs = String(q.at).split(',').map(Number).filter(n => Number.isFinite(n) && n < -74 && n > -76).slice(0, 6);
        if (lngs.length) points = lngs.map(lng => ({ name: String(lng), lng }));
    }

    try {
        const offset = easternOffset(new Date(`${date}T12:00:00Z`));
        const dayStartMs = new Date(`${date}T00:00:00${offset}`).getTime();
        const startOfDay = `${date}T00:00:00${offset}`;
        const endOfDay = `${date}T23:59:59${offset}`;

        const rows = [];
        let truncated = false;
        for (let page = 0; page < MAX_PAGES; page++) {
            const { data, error } = await supabase
                .from('pcc_observations')
                .select('observed_at, vehicle_id, vehicle_type, lng')
                .gte('observed_at', startOfDay)
                .lte('observed_at', endOfDay)
                .order('observed_at', { ascending: true })
                .range(page * PAGE, page * PAGE + PAGE - 1);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < PAGE) break;
            if (page === MAX_PAGES - 1) truncated = true;
        }

        const byVehicle = {};
        let minLng = null, maxLng = null, noPosition = 0;
        for (const r of rows) {
            const lng = Number(r.lng);
            if (r.lng == null || r.lng === '' || !Number.isFinite(lng) || lng === 0) { noPosition++; continue; }
            if (minLng === null || lng < minLng) minLng = lng;
            if (maxLng === null || lng > maxLng) maxLng = lng;
            (byVehicle[r.vehicle_id] = byVehicle[r.vehicle_id] || []).push({
                t: (new Date(r.observed_at).getTime() - dayStartMs) / 60000,
                lng,
                type: r.vehicle_type === 'bus' ? 'bus' : 'pcc'
            });
        }

        const out = points.map(p => ({ name: p.name, lng: p.lng, eastbound: [], westbound: [], skippedEast: 0, skippedWest: 0 }));
        // Reading-gap counts per vehicle: how often a vehicle drops from the saved data between two readings.
        const gapCounts = { upTo6: 0, upTo12: 0, upTo30: 0, upTo60: 0 };
        for (const readings of Object.values(byVehicle)) {
            for (let i = 1; i < readings.length; i++) {
                const a = readings[i - 1], b = readings[i];
                const gap = b.t - a.t;
                if (gap > 0 && gap <= 6) gapCounts.upTo6++;
                else if (gap <= 12) gapCounts.upTo12++;
                else if (gap <= 30) gapCounts.upTo30++;
                else if (gap <= 60) gapCounts.upTo60++;
                // A crossing between two readings 12 to 60 minutes apart is a pass the counter does not record.
                if (gap > MAX_GAP_MIN && gap <= 60) {
                    points.forEach((p, idx) => {
                        if (a.lng < p.lng && b.lng >= p.lng) out[idx].skippedEast++;
                        else if (a.lng > p.lng && b.lng <= p.lng) out[idx].skippedWest++;
                    });
                }
                if (gap <= 0 || gap > MAX_GAP_MIN || a.lng === b.lng) continue;
                points.forEach((p, idx) => {
                    const crossedEast = a.lng < p.lng && b.lng >= p.lng;
                    const crossedWest = a.lng > p.lng && b.lng <= p.lng;
                    if (!crossedEast && !crossedWest) return;
                    const minute = a.t + gap * ((p.lng - a.lng) / (b.lng - a.lng));
                    const pass = [Math.round(minute * 10) / 10, b.type === 'pcc' ? 1 : 0]; // [minute of day, 1 = trolley]
                    (crossedEast ? out[idx].eastbound : out[idx].westbound).push(pass);
                });
            }
        }
        for (const p of out) {
            p.eastbound.sort((x, y) => x[0] - y[0]);
            p.westbound.sort((x, y) => x[0] - y[0]);
        }

        // Batch check (added 2026-11-18): the tracker saves one pcc_samples row per run, apart from the readings.
        // A sample that counted vehicles while no reading holds its timestamp is a batch the database rejected.
        // Before 2026-08-16 one rejected row cost the whole batch (see pcc-tracker.js).
        let batches = null;
        if (q.diag) {
            const { data: samples, error: sErr } = await supabase
                .from('pcc_samples')
                .select('sampled_at, pcc_count, bus_count')
                .gte('sampled_at', startOfDay)
                .lte('sampled_at', endOfDay)
                .order('sampled_at', { ascending: true })
                .limit(1000);
            if (sErr) throw sErr;
            const rowsAt = {};
            for (const r of rows) {
                const k = new Date(r.observed_at).getTime();
                rowsAt[k] = (rowsAt[k] || 0) + 1;
            }
            batches = { samples: 0, withVehicles: 0, lost: 0, lostByHour: {}, expectedRows: 0, storedRows: rows.length, hasBusCount: 0 };
            for (const s of (samples || [])) {
                batches.samples++;
                if (s.bus_count != null) batches.hasBusCount++;
                const expected = (s.pcc_count || 0) + (s.bus_count || 0);
                batches.expectedRows += expected;
                if (expected === 0) continue;
                batches.withVehicles++;
                const t = new Date(s.sampled_at).getTime();
                if (!rowsAt[t]) {
                    batches.lost++;
                    const hour = Math.floor((t - dayStartMs) / 3600000);
                    batches.lostByHour[hour] = (batches.lostByHour[hour] || 0) + 1;
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                date,
                batches,
                gapCounts,
                totalRows: rows.length,
                truncated,
                noPosition,
                vehicles: Object.keys(byVehicle).length,
                minLng,
                maxLng,
                points: out
            })
        };
    } catch (error) {
        console.error('pcc-headway error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not read headway data' }) };
    }
};
