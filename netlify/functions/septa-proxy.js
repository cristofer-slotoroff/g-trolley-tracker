// Netlify serverless function to proxy SEPTA API requests
// This avoids CORS issues when calling from the browser

exports.handler = async (event) => {
    const params = event.queryStringParameters || {};
    const type = params.type || 'trolleys';

    let url;

    if (type === 'trolleys') {
        url = 'https://www3.septa.org/api/TransitViewAll/index.php';
    } else if (type === 'trains') {
        // Dynamic origin/destination for Regional Rail
        const origin = params.origin || 'East Falls';
        const dest = params.dest || 'North Broad St';
        url = `https://www3.septa.org/hackathon/NextToArrive/${encodeURIComponent(origin)}/${encodeURIComponent(dest)}/10`;
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
