// alerts.js - Decides which push alerts to send on each tracker run. Added 2026-08-16.
//
// Two alert modes, chosen per phone in the app (push_subscriptions.alert_mode):
//   'first'  one alert a day, when the first PCC car of the day appears
//   'each'   an alert every time a PCC car comes out (including the first), at most once per car per day
//
// Every alert is "claimed" in push_alerts_sent (primary key alert_date + alert_type) before sending,
// so overlapping tracker runs cannot double-send.

import { apnsConfigFromEnv, sendPushes } from './apns.js';
import { stopIndexFromId } from './g-stops.js';

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

// Alert wording (Cris, 2026-08-16). Title carries the news; the body adds one detail line.
function directionWord(direction) {
    return direction === 'Eastbound' || direction === 'Westbound' ? direction : '';
}

function directionArrows(direction) {
    if (direction === 'Eastbound') return 'EB \u25B6';   // EB ▶
    if (direction === 'Westbound') return '\u25C0 WB';   // ◀ WB
    return '';
}

// First PCC of the day. cars: [{ vehicle_id, direction }]
export function firstOfDayMessage(cars) {
    const ids = [...new Map(cars.map(c => [c.vehicle_id, c])).values()].sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id));
    if (ids.length === 1) {
        const dir = directionWord(ids[0].direction);
        return { title: `PCC Trolley #${ids[0].vehicle_id} now running${dir ? ' ' + dir : ''}`, body: 'First PCC of the day on the G Line.' };
    }
    return { title: `PCC Trolleys ${ids.map(c => '#' + c.vehicle_id).join(', ')} now running`, body: `First PCCs of the day on the G Line (${ids.length} Trolleys).` };
}

// A car that just came out. car: { vehicle_id, direction }; allIds: every PCC id out right now.
export function carOnlineMessage(car, allIds) {
    const arrows = directionArrows(car.direction);
    const total = allIds.length;
    const count = total === 1 ? '(1 Trolley)' : `(${total} Trolleys)`;
    return {
        title: `PCC Trolley #${car.vehicle_id} now running${arrows ? ' ' + arrows : ''} ${count}`,
        body: `PCCs Out Now: ${[...allIds].sort().map(id => '#' + id).join(', ')}`
    };
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
                    supabase, config, tokens, message: firstOfDayMessage(pccObs),
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
            const car = pccObs.find(o => o.vehicle_id === id) || { vehicle_id: id, direction: '' };
            await deliver({
                supabase, config, tokens: eachTokens, message: carOnlineMessage(car, currentIds),
                type: 'car_online', threadId: 'car-online', vehicleIds: [id],
                alertDate, alertType
            });
        }
    } catch (err) {
        console.error('Push alerts: unexpected error', err);
    }
}

// ---------------------------------------------------------------------------------------------
// Stop alerts (added 2026-08-16): "tell me when a PCC car is N stops from my stop, heading my way".
// Any number of saved stops per phone (push_stop_alerts). Each car is alerted once per trip per saved stop
// (push_stop_alerts_sent), so a car that lingers a few runs inside the window does not repeat.
// ---------------------------------------------------------------------------------------------


export function stopAlertMessage({ vehicleId, distance, stopName, direction }) {
    const heading = direction === 'Eastbound' ? 'heading east' : 'heading west';
    const arrows = directionArrows(direction);
    let title;
    if (distance <= 0) title = `PCC Trolley #${vehicleId} is Arriving Now`;
    else if (distance === 1) title = `PCC Trolley #${vehicleId} is 1 Stop Away`;
    else title = `PCC Trolley #${vehicleId} is ${distance} Stops Away`;
    if (arrows) title += ` ${arrows}`;
    return { title, body: `${stopName}, ${heading}` };
}

// vehicles: [{ vehicle_id, direction, next_stop_id, trip }] for the PCC cars seen this run.
export async function runStopAlerts({ supabase, vehicles, observedAt }) {
    if (!vehicles || !vehicles.length) return;
    try {
        const config = apnsConfigFromEnv();
        if (!config) return;

        const { data: subs, error: subsErr } = await supabase
            .from('push_stop_alerts')
            .select('id, token, direction, stop_index, stop_name, stops_away')
            .eq('enabled', true);
        if (subsErr) {
            // Table not created yet or unreachable: nothing to do.
            if (!/push_stop_alerts/i.test(subsErr.message || '')) console.error('Stop alerts: lookup failed', subsErr);
            return;
        }
        if (!subs || !subs.length) return;

        // Positions of the cars on the west-to-east line.
        const cars = vehicles
            .map(v => ({ ...v, index: stopIndexFromId(v.next_stop_id) }))
            .filter(v => v.index >= 0 && (v.direction === 'Eastbound' || v.direction === 'Westbound'));
        if (!cars.length) return;

        // Only send to phones whose subscription is still enabled for alerts at all.
        const tokens = subs.map(s => s.token);
        const { data: live } = await supabase
            .from('push_subscriptions')
            .select('token')
            .in('token', tokens)
            .eq('enabled', true);
        const liveTokens = new Set((live || []).map(r => r.token));

        for (const sub of subs) {
            if (!liveTokens.has(sub.token)) continue;
            for (const car of cars) {
                if (car.direction !== sub.direction) continue;
                const distance = sub.direction === 'Eastbound' ? sub.stop_index - car.index : car.index - sub.stop_index;
                if (distance < 0 || distance > sub.stops_away) continue;

                // Once per car per trip per phone. Fall back to a direction+hour key when SEPTA gives no trip id.
                const tripKey = car.trip ? String(car.trip) : `${car.direction}:${observedAt.toISOString().slice(0, 13)}`;
                const { error: claimErr } = await supabase
                    .from('push_stop_alerts_sent')
                    .insert({ token: sub.token, stop_alert_id: sub.id, vehicle_id: car.vehicle_id, trip: tripKey });
                if (claimErr) {
                    if (claimErr.code !== '23505') console.error('Stop alerts: claim failed', claimErr);
                    continue;
                }

                const message = stopAlertMessage({ vehicleId: car.vehicle_id, distance, stopName: sub.stop_name, direction: sub.direction });
                const payload = {
                    aps: { alert: { title: message.title, body: message.body }, sound: 'default', 'thread-id': 'stop-alert' },
                    type: 'stop_alert',
                    vehicles: [car.vehicle_id]
                };
                const result = await sendPushes({ tokens: [sub.token], payload, config });
                console.log(`Stop alerts: car ${car.vehicle_id} ${distance} stops from ${sub.stop_name} (${sub.direction}): sent ${result.sent}, failed ${result.failed}`, result.errors.slice(0, 2));
                if (result.unregistered.length) {
                    await supabase.from('push_subscriptions')
                        .update({ enabled: false, last_error: 'unregistered', updated_at: new Date().toISOString() })
                        .in('token', result.unregistered);
                }
            }
        }
    } catch (err) {
        console.error('Stop alerts: unexpected error', err);
    }
}
