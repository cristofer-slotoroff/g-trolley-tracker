// visitor-stats.js - public visitor counts for the "Fellow Philly Trolley
// Trackers" card on the WEBSITE (added 2026-09-16). Reads one row from the
// visitor_public_stats view (supabase/analytics-views.sql). Counts only, no
// per-person data. Cached an hour at the edge.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export const handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
    };
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    try {
        const { data, error } = await supabase.from('visitor_public_stats').select('*').single();
        if (error) throw error;
        return {
            statusCode: 200, headers,
            body: JSON.stringify({
                visitsAllTime: data.visits_all_time,
                visitorsAllTime: data.visitors_all_time,
                visits30Days: data.visits_30_days,
                visitors30Days: data.visitors_30_days,
                visitsPerDay30: data.visits_per_day_30,
                returningVisitors: data.returning_visitors,
                returningSharePct: data.returning_share_pct
            })
        };
    } catch (e) {
        console.error('visitor-stats error:', e.message);
        return { statusCode: 500, headers: { ...headers, 'Cache-Control': 'no-store' }, body: JSON.stringify({ error: 'unavailable' }) };
    }
};
