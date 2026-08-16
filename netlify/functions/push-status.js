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
        let tokens;
        if (testToken === 'all') {
            // Sending to everyone needs the APNs Key ID as a light guard against strangers.
            if ((event.queryStringParameters || {}).key !== process.env.APNS_KEY_ID) {
                return { statusCode: 403, headers, body: JSON.stringify({ error: 'Key required' }) };
            }
            const { data: rows } = await supabase.from('push_subscriptions').select('token').eq('enabled', true);
            tokens = (rows || []).map(r => r.token);
        } else {
            if (!/^[a-f0-9]{32,256}$/i.test(testToken)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad token' }) };
            const { data: rows } = await supabase.from('push_subscriptions').select('token').eq('token', testToken.toLowerCase()).limit(1);
            if (!rows || !rows.length) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Unknown token' }) };
            tokens = [testToken.toLowerCase()];
        }
        const result = await sendPushes({
            tokens,
            payload: { aps: { alert: { title: 'Philly Trolleys test', body: 'Alerts are working. This is a test message.' }, sound: 'default' }, type: 'test' },
            config
        });
        return { statusCode: 200, headers, body: JSON.stringify({ test: true, sandbox: config.sandbox, ...result }) };
    }

    // ?diagnose=1 walks the daily-alert decision without sending anything.
    if ((event.queryStringParameters || {}).diagnose) {
        const out = { apnsConfigured: !!config, node: process.version };
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
            out.easternDate = dateStr;
            const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' }).formatToParts(now);
            const tz = (parts.find(p => p.type === 'timeZoneName') || {}).value || 'none';
            out.tzName = tz;
            const m = tz.match(/GMT([+-]\d+)/);
            const offsetHours = m ? parseInt(m[1], 10) : -5;
            const [y, mo, d] = dateStr.split('-').map(Number);
            const midnight = new Date(Date.UTC(y, mo - 1, d, -offsetHours, 0, 0)).toISOString();
            out.easternMidnightUtc = midnight;
            const { data: earlier, error: earlierErr } = await supabase
                .from('pcc_samples').select('sampled_at, pcc_count')
                .gte('sampled_at', midnight).lt('sampled_at', now.toISOString()).gt('pcc_count', 0)
                .order('sampled_at', { ascending: true }).limit(1);
            out.firstPccSampleToday = earlierErr ? `error: ${earlierErr.message}` : (earlier && earlier[0]) || null;
            const { data: claims, error: claimErr } = await supabase
                .from('push_alerts_sent').select('*').eq('alert_date', dateStr);
            out.claimsToday = claimErr ? `error: ${claimErr.message}` : claims;
        } catch (e) {
            out.exception = String(e && e.message || e);
        }
        return { statusCode: 200, headers, body: JSON.stringify(out) };
    }

    const [{ count: subscribers }, { data: last }, stopSubs, stopSent] = await Promise.all([
        supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('enabled', true),
        supabase.from('push_alerts_sent').select('alert_date, alert_type, sent_at, recipients, failed').order('sent_at', { ascending: false }).limit(1),
        supabase.from('push_stop_alerts').select('*', { count: 'exact', head: true }).eq('enabled', true),
        supabase.from('push_stop_alerts_sent').select('vehicle_id, trip, sent_at').order('sent_at', { ascending: false }).limit(1)
    ]);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            apnsConfigured: !!config,
            sandbox: config ? config.sandbox : null,
            subscribers: subscribers ?? null,
            lastAlert: (last && last[0]) || null,
            stopAlertSubscribers: stopSubs.error ? null : (stopSubs.count ?? null),
            lastStopAlert: stopSent.error ? null : ((stopSent.data && stopSent.data[0]) || null)
        })
    };
};
