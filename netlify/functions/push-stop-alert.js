// push-stop-alert.js - Save or clear a phone's stop alert. Added 2026-08-16.
// POST { token, direction: 'Eastbound'|'Westbound', stopIndex, stopName, stopsAway, enabled }
// One saved stop per phone. The tracker (lib/alerts.js runStopAlerts) does the sending.

import { createClient } from '@supabase/supabase-js';
import { G_LINE_STOPS_SIMPLE, stopDisplayName } from '../lib/g-stops.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const bad = (msg) => ({ statusCode: 400, headers, body: JSON.stringify({ error: msg }) });

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };

    let body = {};
    try {
        let raw = event.body || '{}';
        if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf-8');
        body = JSON.parse(raw);
    } catch (e) { return bad('Bad JSON'); }

    const token = String(body.token || '').trim().toLowerCase();
    if (!/^[a-f0-9]{32,256}$/i.test(token)) return bad('Bad token');

    const enabled = body.enabled !== false;
    if (!enabled) {
        const { error } = await supabase.from('push_stop_alerts')
            .update({ enabled: false, updated_at: new Date().toISOString() }).eq('token', token);
        if (error) { console.error('push-stop-alert disable error:', error); return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not save' }) }; }
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, enabled: false }) };
    }

    const direction = body.direction === 'Westbound' ? 'Westbound' : (body.direction === 'Eastbound' ? 'Eastbound' : null);
    const stopIndex = Number(body.stopIndex);
    const stopsAway = Number(body.stopsAway);
    if (!direction) return bad('Bad direction');
    if (!Number.isInteger(stopIndex) || stopIndex < 0 || stopIndex >= G_LINE_STOPS_SIMPLE.length) return bad('Bad stop');
    if (!Number.isInteger(stopsAway) || stopsAway < 1 || stopsAway > 20) return bad('Bad distance');
    const stopName = stopDisplayName(stopIndex) || String(body.stopName || '').slice(0, 80);

    const { error } = await supabase.from('push_stop_alerts').upsert({
        token, direction, stop_index: stopIndex, stop_name: stopName, stops_away: stopsAway,
        enabled: true, updated_at: new Date().toISOString()
    }, { onConflict: 'token' });
    if (error) {
        console.error('push-stop-alert upsert error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not save' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, enabled: true, direction, stopIndex, stopName, stopsAway }) };
};
