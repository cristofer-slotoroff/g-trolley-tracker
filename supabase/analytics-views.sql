-- Analytics views for the trolley stats dashboard.
-- Run this whole file in the Supabase SQL Editor. Safe to re-run (CREATE OR REPLACE).
-- All views use security_invoker so they don't trigger SECURITY DEFINER advisor
-- warnings. The Netlify functions read them as service role (bypasses RLS);
-- anon users get nothing because the underlying tables have RLS with no policies.

-- ============================================================
-- View 1: vehicle_alltime_stats — per-vehicle all-time stats.
-- A "trip" = one continuous run in one direction by one vehicle on one day.
-- New trip when direction changes or gap > 30 min (matches the JS logic in
-- pcc-stats.js countTripsForDate).
-- ============================================================
CREATE OR REPLACE VIEW public.vehicle_alltime_stats
WITH (security_invoker = true) AS
WITH pcc_obs AS (
    SELECT vehicle_id, direction, observed_at,
           (observed_at AT TIME ZONE 'America/New_York')::date AS obs_date
    FROM public.pcc_observations
    WHERE vehicle_type = 'pcc' OR vehicle_type IS NULL
),
seq AS (
    SELECT vehicle_id, direction, observed_at, obs_date,
           LAG(direction)   OVER w AS prev_dir,
           LAG(observed_at) OVER w AS prev_time
    FROM pcc_obs
    WINDOW w AS (PARTITION BY vehicle_id, obs_date ORDER BY observed_at)
),
trip_starts AS (
    SELECT vehicle_id, obs_date, direction
    FROM seq
    WHERE direction IN ('Eastbound', 'Westbound')
      AND (prev_dir IS DISTINCT FROM direction
           OR observed_at - prev_time > INTERVAL '30 minutes')
),
trip_counts AS (
    SELECT vehicle_id, COUNT(*) AS total_trips
    FROM trip_starts
    GROUP BY vehicle_id
)
SELECT p.vehicle_id,
       COUNT(DISTINCT p.obs_date)      AS days_active,
       MIN(p.obs_date)                 AS first_seen_date,
       MAX(p.obs_date)                 AS last_seen_date,
       COALESCE(t.total_trips, 0)      AS total_trips
FROM pcc_obs p
LEFT JOIN trip_counts t USING (vehicle_id)
GROUP BY p.vehicle_id, t.total_trips;

-- ============================================================
-- View 2: daily_trip_stats — per-day exact trips and vehicles.
-- ============================================================
CREATE OR REPLACE VIEW public.daily_trip_stats
WITH (security_invoker = true) AS
WITH pcc_obs AS (
    SELECT vehicle_id, direction, observed_at,
           (observed_at AT TIME ZONE 'America/New_York')::date AS obs_date
    FROM public.pcc_observations
    WHERE vehicle_type = 'pcc' OR vehicle_type IS NULL
),
seq AS (
    SELECT vehicle_id, direction, observed_at, obs_date,
           LAG(direction)   OVER w AS prev_dir,
           LAG(observed_at) OVER w AS prev_time
    FROM pcc_obs
    WINDOW w AS (PARTITION BY vehicle_id, obs_date ORDER BY observed_at)
),
trip_starts AS (
    SELECT vehicle_id, obs_date, direction
    FROM seq
    WHERE direction IN ('Eastbound', 'Westbound')
      AND (prev_dir IS DISTINCT FROM direction
           OR observed_at - prev_time > INTERVAL '30 minutes')
),
day_trips AS (
    SELECT obs_date,
           COUNT(*) FILTER (WHERE direction = 'Eastbound') AS eb_trips,
           COUNT(*) FILTER (WHERE direction = 'Westbound') AS wb_trips,
           COUNT(*) AS total_trips
    FROM trip_starts
    GROUP BY obs_date
)
SELECT p.obs_date                          AS service_date,
       COUNT(DISTINCT p.vehicle_id)        AS vehicle_count,
       ARRAY_AGG(DISTINCT p.vehicle_id)    AS vehicle_ids,
       COALESCE(d.eb_trips, 0)             AS eb_trips,
       COALESCE(d.wb_trips, 0)             AS wb_trips,
       COALESCE(d.total_trips, 0)          AS total_trips
FROM pcc_obs p
LEFT JOIN day_trips d ON d.obs_date = p.obs_date
GROUP BY p.obs_date, d.eb_trips, d.wb_trips, d.total_trips;

-- ============================================================
-- View 3: daily_trolley_share — share of daytime service samples
-- (7am-10pm ET) where a PCC was running vs bus-only.
-- Only meaningful from Feb 2026 (bus_count collection start);
-- the API filters on service_date accordingly.
-- ============================================================
CREATE OR REPLACE VIEW public.daily_trolley_share
WITH (security_invoker = true) AS
SELECT (sampled_at AT TIME ZONE 'America/New_York')::date AS service_date,
       COUNT(*)                                    AS service_samples,
       COUNT(*) FILTER (WHERE pcc_count > 0)       AS pcc_samples,
       ROUND(100.0 * COUNT(*) FILTER (WHERE pcc_count > 0) / COUNT(*), 1)
                                                   AS pcc_share_pct,
       (COUNT(*) FILTER (WHERE pcc_count > 0) > COUNT(*) / 2.0)
                                                   AS is_true_trolley_day
FROM public.pcc_samples
WHERE EXTRACT(HOUR FROM sampled_at AT TIME ZONE 'America/New_York') BETWEEN 7 AND 22
  AND (pcc_count > 0 OR bus_count > 0)
GROUP BY 1;
