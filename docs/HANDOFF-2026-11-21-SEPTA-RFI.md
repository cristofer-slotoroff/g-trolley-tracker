# Handoff: SEPTA RFI 26-00295-AXJC Response (written 2026-11-21 10:35 ET)

## The Goal
- A response to SEPTA RFI 26-00295-AXJC, "ITS Modernization for Real-Time Passenger Information" (L and B subway lines).
- Due Friday 2026-12-11, 4:00 PM EST (Addendum No. 1 moved it from Nov 23).
- Format: one PDF, 11-point type minimum, headings that mirror RFI Section 3.
- Send by email to Jason Calhoun, jcalhoun@septa.org, 215-580-7907. Cris sends it. No session sends it.
- Cris responds to Layer 3 only (Passenger Information System), as a software provider.
- The RFI is market research. It awards nothing and pays nothing. SEPTA may reuse anything submitted.

## Numbers (source named beside each)
- Draft: https://claude.ai/artifact/7sJ8UhNpF7fBkjTsLTg9Qu at rev 9, read 2026-11-21 10:35. Cris has made no edits.
- Open items in the draft: 9 of 9 unfilled (the "Open Items Before Sending" checklist in the draft).
- Days left: 20.
- Live pages, all HTTP 200 at 10:35: pcc-stats, push-status, log-visit, widget-status, pcc-lateness, pcc-headway.
- Repo: main even with origin at 2928af0 before this close-out commit.

## What Changed This Session
- 2026-11-18: added `netlify/functions/pcc-lateness.js` (commit 4f31bfc). GET ?date=YYYY-MM-DD. Counts only.
- 2026-11-18: added `netlify/functions/pcc-headway.js` (commit a9fd8ea). GET ?date=YYYY-MM-DD, optional ?at=lng,lng (up to 6), optional &diag=1 (commit 2928af0).
- 2026-11-20: wrote the draft response as a Claude doc (link above), with one chart.
- No change to the app, the tracker job, or the database.

## Findings (clean period only: 2026-08-17 to 2026-11-17, 65 weekdays, unless noted)
1. Trolleys ran on 178 of 304 days (Jan 18 to Nov 17). Tracker ran all 304 days.
2. On time (1 min early to 5 min late, my rule): trolleys 48%, buses 65%. Average late: 6.8 min against 3.4.
3. Weekday wait at Broad: 8.2 min AM, 9.3 midday, 9.3 afternoon, 13.0 evening.
4. One more vehicle: about 3 min off the wait at 9 to 10 PM; 0.6 min off at midday with 9 out.
5. A trolley is worth about half a bus for wait time.
6. East of Front St, midday eastbound wait is 19 to 22 min. SEPTA's schedule (GTFS v202611010) ends 25 of 115 weekday eastbound trips at Frankford-Delaware, all before 3 PM.
7. Bunching grows with distance from the trip start. Westbound 3 to 7 PM: 6% at the east end, 25% at 52nd St.
8. November weekdays: 96 eastbound passes at Broad against 115 scheduled (83%).
9. Feed test, 2026-11-18 11:43 to 16:28 (286 snapshots): 46 of 51 scheduled trips tracked. Misses cluster on two blocks: 9017 (vehicle 3687 listed, no position, all 5 trips) and 9025 (no vehicle listed).

## Corrections A Later Reader Must Not Rediscover
- The data has three eras. A: Jan 18 to Feb 15, trolleys only. B: Feb 16 to Aug 15, buses added, 9.8% of 5-minute batches lost (one rejected row cost the whole batch; fixed in f5df79e and 2627bcd). C: Aug 16 on, clean. Use Era C for any wait or vehicle-count figure.
- Sampling was every 5 minutes for the whole period.
- The pass counter misses 0.9% of passes at Broad, 3.2% at 52nd, 6.6% at Front (Era C). The counter is not the cause of the 83%.
- "schedBased" placeholder entries do not explain the 83%. Zero appeared in 286 snapshots.
- The two points nearest each end of the line (0.3 mi and 7.5 mi) read low. Do not quote them.
- Web visits are 0.14% of daily boardings (16.5 visits a day against about 12,000). Do not use it as a selling point.
- The public endpoints do not expose the database key. A session's attempt to read the Supabase key from Netlify was refused by the safety check. Do not retry it; add a counts-only endpoint instead.
- Finding 9 rests on one afternoon. The feed cannot separate "ran unseen" from "did not run".

## Raw Data
- All pulls sat in a session scratch folder under /private/tmp and are not saved. Rebuild them from the two endpoints, one request per day.
- The analysis scripts ran inline and are not saved. The method: weekday gaps between passes, wait = sum(gap^2) / (2 * sum(gap)), gaps over 120 min dropped, vehicles out = readings per hour / 12.
- Checkpoint longitudes: 52nd -75.2255, Broad -75.1596, Front -75.1362. Others used: -75.240, -75.212, -75.200, -75.188, -75.175, -75.148, -75.125, -75.113, -75.103.
- SEPTA ridership file: opendataphilly.org/datasets/septa-ridership-statistics (route G1, about 12,000 a day, Jan to Jun 2026).
- SEPTA schedule: github.com/septadev/GTFS release v202611010. Feed trip ids match GTFS trip_id.

## Open Items That Need Cris (all in the draft's checklist)
1. Firm name, address, email, phone.
2. DBE/SBE status.
3. Confirm the NJ Rides start month (draft says August 2026).
4. Cost ranges, lead times, recurring costs for each of the three phases.
5. Confirm no cooperative purchasing contract.
6. Warranty period.
7. Keep or drop finding 3 in Attachment A (missing trips; one afternoon of evidence).
8. Add the two Google screenshots, or drop that sentence.
9. Mark proprietary sections.

## Scheduled Events
- 2026-12-11 4:00 PM EST: response due. Nothing is pre-approved. Sending needs Cris.
- Crons: none (CronList returned "No scheduled jobs" at 10:35). Nothing to recreate.
- The one-minute feed recorder from Nov 18 died with that session at 16:28. It is not running.

## Banked, Not Built
- A daily check that logs which scheduled blocks never show a tracked vehicle. Cris declined it on 2026-11-20 as a rabbit hole. Do not build it without his word.
- Cris's steer, 2026-11-20: "stop getting focused on the product before there is a product" and "chasing a rabbit hole". Keep the work on the response.

## The One Recommended Next Move
- Cris fills the 9 open items in the draft. Then a session exports the PDF and checks it against RFI Section 5.
