-- Push alerts for the Philly Trolleys iPhone app. Added 2026-08-15.
-- Run this whole file once in the Supabase SQL Editor. Safe to re-run.

-- Phones that opted in to alerts. One row per device token.
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    token       text PRIMARY KEY,
    platform    text NOT NULL DEFAULT 'ios',
    enabled     boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    last_error  text
);

-- One row per alert actually sent. The primary key stops two tracker runs from both sending
-- the same day's alert.
CREATE TABLE IF NOT EXISTS public.push_alerts_sent (
    alert_date   date NOT NULL,
    alert_type   text NOT NULL,
    sent_at      timestamptz NOT NULL DEFAULT now(),
    recipients   integer,
    failed       integer,
    vehicle_ids  text[],
    notes        text,
    PRIMARY KEY (alert_date, alert_type)
);

-- Lock both tables down. The Netlify functions use the service role, which bypasses RLS;
-- anonymous keys get nothing.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_alerts_sent   ENABLE ROW LEVEL SECURITY;

-- 2026-08-16: alert mode per phone. 'first' = one alert a day, 'each' = every car that starts running.
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS alert_mode text NOT NULL DEFAULT 'first';

-- 2026-08-16: stop alerts. One saved stop per phone, plus a once-per-car-per-trip record.
CREATE TABLE IF NOT EXISTS public.push_stop_alerts (
    token       text PRIMARY KEY,
    direction   text NOT NULL,
    stop_index  integer NOT NULL,
    stop_name   text NOT NULL,
    stops_away  integer NOT NULL DEFAULT 5,
    enabled     boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_stop_alerts_sent (
    token       text NOT NULL,
    vehicle_id  text NOT NULL,
    trip        text NOT NULL,
    sent_at     timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (token, vehicle_id, trip)
);

ALTER TABLE public.push_stop_alerts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_stop_alerts_sent ENABLE ROW LEVEL SECURITY;
