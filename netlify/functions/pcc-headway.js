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

        const out = points.map(p => ({ name: p.name, lng: p.lng, eastbound: [], westbound: [] }));
        for (const readings of Object.values(byVehicle)) {
            for (let i = 1; i < readings.length; i++) {
                const a = readings[i - 1], b = readings[i];
                const gap = b.t - a.t;
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

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                date,
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
