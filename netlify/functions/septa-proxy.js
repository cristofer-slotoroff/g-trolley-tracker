// Netlify serverless function to proxy SEPTA API requests
// This avoids CORS issues when calling from the browser

exports.handler = async (event) => {
    const params = event.queryStringParameters || {};
    const type = params.type || 'trolleys';

    let url;

    if (type === 'trolleys') {
        // Fetch all transit data (buses, trolleys, subway)
        url = 'https://www3.septa.org/api/TransitViewAll/index.php';
    } else if (type === 'transit') {
        // Fetch specific route data
        // Routes: BSL (B), MFL (L), NHSL (M), 101, 102 (D), 10, 11, 13, 34, 36 (T), G1 (G)
        const route = params.route;
        if (route) {
            url = `https://www3.septa.org/api/TransitView/index.php?route=${encodeURIComponent(route)}`;
        } else {
            url = 'https://www3.septa.org/api/TransitViewAll/index.php';
        }
    } else if (type === 'trains') {
        // Dynamic origin/destination for Regional Rail (legacy NextToArrive)
        const origin = params.origin || 'East Falls';
        const dest = params.dest || 'North Broad St';
        url = `https://www3.septa.org/hackathon/NextToArrive/${encodeURIComponent(origin)}/${encodeURIComponent(dest)}/10`;
    } else if (type === 'arrivals') {
        // Station arrivals/departures - shows ALL trains from a station
        const station = params.station || 'Temple University';
        const results = params.results || 10;
        url = `https://www3.septa.org/api/Arrivals/index.php?station=${encodeURIComponent(station)}&results=${results}`;
    } else if (type === 'stops') {
        // Fetch stops for a specific route
        const route = params.route || 'G1';
        url = `https://www3.septa.org/api/Stops/index.php?req1=${encodeURIComponent(route)}`;
    } else if (type === 'schedule') {
        // Fetch bus/trolley schedule for a specific stop
        // Works for trolley routes (101, 102, 10, 11, 13, 34, 36) and buses
        const stopId = params.stop_id;
        if (!stopId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'stop_id parameter required' })
            };
        }
        url = `https://www3.septa.org/api/BusSchedules/index.php?stop_id=${encodeURIComponent(stopId)}`;
    } else if (type === 'nexttoarrive') {
        // Get trip times between two Regional Rail stations
        // Returns scheduled and real-time arrival info
        const origin = params.origin;
        const dest = params.dest;
        const count = params.count || 5;
        if (!origin || !dest) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'origin and dest parameters required' })
            };
        }
        url = `https://www3.septa.org/api/NextToArrive/index.php?req1=${encodeURIComponent(origin)}&req2=${encodeURIComponent(dest)}&req3=${count}`;
    } else {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Invalid request type' })
        };
    }

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PCC-Trolley-Tracker/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`SEPTA API returned ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=30'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('SEPTA API Error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to fetch SEPTA data',
                message: error.message
            })
        };
    }
};
