# Trolley Analytics Redesign — Design Spec

**Date:** 2026-06-09
**Status:** Approved pending user spec review

## Purpose

Make the stats dashboard more digestible and surface "cool stats" easily. Rename the section, reorganize it into collapsible subsections, rank the trolley roster, add all-time records, and group service history by month.

## Scope

Frontend: `index.html`, `app.js`, `styles.css`. Backend: `netlify/functions/pcc-stats.js` plus new Supabase SQL views (run once in SQL Editor). No changes to G1 tracking, route planning, or the tracker/summary functions.

## 1. Rename + intro copy

- Toggle button text: "When Are Trolleys Usually Running?" → **"See Trolley Analytics"**.
- Intro card second paragraph becomes: *"PCC trolleys tend to run from early morning into early evening. When no trolleys are running, you will see buses servicing the route. Tap "See Trolley Analytics" to explore service patterns, the trolley roster, and all-time records."*

## 2. Section structure (approved: Option B)

Inside the expanded analytics section, top to bottom:

1. **When Are Trolleys Usually Running?** — collapsible subheader, **open by default**. Contains: Days Tracked / Typical Hours / Best Time stat boxes, Today's Trolleys, and the trolleys-per-hour chart.
2. **All-Time Stats** — collapsible subheader, **collapsed by default**.
3. **PCC Trolley Roster** — **always visible** (not collapsible), ranked.
4. **Service History** — collapsible subheader, open by default, Month > Weeks > Days hierarchy.

**Removed:** the "Previous [Mondays]" same-day-of-week history section (`sameDayHistory` rendering, "Activity by Day"). Backend may keep returning the field; frontend stops rendering it.

No emojis anywhere — plain text labels and existing app styling. Roster keeps the existing `Graphics/EB_PCC_App_Logo.svg` icon.

## 3. Ranked, clickable roster

- Horizontal scrolling strip (current layout), sorted by **all-time days in service** (descending). Rank number shown on each chip (1, 2, 3...).
- Concise hint label under the heading: "Ranked by days in service — tap a trolley for stats."
- **Tap behavior (approved: Option A):** a single shared detail panel appears directly below the strip; tapping another trolley swaps the panel contents; tapping the same trolley again closes it.
- Panel contents per vehicle: rank, days in service (all-time), average days/week, total all-time trips, first seen date, last ran date.

## 4. All-Time Stats (6 items, approved)

Rendered as simple stat rows/cards:

1. **Workhorse trolley** — most days in service; show days and total trips. If a different vehicle leads on trips, show both ("Most days: #X · Most trips: #Y").
2. **Newest trolley** — most recent first-seen date, with that date.
3. **Biggest day** — date with most trips and the count; **tappable** to open that day's hourly detail (reuses the existing day-detail mechanism / `pcc-day-detail` endpoint).
4. **Most trolleys in one day** — count, date, and the vehicle numbers.
5. **True trolley days** — count of days where most daytime samples (7am–10pm) had a PCC trolley running rather than bus-only service. Footnote: bus data begins Feb 2026.
6. **Total all-time trips** — single number.

## 5. Service History: Month > Weeks > Days

- Days grouped into weeks (existing week grouping), weeks grouped into **months** ("June 2026").
- Collapse hierarchy: months collapse/expand; within an open month, weeks collapse/expand; days render as today (tappable for hourly detail).
- Default state: **current month open, showing its weeks** (current week expanded as now); all earlier months collapsed.
- Collapsed month header shows a compact summary: e.g. "May 2026 — 24 service days, ~610 trips".

## 6. Backend: real trip counts (new SQL views)

Today, historical trips are estimated (`observations / 10`). Raw observations for all history exist in `pcc_observations`, so trips can be computed exactly server-side.

Create via SQL Editor, each `WITH (security_invoker = true)` so the Security Advisor stays clean. The Netlify function reads them as service role (bypasses RLS); anon users get nothing because the underlying tables have RLS with no policies:

1. **`vehicle_alltime_stats` view** — per vehicle: `days_active`, `first_seen_date`, `last_seen_date`, `total_trips`. Trip logic in SQL mirrors the JS: per vehicle per day, order observations by time; new trip when direction changes or gap > 30 min (window functions `lag()`).
2. **`daily_trip_stats` view** — per date: `total_trips`, `eb_trips`, `wb_trips`, `vehicle_count`, `vehicle_ids`.
3. **`daily_trolley_share` view** — per date from `pcc_samples` (7am–10pm ET samples): share of samples with `pcc_count > 0`; flags `is_true_trolley_day` when share > 0.5. Only meaningful from Feb 2026 onward.

`pcc-stats.js` queries these three views (one row per vehicle/day — well under the 1000-row cap for years) and:

- Replaces `estimateTrips()` usage for historical days with exact values.
- Adds `vehicleAllTime` (per-vehicle stats for roster + panel), `allTimeRecords` (the 6 stats), and month-grouped fields if convenient (frontend can also group client-side; decision: group client-side, keep API shape simple).
- Keeps existing response fields intact so nothing else breaks.

## 7. Error handling

- If the new views are missing or queries fail, `pcc-stats` falls back to current behavior (estimates, roster ranked by existing `allTimeVehicleStats`); All-Time Stats section hides itself if `allTimeRecords` is absent.
- Frontend: collapsible state is per-session (no persistence needed).

## 8. Testing / verification

- Run view SQL in Supabase; spot-check a known day's trips against the JS-computed value for today.
- Verify `pcc-stats` response locally (`netlify dev` or deployed) contains new fields.
- Manual UI pass on mobile width: roster scroll, detail panel, month collapse, day-detail taps.
- Confirm Security Advisor stays clean (new views must not trigger SECURITY DEFINER warnings).

## Out of scope

- Per-vehicle hourly patterns, photos, or external roster metadata.
- Changes to tracker cadence or new tables.
