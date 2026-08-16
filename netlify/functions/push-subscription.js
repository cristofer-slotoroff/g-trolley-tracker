// push-subscription.js - The iPhone app registers (or unregisters) its push token here.
// Added 2026-08-15. POST { token, platform: 'ios', enabled: true|false }
// Tokens are stored in Supabase table push_subscriptions (see supabase/push-alerts.sql).

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
    }

    let body = {};
    try {
        let raw = event.body || '{}';
        if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf-8');
        body = JSON.parse(raw);
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad JSON' }) };
    }

    const token = String(body.token || '').trim();
    const platform = String(body.platform || 'ios');
    const enabled = body.enabled !== false;
    // 'first' = one alert a day; 'each' = every car that comes out. Added 2026-08-16.
    const alertMode = body.alertMode === 'each' ? 'each' : 'first';

    // Apple device tokens are hex strings (64 characters today; allow longer in case Apple changes it).
    if (!/^[a-f0-9]{32,256}$/i.test(token)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad token' }) };
    }
    if (platform !== 'ios') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unsupported platform' }) };
    }

    const row = {
        token: token.toLowerCase(),
        platform,
        enabled,
        alert_mode: alertMode,
        updated_at: new Date().toISOString(),
        last_error: null
    };
    let { error } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'token' });
    if (error && /alert_mode/i.test(error.message || '')) {
        // Column not created yet: save without the mode rather than fail the phone.
        delete row.alert_mode;
        ({ error } = await supabase.from('push_subscriptions').upsert(row, { onConflict: 'token' }));
    }

    if (error) {
        console.error('push-subscription upsert error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Could not save' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, enabled, alertMode }) };
};
