# Trolley Analytics Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the stats dashboard to "See Trolley Analytics" and reorganize it: collapsible subsections, a ranked tap-for-details trolley roster, six all-time record stats, and Month > Weeks > Days service history — backed by new SQL views computing exact trip counts.

**Architecture:** Static frontend (vanilla JS, no build step) + Netlify functions + Supabase. Three new Postgres views compute all-time per-vehicle and per-day trip stats server-side; `pcc-stats.js` reads them and adds `vehicleAllTime` + `allTimeRecords` to its response (with graceful fallback if views are missing). Frontend restructures `index.html` and replaces/extends render functions in `app.js`.

**Tech Stack:** Vanilla JS, Netlify Functions (Node 18, esbuild), Supabase (`@supabase/supabase-js`), Postgres window functions.

**Spec:** `docs/superpowers/specs/2026-06-09-trolley-analytics-redesign-design.md`

**Testing note:** This repo has no test framework. Each task includes concrete verification commands (`node -e` syntax checks, curl against the deployed API, manual browser checks). The trip-count SQL is cross-checked against the existing JS trip logic for today's date.

---

### Task 1: SQL views file

**Files:**
- Create: `supabase/analytics-views.sql`

- [ ] **Step 1: Write the SQL file**

```sql
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
```

- [ ] **Step 2: Sanity-check the SQL parses (no DB access locally)**

Run: `node -e "const s=require('fs').readFileSync('supabase/analytics-views.sql','utf8'); console.log((s.match(/CREATE OR REPLACE VIEW/g)||[]).length + ' views, ' + (s.match(/security_invoker = true/g)||[]).length + ' invoker flags')"`
Expected: `3 views, 3 invoker flags`

- [ ] **Step 3: Commit**

```bash
git add supabase/analytics-views.sql
git commit -m "Add SQL views for all-time trip analytics"
```

**USER CHECKPOINT (can happen any time before final verification):** the user pastes `supabase/analytics-views.sql` into the Supabase SQL Editor and runs it, then verifies with:

```sql
SELECT * FROM vehicle_alltime_stats ORDER BY days_active DESC LIMIT 5;
SELECT * FROM daily_trip_stats ORDER BY total_trips DESC LIMIT 5;
SELECT * FROM daily_trolley_share ORDER BY service_date DESC LIMIT 5;
```

Each should return rows (no errors). The deployed code works (with estimates and hidden All-Time section) even before this runs.

---

### Task 2: Backend — pcc-stats.js reads the views

**Files:**
- Modify: `netlify/functions/pcc-stats.js`

- [ ] **Step 1: Fetch the three views in the handler**

In `netlify/functions/pcc-stats.js`, after the `dailySummaries` query block (after line 60, `if (summaryError) {...}`), insert:

```javascript
        // All-time analytics views (created via supabase/analytics-views.sql).
        // Small row counts: one per vehicle / per service day. Errors are
        // non-fatal: frontend hides All-Time Stats and falls back to estimates.
        const [vehicleViewRes, dailyTripsRes, shareRes] = await Promise.all([
            supabase.from('vehicle_alltime_stats').select('*'),
            supabase.from('daily_trip_stats').select('*')
                .order('service_date', { ascending: true }).limit(1000),
            supabase.from('daily_trolley_share').select('*')
                .gte('service_date', '2026-02-01').limit(1000)
        ]);
        const viewData = {
            vehicles: vehicleViewRes.error ? null : vehicleViewRes.data,
            dailyTrips: dailyTripsRes.error ? null : dailyTripsRes.data,
            trolleyShare: shareRes.error ? null : shareRes.data
        };
        if (vehicleViewRes.error) console.error('vehicle_alltime_stats error:', vehicleViewRes.error.message);
        if (dailyTripsRes.error) console.error('daily_trip_stats error:', dailyTripsRes.error.message);
        if (shareRes.error) console.error('daily_trolley_share error:', shareRes.error.message);
```

- [ ] **Step 2: Pass viewData into processObservations**

Change line 79 from:

```javascript
        const stats = processObservations(observations || [], samples || [], dailySummaries || []);
```

to:

```javascript
        const stats = processObservations(observations || [], samples || [], dailySummaries || [], viewData);
```

And the function signature (line 133) from:

```javascript
function processObservations(observations, samples, dailySummaries) {
```

to:

```javascript
function processObservations(observations, samples, dailySummaries, viewData = {}) {
```

- [ ] **Step 3: Build exact-trips lookup and use it for historical days**

Inside `processObservations`, immediately after the `estimateTrips` function definition (after line 253), add:

```javascript
    // Exact per-day trips from the daily_trip_stats view (all history).
    // Key: 'YYYY-MM-DD' -> { ebTrips, wbTrips, totalTrips }
    const exactTripsByDate = {};
    if (viewData.dailyTrips) {
        for (const row of viewData.dailyTrips) {
            exactTripsByDate[row.service_date] = {
                ebTrips: row.eb_trips,
                wbTrips: row.wb_trips,
                totalTrips: row.total_trips
            };
        }
    }
    // Prefer: view (exact, all history) > live computation > estimate.
    function tripsForDate(dateKey, ebObs, wbObs) {
        if (exactTripsByDate[dateKey]) return exactTripsByDate[dateKey];
        const live = countTripsForDate(dateKey);
        if (live.totalTrips > 0) return live;
        return {
            ebTrips: estimateTrips(ebObs),
            wbTrips: estimateTrips(wbObs),
            totalTrips: estimateTrips(ebObs) + estimateTrips(wbObs)
        };
    }
```

In the `sameDayHistory` mapping (lines 376-393), replace the body of the `.map(s => {...})` callback with:

```javascript
            const trips = tripsForDate(s.summary_date, s.eastbound_observations, s.westbound_observations);
            return {
                date: s.summary_date,
                vehicles: s.vehicle_ids || [],
                firstSeen: s.first_observation_time,
                lastSeen: s.last_observation_time,
                ebCount: s.eastbound_observations || 0,
                wbCount: s.westbound_observations || 0,
                ebTrips: trips.ebTrips,
                wbTrips: trips.wbTrips,
                totalTrips: trips.totalTrips,
                peakConcurrent: s.peak_concurrent_vehicles || 0,
                observations: s.total_observations
            };
```

In the `recentDays` loop, replace the `} else if (summary) {` branch (lines 505-519) with:

```javascript
        } else if (summary) {
            const trips = tripsForDate(dateKey, summary.eastbound_observations, summary.westbound_observations);
            recentDays.push({
                date: dateKey,
                isToday: false,
                observations: summary.total_observations,
                vehicles: summary.vehicle_ids || [],
                firstSeen: summary.first_observation_time,
                lastSeen: summary.last_observation_time,
                ebTrips: trips.ebTrips,
                wbTrips: trips.wbTrips,
                totalTrips: trips.totalTrips
            });
        } else {
```

- [ ] **Step 4: Compute vehicleAllTime and allTimeRecords**

Just before the `return {` statement (line 562), add:

```javascript
    // ============================================================
    // Per-vehicle all-time stats (from vehicle_alltime_stats view)
    // ============================================================
    let vehicleAllTime = null;
    if (viewData.vehicles && viewData.vehicles.length > 0) {
        vehicleAllTime = viewData.vehicles.map(v => {
            const firstSeen = new Date(v.first_seen_date + 'T12:00:00');
            const weeksTracked = Math.max(1, (now - firstSeen) / (7 * 24 * 60 * 60 * 1000));
            return {
                vehicleId: v.vehicle_id,
                daysActive: v.days_active,
                totalTrips: v.total_trips,
                firstSeen: v.first_seen_date,
                lastSeen: v.last_seen_date,
                daysPerWeek: Math.round((v.days_active / weeksTracked) * 10) / 10
            };
        }).sort((a, b) => b.daysActive - a.daysActive);
    }

    // ============================================================
    // All-time records (the 6 stats). Null if views unavailable —
    // frontend hides the section.
    // ============================================================
    let allTimeRecords = null;
    if (vehicleAllTime && viewData.dailyTrips && viewData.dailyTrips.length > 0) {
        const byTrips = [...vehicleAllTime].sort((a, b) => b.totalTrips - a.totalTrips);
        const byNewest = [...vehicleAllTime].sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
        const biggestDay = [...viewData.dailyTrips].sort((a, b) => b.total_trips - a.total_trips)[0];
        const mostVehiclesDay = [...viewData.dailyTrips].sort((a, b) => b.vehicle_count - a.vehicle_count)[0];
        allTimeRecords = {
            workhorse: {
                mostDays: vehicleAllTime[0],
                mostTrips: byTrips[0]
            },
            newest: byNewest[0],
            biggestDay: {
                date: biggestDay.service_date,
                totalTrips: biggestDay.total_trips,
                ebTrips: biggestDay.eb_trips,
                wbTrips: biggestDay.wb_trips
            },
            mostVehiclesDay: {
                date: mostVehiclesDay.service_date,
                count: mostVehiclesDay.vehicle_count,
                vehicleIds: mostVehiclesDay.vehicle_ids
            },
            trueTrolleyDays: viewData.trolleyShare
                ? viewData.trolleyShare.filter(r => r.is_true_trolley_day).length
                : null,
            totalTrips: viewData.dailyTrips.reduce((sum, r) => sum + r.total_trips, 0)
        };
    }
```

- [ ] **Step 5: Add the new fields to the response**

In the `return {` object, after the `allTimeVehicleStats,` line (line 567), add:

```javascript
        vehicleAllTime,
        allTimeRecords,
```

- [ ] **Step 6: Syntax check**

Run: `node --check netlify/functions/pcc-stats.js`
Expected: no output (exit 0)

- [ ] **Step 7: Commit**

```bash
git add netlify/functions/pcc-stats.js
git commit -m "pcc-stats: exact trips from views, vehicleAllTime + allTimeRecords"
```

---

### Task 3: index.html restructure

**Files:**
- Modify: `index.html:42-105`

- [ ] **Step 1: Update intro copy (line 42)**

Replace:

```html
            <p>PCC trolleys tend to run from early morning into early evening. When no trolleys are running, you will see buses servicing the route. Check out "When Are Trolleys Usually Running?" to view analytics.</p>
```

with:

```html
            <p>PCC trolleys tend to run from early morning into early evening. When no trolleys are running, you will see buses servicing the route. Tap "See Trolley Analytics" to explore service patterns, the trolley roster, and all-time records.</p>
```

- [ ] **Step 2: Rename the toggle (line 48)**

Replace:

```html
                <span class="stats-toggle-text">When Are Trolleys Usually Running?</span>
```

with:

```html
                <span class="stats-toggle-text">See Trolley Analytics</span>
```

- [ ] **Step 3: Restructure the stats body**

Replace the entire `<div id="stats-data" ...>` block (lines 56-105) with:

```html
                <div id="stats-data" class="stats-data" style="display: none;">
                    <!-- Subsection: When Are Trolleys Usually Running? (open by default) -->
                    <div class="stats-subsection expanded" id="subsection-usual">
                        <button class="subsection-toggle" onclick="toggleSubsection('subsection-usual')" aria-expanded="true" aria-controls="subsection-usual-content">
                            <span>When Are Trolleys Usually Running?</span>
                            <span class="subsection-icon">&#9660;</span>
                        </button>
                        <div class="subsection-content" id="subsection-usual-content">
                            <p class="stats-intro">Based on daily tracking data in the app, here's when PCC trolleys typically run. Note: inclement weather and maintenance can affect service.</p>
                            <div class="stats-summary">
                                <div class="stat-box">
                                    <span class="stat-value" id="stat-days-tracked">--</span>
                                    <span class="stat-label">Days Tracked</span>
                                </div>
                                <div class="stat-box">
                                    <span class="stat-value" id="stat-typical-hours">--</span>
                                    <span class="stat-label">Typical Hours</span>
                                </div>
                                <div class="stat-box">
                                    <span class="stat-value" id="stat-best-time">--</span>
                                    <span class="stat-label">Best Time</span>
                                </div>
                            </div>
                            <div class="stats-section today-section" id="today-section">
                                <h3 id="today-header">Today's Trolleys</h3>
                                <div id="today-content"></div>
                            </div>
                            <div class="stats-section">
                                <h3>How Many Trolleys Run Each Hour?</h3>
                                <p class="stats-note" id="hourly-subtitle"></p>
                                <div id="concurrency-chart" class="concurrency-chart"></div>
                                <p class="stats-note" id="peak-concurrent-note"></p>
                            </div>
                        </div>
                    </div>

                    <!-- Subsection: All-Time Stats (collapsed by default) -->
                    <div class="stats-subsection" id="subsection-alltime">
                        <button class="subsection-toggle" onclick="toggleSubsection('subsection-alltime')" aria-expanded="false" aria-controls="subsection-alltime-content">
                            <span>All-Time Stats</span>
                            <span class="subsection-icon">&#9660;</span>
                        </button>
                        <div class="subsection-content" id="subsection-alltime-content">
                            <div id="alltime-stats"></div>
                        </div>
                    </div>

                    <!-- PCC Trolley Roster (always visible) -->
                    <div class="stats-section roster-section">
                        <h3>PCC Trolley Roster</h3>
                        <p class="stats-note">Ranked by days in service &mdash; tap a trolley for stats.</p>
                        <div id="vehicle-roster" class="vehicle-roster"></div>
                        <div id="roster-detail" class="roster-detail" style="display: none;"></div>
                    </div>

                    <!-- Subsection: Service History (open by default) -->
                    <div class="stats-subsection expanded" id="subsection-history">
                        <button class="subsection-toggle" onclick="toggleSubsection('subsection-history')" aria-expanded="true" aria-controls="subsection-history-content">
                            <span>Service History</span>
                            <span class="subsection-icon">&#9660;</span>
                        </button>
                        <div class="subsection-content" id="subsection-history-content">
                            <p class="stats-note">Tap a day to see hourly detail:</p>
                            <div id="recent-days" class="recent-days"></div>
                        </div>
                    </div>
                </div>
```

Note this **removes** the "Activity by Day" section (`#day-history-header` / `#daily-chart`) — per spec, the "Previous Mondays" feature is dropped.

- [ ] **Step 4: Verify no dangling references**

Run: `grep -n "daily-chart\|day-history-header" index.html`
Expected: no output. (app.js references are removed in Task 4 — frontend won't error in between because Task 4 ships in the same push, but commit order keeps each commit coherent for review.)

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Restructure analytics section: subsections, roster panel, rename"
```

---

### Task 4: app.js — subsections, ranked roster, all-time stats, month grouping

**Files:**
- Modify: `app.js` (stats dashboard block, lines ~5649-6093)

- [ ] **Step 1: Add toggleSubsection helper**

After `toggleStats()` (after line 5615), add:

```javascript
function toggleSubsection(id) {
    const sub = document.getElementById(id);
    if (!sub) return;
    const expanded = sub.classList.toggle('expanded');
    const btn = sub.querySelector('.subsection-toggle');
    if (btn) btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}
```

- [ ] **Step 2: Update renderStats**

Replace lines 5668-5677 (the "Activity by Day" call through `renderRecentDays`) with:

```javascript
    // All-Time Stats (hidden if backend views aren't available)
    renderAllTimeStats(stats);

    // PCC Trolley Roster (ranked by days in service)
    renderVehicleRoster(stats.vehicleAllTime || stats.allTimeVehicleStats || stats.vehicleStats);

    // Service history
    renderRecentDays(stats.recentDays);
```

- [ ] **Step 3: Delete renderDayOfWeekHistory**

Delete the entire `renderDayOfWeekHistory` function (lines 5789-5862).

- [ ] **Step 4: Replace renderVehicleRoster with ranked + clickable version**

Replace the existing `renderVehicleRoster` (lines 5864-5878) with:

```javascript
// Roster state for the shared detail panel
let rosterData = [];
let selectedRosterVehicle = null;

function renderVehicleRoster(vehicleStats) {
    const container = document.getElementById('vehicle-roster');

    if (!vehicleStats || vehicleStats.length === 0) {
        container.innerHTML = '<p class="stats-note">No vehicles tracked yet.</p>';
        return;
    }

    // Already sorted by daysActive desc from the backend; sort defensively.
    rosterData = [...vehicleStats].sort((a, b) => (b.daysActive || 0) - (a.daysActive || 0));
    selectedRosterVehicle = null;

    container.innerHTML = rosterData.map((v, i) => `
        <div class="roster-vehicle" data-vehicle="${v.vehicleId}" onclick="toggleRosterDetail('${v.vehicleId}')">
            <span class="roster-rank">${i + 1}</span>
            <img src="Graphics/EB_PCC_App_Logo.svg" alt="PCC Trolley" class="roster-vehicle-icon">
            <span class="roster-vehicle-id">#${v.vehicleId}</span>
        </div>
    `).join('');
}

function formatRosterDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatLastRan(dateStr) {
    if (!dateStr) return null;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const fmt = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD local
    if (dateStr === fmt(today)) return 'Today';
    if (dateStr === fmt(yesterday)) return 'Yesterday';
    return formatRosterDate(dateStr);
}

function toggleRosterDetail(vehicleId) {
    const panel = document.getElementById('roster-detail');
    if (!panel) return;

    // Tap the selected trolley again: close the panel
    if (selectedRosterVehicle === vehicleId) {
        panel.style.display = 'none';
        selectedRosterVehicle = null;
        document.querySelectorAll('.roster-vehicle.selected').forEach(el => el.classList.remove('selected'));
        return;
    }

    const idx = rosterData.findIndex(v => String(v.vehicleId) === String(vehicleId));
    if (idx === -1) return;
    const v = rosterData[idx];
    selectedRosterVehicle = vehicleId;

    document.querySelectorAll('.roster-vehicle.selected').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.roster-vehicle[data-vehicle="${vehicleId}"]`)?.classList.add('selected');

    // Stats lines — only show what the data supports (fallback path lacks trips)
    const lines = [];
    lines.push(`${v.daysActive} day${v.daysActive !== 1 ? 's' : ''} in service${v.daysPerWeek ? ` &middot; ${v.daysPerWeek} days/week` : ''}`);
    if (typeof v.totalTrips === 'number') {
        lines.push(`${v.totalTrips.toLocaleString()} trip${v.totalTrips !== 1 ? 's' : ''} all-time`);
    }
    const firstSeen = formatRosterDate(v.firstSeen);
    const lastRan = formatLastRan(v.lastSeen);
    if (firstSeen) lines.push(`First seen ${firstSeen}`);
    if (lastRan) lines.push(`Last ran: ${lastRan}`);

    panel.innerHTML = `
        <div class="roster-detail-header">
            <span class="roster-detail-rank">#${idx + 1} of ${rosterData.length}</span>
            <span class="roster-detail-id">Trolley #${v.vehicleId}</span>
        </div>
        <div class="roster-detail-stats">
            ${lines.map(l => `<div class="roster-detail-line">${l}</div>`).join('')}
        </div>
    `;
    panel.style.display = 'block';
}
```

- [ ] **Step 5: Add renderAllTimeStats**

After the new roster functions, add:

```javascript
function renderAllTimeStats(stats) {
    const container = document.getElementById('alltime-stats');
    const subsection = document.getElementById('subsection-alltime');
    if (!container || !subsection) return;

    const r = stats.allTimeRecords;
    if (!r) {
        subsection.style.display = 'none';
        return;
    }
    subsection.style.display = '';

    const fmtDate = (dateStr) => new Date(dateStr + 'T12:00:00')
        .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const rows = [];

    // 1. Workhorse trolley
    const wd = r.workhorse.mostDays;
    const wt = r.workhorse.mostTrips;
    if (String(wd.vehicleId) === String(wt.vehicleId)) {
        rows.push({
            label: 'Workhorse trolley',
            value: `#${wd.vehicleId}`,
            detail: `${wd.daysActive} days in service &middot; ${wd.totalTrips.toLocaleString()} trips`
        });
    } else {
        rows.push({
            label: 'Workhorse trolley',
            value: `#${wd.vehicleId} / #${wt.vehicleId}`,
            detail: `Most days: #${wd.vehicleId} (${wd.daysActive}) &middot; Most trips: #${wt.vehicleId} (${wt.totalTrips.toLocaleString()})`
        });
    }

    // 2. Newest trolley
    rows.push({
        label: 'Newest trolley',
        value: `#${r.newest.vehicleId}`,
        detail: `First seen ${fmtDate(r.newest.firstSeen)}`
    });

    // 3. Biggest day (tappable -> hourly detail)
    rows.push({
        label: 'Biggest day',
        value: `${r.biggestDay.totalTrips} trips`,
        detail: `${fmtDate(r.biggestDay.date)} (${r.biggestDay.ebTrips} EB &middot; ${r.biggestDay.wbTrips} WB) &mdash; tap for hourly detail`,
        onclick: `toggleRecordDayDetail('${r.biggestDay.date}')`
    });

    // 4. Most trolleys in one day
    rows.push({
        label: 'Most trolleys in one day',
        value: `${r.mostVehiclesDay.count} trolleys`,
        detail: `${fmtDate(r.mostVehiclesDay.date)}: ${r.mostVehiclesDay.vehicleIds.map(v => '#' + v).join(', ')}`
    });

    // 5. True trolley days (only when bus data exists)
    if (r.trueTrolleyDays !== null) {
        rows.push({
            label: 'True trolley days',
            value: `${r.trueTrolleyDays} days`,
            detail: 'Days mostly served by trolleys, not buses (tracked since Feb 2026)'
        });
    }

    // 6. Total all-time trips
    rows.push({
        label: 'Total trips recorded',
        value: r.totalTrips.toLocaleString(),
        detail: 'Across all tracked days'
    });

    container.innerHTML = rows.map(row => `
        <div class="alltime-stat-row${row.onclick ? ' tappable' : ''}"${row.onclick ? ` onclick="${row.onclick}"` : ''}>
            <div class="alltime-stat-text">
                <span class="alltime-stat-label">${row.label}</span>
                <span class="alltime-stat-detail">${row.detail}</span>
            </div>
            <span class="alltime-stat-value">${row.value}</span>
        </div>
    `).join('') + `<div id="record-day-detail" class="recent-day-detail" style="display: none;"></div>`;
}

async function toggleRecordDayDetail(date) {
    const el = document.getElementById('record-day-detail');
    if (!el) return;
    if (el.style.display !== 'none') {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';
    if (dayDetailCache[date]) {
        renderDayDetailInto(el, dayDetailCache[date]);
        return;
    }
    el.innerHTML = '<div class="day-detail-loading">Loading hourly detail...</div>';
    try {
        const response = await fetch(`/.netlify/functions/pcc-day-detail?date=${date}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        dayDetailCache[date] = data;
        renderDayDetailInto(el, data);
    } catch (error) {
        console.error('Record day detail error:', error);
        el.innerHTML = '<p class="day-detail-empty">Unable to load detail.</p>';
    }
}
```

- [ ] **Step 6: Extract renderDayDetailInto from renderDayDetail**

Replace the first lines of `renderDayDetail` (lines 6042-6044):

```javascript
function renderDayDetail(date, data) {
    const detailEl = document.getElementById(`day-detail-${date}`);
    if (!detailEl) return;
```

with:

```javascript
function renderDayDetail(date, data) {
    const detailEl = document.getElementById(`day-detail-${date}`);
    if (!detailEl) return;
    renderDayDetailInto(detailEl, data);
}

function renderDayDetailInto(detailEl, data) {
```

(The rest of the original function body is unchanged — it only references `detailEl` and `data`.)

- [ ] **Step 7: Month > Weeks > Days grouping in renderRecentDays**

In `renderRecentDays`, replace the rendering loop (lines 5965-5989, from `let html = '';` through `container.innerHTML = html;`) with:

```javascript
    // Group weeks into months (by the Monday's month).
    // Spec: current month open showing weeks (current week expanded);
    // earlier months collapsed with a summary.
    const months = [];
    let currentMonth = null;
    for (const week of weeks) {
        const mKey = `${week.monday.getFullYear()}-${week.monday.getMonth()}`;
        if (!currentMonth || currentMonth.key !== mKey) {
            currentMonth = {
                key: mKey,
                label: week.monday.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                weeks: []
            };
            months.push(currentMonth);
        }
        currentMonth.weeks.push(week);
    }

    function renderWeek(week, isCurrentWeek) {
        const weekEnd = new Date(week.monday);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekLabel = isCurrentWeek ? 'This Week'
            : `${week.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        const serviceDaysInWeek = week.days.filter(d => d.observations > 0).length;
        const weekSummary = `${serviceDaysInWeek}/${week.days.length} days with service`;

        return `
            <div class="week-group ${isCurrentWeek ? 'expanded' : ''}">
                <div class="week-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <span class="week-label">${weekLabel}</span>
                    <span class="week-summary">${weekSummary}</span>
                    <span class="week-toggle-icon">▼</span>
                </div>
                <div class="week-days">
                    ${week.days.map(renderDayRow).join('')}
                </div>
            </div>
        `;
    }

    let html = '';
    months.forEach((month, mIdx) => {
        const isCurrentMonth = mIdx === 0;
        const allDays = month.weeks.flatMap(w => w.days);
        const serviceDays = allDays.filter(d => d.observations > 0).length;
        const totalTrips = allDays.reduce((sum, d) => sum + (d.totalTrips || 0), 0);
        const monthSummary = `${serviceDays} service day${serviceDays !== 1 ? 's' : ''}${totalTrips > 0 ? ` · ${totalTrips.toLocaleString()} trips` : ''}`;

        html += `
            <div class="month-group ${isCurrentMonth ? 'expanded' : ''}">
                <div class="month-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <span class="month-label">${month.label}</span>
                    <span class="month-summary">${monthSummary}</span>
                    <span class="week-toggle-icon">▼</span>
                </div>
                <div class="month-weeks">
                    ${month.weeks.map((w, wIdx) => renderWeek(w, mIdx === 0 && wIdx === 0)).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
```

- [ ] **Step 8: Syntax check**

Run: `node --check app.js`
Expected: no output (exit 0)

Run: `grep -n "renderDayOfWeekHistory\|daily-chart\|day-history-header" app.js`
Expected: no output

- [ ] **Step 9: Commit**

```bash
git add app.js
git commit -m "Analytics UI: subsections, ranked roster panel, all-time stats, month grouping"
```

---

### Task 5: styles.css — new component styles

**Files:**
- Modify: `styles.css` (append after the `.week-group.expanded .week-days` rule, line ~2480)

- [ ] **Step 1: Add styles**

Insert after line 2480 (`.week-group.expanded .week-days { ... }` closing brace):

```css
/* Collapsible analytics subsections */
.stats-subsection {
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(245, 241, 227, 0.08);
}

.subsection-toggle {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    background: transparent;
    border: none;
    color: var(--pcc-gold);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
}

.subsection-icon {
    font-size: 0.7rem;
    color: var(--pcc-cream-dim);
    transition: transform 0.2s;
}

.stats-subsection.expanded .subsection-icon {
    transform: rotate(180deg);
}

.subsection-content {
    display: none;
    padding-top: 8px;
}

.stats-subsection.expanded .subsection-content {
    display: block;
}

/* Ranked roster */
.roster-vehicle {
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: background 0.2s, border-color 0.2s;
}

.roster-vehicle:hover {
    background: rgba(0, 0, 0, 0.15);
}

.roster-vehicle.selected {
    background: rgba(0, 0, 0, 0.25);
    border-color: var(--pcc-gold);
}

.roster-rank {
    font-size: 0.65rem;
    font-weight: bold;
    color: var(--pcc-cream-dim);
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 1px 7px;
}

.roster-vehicle.selected .roster-rank {
    color: var(--pcc-gold);
}

/* Roster detail panel */
.roster-detail {
    margin-top: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border-left: 3px solid var(--pcc-gold);
}

.roster-detail-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 8px;
}

.roster-detail-rank {
    font-size: 0.7rem;
    color: var(--pcc-cream-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.roster-detail-id {
    font-weight: bold;
    color: var(--pcc-gold);
    font-size: 0.95rem;
}

.roster-detail-line {
    font-size: 0.8rem;
    color: var(--pcc-cream);
    padding: 2px 0;
}

/* All-time stat rows */
.alltime-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 10px;
    margin-bottom: 6px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
}

.alltime-stat-row.tappable {
    cursor: pointer;
    transition: background 0.2s;
}

.alltime-stat-row.tappable:hover {
    background: rgba(0, 0, 0, 0.25);
}

.alltime-stat-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--pcc-cream);
}

.alltime-stat-detail {
    display: block;
    font-size: 0.72rem;
    color: var(--pcc-cream-dim);
    margin-top: 2px;
}

.alltime-stat-value {
    font-weight: bold;
    color: var(--pcc-gold);
    font-size: 0.9rem;
    white-space: nowrap;
}

/* Month groups for service history */
.month-group {
    margin-bottom: 6px;
}

.month-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.month-header:hover {
    background: rgba(0, 0, 0, 0.4);
}

.month-label {
    font-weight: 600;
    color: var(--pcc-gold);
    font-size: 0.85rem;
}

.month-summary {
    flex: 1;
    text-align: right;
    color: var(--pcc-cream-dim);
    font-size: 0.75rem;
}

.month-group .week-toggle-icon {
    transition: transform 0.2s;
}

.month-group.expanded > .month-header .week-toggle-icon {
    transform: rotate(180deg);
}

.month-weeks {
    display: none;
    padding: 4px 0 0 6px;
}

.month-group.expanded .month-weeks {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
```

- [ ] **Step 2: Verify CSS braces balance**

Run: `node -e "const s=require('fs').readFileSync('styles.css','utf8'); console.log((s.match(/{/g)||[]).length === (s.match(/}/g)||[]).length ? 'balanced' : 'UNBALANCED')"`
Expected: `balanced`

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Styles for analytics subsections, ranked roster, all-time stats, month groups"
```

---

### Task 6: Local verification, push, live verification

**Files:** none (verification only)

- [ ] **Step 1: Full syntax pass**

Run: `node --check app.js && node --check netlify/functions/pcc-stats.js && echo OK`
Expected: `OK`

- [ ] **Step 2: Serve locally and inspect the UI**

Run: `python3 -m http.server 8888 &` then open `http://localhost:8888`.
Expected (no backend locally, so stats fetch fails — that's fine for structure checks):
- Intro card shows the new copy mentioning "See Trolley Analytics".
- Toggle button reads "See Trolley Analytics"; expanding shows the loading/error state without console errors about missing elements.

Kill the server afterwards: `kill %1`

- [ ] **Step 3: Push to deploy**

```bash
git push origin main
```

Netlify auto-deploys from `main` (static publish + functions, no build command).

- [ ] **Step 4: USER runs the SQL** (if not already done at Task 1 checkpoint)

User pastes `supabase/analytics-views.sql` into the Supabase SQL Editor, runs it, and confirms the three SELECT spot-checks return rows. Also confirm Security Advisor shows no new findings.

- [ ] **Step 5: Verify the live API**

Run: `curl -s "https://septa-g-trolley-tracker.netlify.app/.netlify/functions/pcc-stats" | python3 -c "import json,sys; d=json.load(sys.stdin); print('vehicleAllTime:', len(d.get('vehicleAllTime') or [])); print('allTimeRecords:', sorted((d.get('allTimeRecords') or {}).keys()))"`
Expected: `vehicleAllTime: <N >= 1>` and `allTimeRecords: ['biggestDay', 'mostVehiclesDay', 'newest', 'totalTrips', 'trueTrolleyDays', 'workhorse']`
(Note: the function response is cached for 5 minutes — if fields are missing right after running the SQL, wait 5 minutes and retry.)

- [ ] **Step 6: Manual UI pass on the live site (mobile width)**

- "See Trolley Analytics" expands; "When Are Trolleys Usually Running?" is open with 3 stat boxes, Today's Trolleys, hourly chart. No "Previous [day]s" section anywhere.
- "All-Time Stats" expands to the 6 rows; tapping "Biggest day" loads an hourly chart inline; tapping again closes it.
- Roster shows rank numbers, ordered by days; tapping a trolley opens the detail panel below with days, days/week, trips, first seen, last ran; tapping another swaps it; tapping the same closes it.
- Service History: current month open showing weeks, current week expanded showing days; previous months collapsed with "N service days · M trips" summaries; day rows still expand to hourly detail.
- Cross-check: today's trip count in "Today's Trolleys" should be plausible vs. `SELECT total_trips FROM daily_trip_stats WHERE service_date = CURRENT_DATE;`

- [ ] **Step 7: Update CLAUDE.md**

Add to RECENT FIXES: analytics redesign (renamed section, subsections, ranked roster, all-time stats via new SQL views in `supabase/analytics-views.sql`). Update the SUPABASE ANALYTICS section to mention the three views.

```bash
git add CLAUDE.md
git commit -m "Document analytics redesign in CLAUDE.md"
git push origin main
```
