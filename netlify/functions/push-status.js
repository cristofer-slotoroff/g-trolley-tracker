// push-status.js - Read-only health check for the alert system. Added 2026-08-16.
// GET -> { apnsConfigured, sandbox, subscribers, lastAlert }. No secrets, only booleans and counts.
// GET ?test=<device token> -> sends one test alert to that token, if it is a known subscriber.

import { createClient } from '@supabase/supabase-js';
import { apnsConfigFromEnv, sendPushes } from '../lib/apns.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' };

export const handler = async (event) => {
    const config = apnsConfigFromEnv();
    const testToken = (event.queryStringParameters || {}).test;

    if (testToken) {
        if (!config) return { statusCode: 503, headers, body: JSON.stringify({ error: 'APNs not configured' }) };
        if (!/^[a-f0-9]{32,256}$/i.test(testToken)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad token' }) };
        const { data: rows } = await supabase.from('push_subscriptions').select('token').eq('token', testToken.toLowerCase()).limit(1);
        if (!rows || !rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Unknown token' }) };
        const result = await sendPushes({
            tokens: [testToken.toLowerCase()],
            payload: { aps: { alert: { title: 'Philly Trolleys test', body: 'Alerts are working. This is a test message.' }, sound: 'default' }, type: 'test' },
            config
        });
        return { statusCode: 200, headers, body: JSON.stringify({ test: true, sandbox: config.sandbox, ...result }) };
    }

    const [{ count: subscribers }, { data: last }] = await Promise.all([
        supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('enabled', true),
        supabase.from('push_alerts_sent').select('alert_date, alert_type, sent_at, recipients, failed').order('sent_at', { ascending: false }).limit(1)
    ]);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            apnsConfigured: !!config,
            sandbox: config ? config.sandbox : null,
            subscribers: subscribers ?? null,
            lastAlert: (last && last[0]) || null
        })
    };
};
