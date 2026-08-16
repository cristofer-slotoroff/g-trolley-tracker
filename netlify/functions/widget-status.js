// widget-status.js - Tiny status feed for the Philly Trolleys home screen widget. Added 2026-08-15.
// GET -> { updatedAt, pccCount, busCount, vehicles: [{ id, direction, destination, lateMinutes }] }
// Reads SEPTA's live G1 vehicle feed and keeps only what the widget shows. Cached for 60 seconds.

// PCC cars have 4-digit IDs starting with "23" (same rule as app.js and pcc-tracker.js).
function isPCCTrolley(label) {
    return !!label && label.startsWith('23') && label.length === 4;
}

function getDirection(destination) {
    const dest = (destination || '').toUpperCase();
    if (['RICHMOND', 'FISHTOWN', 'FRANKFORD', 'DELAWARE', 'WESTMORELAND'].some(d => dest.includes(d))) return 'Eastbound';
    if (['63RD', 'PARKSIDE', '63'].some(d => dest.includes(d))) return 'Westbound';
    return 'Unknown';
}

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60'
};

export const handler = async () => {
    try {
        const response = await fetch('https://www3.septa.org/api/TransitView/index.php?route=G1', {
            headers: { 'Accept': 'application/json', 'User-Agent': 'PhillyTrolleys-Widget/1.0' }
        });
        if (!response.ok) throw new Error(`SEPTA API returned ${response.status}`);
        const data = await response.json();
        const list = Array.isArray(data.bus) ? data.bus : [];

        const vehicles = [];
        let busCount = 0;
        for (const v of list) {
            const label = String(v.label || v.VehicleID || '');
            if (!label || label === 'None' || label === '0') continue;
            if (isPCCTrolley(label)) {
                vehicles.push({
                    id: label,
                    direction: getDirection(v.destination),
                    destination: v.destination || '',
                    lateMinutes: Number(v.late) || 0
                });
            } else {
                busCount++;
            }
        }
        vehicles.sort((a, b) => a.id.localeCompare(b.id));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                updatedAt: new Date().toISOString(),
                pccCount: vehicles.length,
                busCount,
                vehicles
            })
        };
    } catch (error) {
        console.error('widget-status error:', error);
        return {
            statusCode: 502,
            headers: { ...headers, 'Cache-Control': 'no-store' },
            body: JSON.stringify({ error: 'SEPTA data unavailable', message: error.message })
        };
    }
};
