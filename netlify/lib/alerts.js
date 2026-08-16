// alerts.js - Decides which push alerts to send on each tracker run. Added 2026-08-16.
//
// Two alert modes, chosen per phone in the app (push_subscriptions.alert_mode):
//   'first'  one alert a day, when the first PCC car of the day appears
//   'each'   an alert every time a PCC car comes out (including the first), at most once per car per day
//
// Every alert is "claimed" in push_alerts_sent (primary key alert_date + alert_type) before sending,
// so overlapping tracker runs cannot double-send.

import { apnsConfigFromEnv, sendPushes, serviceStartedMessage } from './apns.js';

// Calendar date in Philadelphia for a given instant, as YYYY-MM-DD.
export function easternDateString(date) {
    return date.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// The instant Philadelphia's day began, as an ISO string (handles DST via the current offset).
export function easternMidnightIso(date) {
    const dateStr = easternDateString(date);
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })
        .formatToParts(date);
    const tz = (parts.find(p => p.type === 'timeZoneName') || {}).value || 'GMT-5';
    const m = tz.match(/GMT([+-]\d+)/);
    const offsetHours = m ? parseInt(m[1], 10) : -5;
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d, -offsetHours, 0, 0)).toISOString();
}

export function carOnlineMessage(vehicleId, totalOut) {
    const tail = totalOut > 1 ? ` ${totalOut} cars are out now.` : '';
    return { title: 'PCC Trolley out', body: `Car ${vehicleId} just started running on the G Line.${tail}` };
}

async function loadSubscribers(supabase, mode) {
    let { data, error } = await supabase
        .from('push_subscriptions')
        .select('token')
        .eq('enabled', true)
        .eq('platform', 'ios')
        .eq('alert_mode', mode);
    if (error && /alert_mode/i.test(error.message || '')) {
        // The alert_mode column is not in the database yet: treat every phone as "first" mode.
        if (mode !== 'first') return [];
        ({ data, error } = await supabase
            .from('push_subscriptions')
            .select('token')
            .eq('enabled', true)
            .eq('platform', 'ios'));
    }
    if (error) {
        console.error(`Push alerts: subscriber lookup (${mode}) failed`, error);
        return [];
    }
    return (data || []).map(s => s.token);
}

// Returns true if this run now owns the alert; false if another run already sent it (or on error).
async function claim(supabase, alertDate, alertType, vehicleIds) {
    const { error } = await supabase
        .from('push_alerts_sent')
        .insert({ alert_date: alertDate, alert_type: alertType, vehicle_ids: vehicleIds });
    if (!error) return true;
    if (error.code === '23505') console.log(`Push alerts: ${alertType} already sent for ${alertDate}`);
    else console.error(`Push alerts: claim insert failed for ${alertType}`, error);
    return false;
}

async function deliver({ supabase, config, tokens, message, type, threadId, vehicleIds, alertDate, alertType }) {
    const payload = {
        aps: { alert: { title: message.title, body: message.body }, sound: 'default', 'thread-id': threadId },
        type,
        vehicles: vehicleIds
    };
    const result = tokens.length
        ? await sendPushes({ tokens, payload, config })
        : { sent: 0, failed: 0, unregistered: [], errors: [] };
    console.log(`Push alerts: ${alertType}: sent ${result.sent}, failed ${result.failed}`, result.errors.slice(0, 5));

    if (result.unregistered.length) {
        await supabase
            .from('push_subscriptions')
            .update({ enabled: false, last_error: 'unregistered', updated_at: new Date().toISOString() })
            .in('token', result.unregistered);
    }
    await supabase
        .from('push_alerts_sent')
        .update({ recipients: result.sent, failed: result.failed, notes: result.errors.slice(0, 5).join('; ') || null })
        .eq('alert_date', alertDate)
        .eq('alert_type', alertType);
    return result;
}

// Main entry, called by the tracker every run. Never throws.
export async function runAlerts({ supabase, pccObs, observedAt, recentMinutes = 30 }) {
    if (!pccObs.length) return;
    try {
        const config = apnsConfigFromEnv();
        if (!config) {
            console.log('Push alerts: APNs not configured yet, skipping');
            return;
        }
        const alertDate = easternDateString(observedAt);
        const currentIds = [...new Set(pccObs.map(o => o.vehicle_id))].sort();

        // Which PCC cars were seen earlier today, and which in the last few minutes?
        const { data: samples, error: sampleErr } = await supabase
            .from('pcc_samples')
            .select('sampled_at, vehicle_ids')
            .gte('sampled_at', easternMidnightIso(observedAt))
            .lt('sampled_at', observedAt.toISOString())
            .gt('pcc_count', 0)
            .order('sampled_at', { ascending: false })
            .limit(600);
        if (sampleErr) { console.error('Push alerts: sample lookup failed', sampleErr); return; }

        const seenToday = new Set();
        const seenRecently = new Set();
        const cutoff = observedAt.getTime() - recentMinutes * 60 * 1000;
        for (const s of samples || []) {
            const recent = new Date(s.sampled_at).getTime() >= cutoff;
            for (const id of s.vehicle_ids || []) {
                seenToday.add(id);
                if (recent) seenRecently.add(id);
            }
        }

        // 1. First PCC sighting of the day, for phones on "first" mode.
        if (seenToday.size === 0) {
            console.log(`Push alerts: first PCC sighting today (${currentIds.join(', ')})`);
            if (await claim(supabase, alertDate, 'service_started', currentIds)) {
                const tokens = await loadSubscribers(supabase, 'first');
                await deliver({
                    supabase, config, tokens, message: serviceStartedMessage(currentIds),
                    type: 'service_started', threadId: 'service-started', vehicleIds: currentIds,
                    alertDate, alertType: 'service_started'
                });
            }
        } else {
            console.log('Push alerts: a PCC was already seen today, no first-of-day alert');
        }

        // 2. Cars that just came out (not seen in the last few minutes), for phones on "each" mode.
        const newCars = currentIds.filter(id => !seenRecently.has(id));
        if (!newCars.length) return;
        let eachTokens = null;
        for (const id of newCars) {
            const alertType = `car_online:${id}`;
            if (!(await claim(supabase, alertDate, alertType, [id]))) continue;
            if (eachTokens === null) eachTokens = await loadSubscribers(supabase, 'each');
            console.log(`Push alerts: car ${id} came out, ${eachTokens.length} phones on each-car mode`);
            await deliver({
                supabase, config, tokens: eachTokens, message: carOnlineMessage(id, currentIds.length),
                type: 'car_online', threadId: 'car-online', vehicleIds: [id],
                alertDate, alertType
            });
        }
    } catch (err) {
        console.error('Push alerts: unexpected error', err);
    }
}
