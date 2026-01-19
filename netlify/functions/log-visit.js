// log-visit.js - Simple page view tracker
// Records anonymous visits to Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Get basic info (no personal data)
        const userAgent = event.headers['user-agent'] || '';
        const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

        // Simple daily visitor tracking using date as a key
        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('page_views')
            .insert({
                visited_at: new Date().toISOString(),
                visit_date: today,
                is_mobile: isMobile
            });

        if (error) {
            console.error('Log visit error:', error);
            // Don't throw - analytics shouldn't break the app
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ logged: true })
        };

    } catch (error) {
        console.error('Visit logging error:', error);
        return {
            statusCode: 200, // Still return 200 so it doesn't affect user experience
            headers,
            body: JSON.stringify({ logged: false })
        };
    }
};
