// apns.js - Send iPhone push alerts straight to Apple (APNs), no third-party service.
// Added 2026-08-15 for Philly Trolleys alerts.
//
// Needs these Netlify environment variables (from the Apple Developer account):
//   APNS_TEAM_ID      10-character Team ID (Membership page)
//   APNS_KEY_ID       10-character Key ID of an APNs auth key
//   APNS_PRIVATE_KEY  the .p8 file contents (BEGIN PRIVATE KEY ... END PRIVATE KEY), newlines as \n are fine
//   APNS_TOPIC        the app bundle ID (defaults to com.cristoferslotoroff.phillytrolleys)
//   APNS_SANDBOX      "true" while testing builds run from Xcode; "false" for TestFlight and App Store builds
//
// Uses Node's built-in http2 and crypto modules only.

import http2 from 'node:http2';
import crypto from 'node:crypto';

const DEFAULT_TOPIC = 'com.cristoferslotoroff.phillytrolleys';

function b64url(input) {
    return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function apnsConfigFromEnv(env = process.env) {
    const teamId = env.APNS_TEAM_ID;
    const keyId = env.APNS_KEY_ID;
    const privateKey = (env.APNS_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!teamId || !keyId || !privateKey) return null;
    return {
        teamId,
        keyId,
        privateKey,
        topic: env.APNS_TOPIC || DEFAULT_TOPIC,
        sandbox: String(env.APNS_SANDBOX || 'true').toLowerCase() === 'true'
    };
}

// Apple wants a JWT signed with ES256, header {alg, kid}, claims {iss, iat}. Valid for an hour.
export function makeApnsJwt({ teamId, keyId, privateKey }, nowSeconds = Math.floor(Date.now() / 1000)) {
    const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId }));
    const claims = b64url(JSON.stringify({ iss: teamId, iat: nowSeconds }));
    const signingInput = `${header}.${claims}`;
    const signature = crypto.sign('sha256', Buffer.from(signingInput), {
        key: privateKey,
        dsaEncoding: 'ieee-p1363' // raw r||s, which is what JWT ES256 expects
    });
    return `${signingInput}.${b64url(signature)}`;
}

// Send one payload to many device tokens over a single HTTP/2 connection.
// Returns { sent, failed, unregistered } where unregistered lists tokens Apple says are gone.
export function sendPushes({ tokens, payload, config, concurrency = 10, timeoutMs = 7000 }) {
    return new Promise((resolve) => {
        const result = { sent: 0, failed: 0, unregistered: [], errors: [] };
        if (!tokens.length) return resolve(result);

        const host = config.sandbox ? 'https://api.sandbox.push.apple.com' : 'https://api.push.apple.com';
        const jwt = makeApnsJwt(config);
        const body = Buffer.from(JSON.stringify(payload));
        const client = http2.connect(host);
        let finished = false;

        const finish = () => {
            if (finished) return;
            finished = true;
            try { client.close(); } catch (e) { /* ignore */ }
            resolve(result);
        };
        const timer = setTimeout(() => {
            result.errors.push('timeout');
            finish();
        }, timeoutMs);

        client.on('error', (err) => {
            result.errors.push(`connection: ${err.message}`);
            clearTimeout(timer);
            finish();
        });

        let index = 0;
        let inFlight = 0;

        const next = () => {
            if (finished) return;
            if (index >= tokens.length && inFlight === 0) {
                clearTimeout(timer);
                return finish();
            }
            while (inFlight < concurrency && index < tokens.length) {
                const token = tokens[index++];
                inFlight++;
                const req = client.request({
                    ':method': 'POST',
                    ':path': `/3/device/${token}`,
                    'authorization': `bearer ${jwt}`,
                    'apns-topic': config.topic,
                    'apns-push-type': 'alert',
                    'apns-priority': '10',
                    'apns-expiration': String(Math.floor(Date.now() / 1000) + 3600),
                    'content-type': 'application/json',
                    'content-length': String(body.length)
                });
                let status = 0;
                let data = '';
                req.on('response', (headers) => { status = headers[':status']; });
                req.on('data', (chunk) => { data += chunk; });
                req.on('end', () => {
                    inFlight--;
                    if (status === 200) {
                        result.sent++;
                    } else {
                        result.failed++;
                        let reason = '';
                        try { reason = JSON.parse(data).reason || ''; } catch (e) { reason = data.slice(0, 80); }
                        result.errors.push(`${status} ${reason}`);
                        // 410 means the phone deleted the app or turned alerts off at the system level.
                        if (status === 410 || reason === 'Unregistered') result.unregistered.push(token);
                    }
                    next();
                });
                req.on('error', (err) => {
                    inFlight--;
                    result.failed++;
                    result.errors.push(`request: ${err.message}`);
                    next();
                });
                req.end(body);
            }
        };
        next();
    });
}

// Message text for the daily "trolleys are out" alert.
export function serviceStartedMessage(vehicleIds) {
    const ids = [...new Set(vehicleIds)].sort();
    let body;
    if (ids.length === 1) body = `Car ${ids[0]} is on the G Line right now.`;
    else if (ids.length === 2) body = `Cars ${ids[0]} and ${ids[1]} are on the G Line right now.`;
    else body = `${ids.length} cars are on the G Line right now: ${ids.join(', ')}.`;
    return { title: 'PCC trolleys are out', body };
}
