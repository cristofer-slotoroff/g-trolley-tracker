# Session log

Newest entry first. The plan and its short progress log live in `docs/APP-STORE-PLAN.md`; store copy in `docs/APP-STORE-LISTING.md`.

## 2026-08-17: Apple asked for more information

### Work completed

- Apple's reply (11:54 PM on 2026-08-16) was Guideline 2.1, Information Needed: a physical-device screen recording plus seven written answers. Not a rule violation.
- Drafted the full reply in `docs/APP-REVIEW-REPLY.md`: a recording shot list for Cris's iPhone 15 Pro (iOS 26.6, checked with devicectl) and the answer text (devices, description, setup, external services, regions, third-party material). Listing doc's review notes now point there, with a short version for the Notes field.
- Checked live status at 6:38 AM: PCC cars 2332 and 2337 out, so the recording can be made any time today during service.

### Where this falls in the plan

- Still the last step before release. One reply closes it; no code changes.

### Roadblocks and challenges

- The App Store Connect API has no endpoint for replying to App Review messages, and a recording from a physical phone is Cris's alone to make, so this round is a manual step in the App Store Connect UI.
- The API key's Issuer ID is not stored on disk (only the .p8 is), so the review-notes field could not be refreshed by API this session; paste it in the UI or provide the Issuer ID.

### Where to pick up next session

1. Cris records the video (Part A), replies in App Store Connect with Part B and the attachment.
2. Approved: "release". Anything else: paste it here.

## 2026-08-16 (evening): research session, no code

### Work completed

- Researched the Alstom Citadis timeline, PCC fleet status, SEPTA vehicle numbering and API fields, and Manayunk transit history for the app's next phase. Findings and the ordered backlog are in `docs/APP-STORE-PLAN.md` under "Post-launch backlog".
- Verified the 23xx PCC rule against the tracker's own data (all 8 logged PCC IDs are inside 2320 to 2337, no bus prefix starts with 2) and against a live scan of every SEPTA vehicle (one ID starting with 2 system-wide, PCC 2333).
- Traced the 41 "9xxx" IDs logged as buses on G1: Route 10 K-cars from Callowhill tagged G1 on pull-outs along 59th St and Girard to the Lancaster junction, plus one real end-to-end G run by 9039 and 9082 on Feb 23, 2026. Confirmed with GTFS block IDs (G1 blocks 9001 to 9026, T1 9051 to 9069) that these are car numbers, not blocks. Special trips not logged into blocks (K-car 9000 retirement trip on Girard, March 15, 2026, photo found by Cris) do not appear in the feed.
- Memory and plan file updated. Apple review still pending; no app or site changes this session.

### Where this falls in the plan

- The launch plan is complete except for Apple's decision. This session shaped what comes after launch: the app's runway on the G is longer than feared (Citadis reach the G last, in the 2030s), and the mixed-fleet period arrives first on the T and D lines, so the expansion path is the per-line "what's running" view built on the tracker's existing feed pull.

### Roadblocks and challenges

- The Supabase service key is a masked Netlify secret, so the CLI cannot read tables; Cris ran the queries in the SQL editor and pasted results.
- The session's web search budget ran out partway through (four research agents), so later checks used direct fetches and SEPTA's GTFS and live feed instead.
- Two false leads on the 9xxx IDs (placeholder rows, then block numbers) before GTFS block ranges and coordinates settled it.

### Successes and new understandings

- SEPTA's own vehicles page now dates Citadis delivery and deployment to 2030 to 2034 (was 2027 to 2032 until at least February 2026); order of lines is T, D, then G.
- No SEPTA feed field states vehicle type; ID ranges are disjoint and reliable, and the 23xx PCC rule is verified against seven months of data and a live system-wide scan.
- The 9xxx IDs on G1 are Route 10 K-cars crossing G track on Callowhill pull-outs, plus one real G run on Feb 23, 2026. Special trips outside a block do not appear in the feed.
- The Venice Island track is the Reading's Venice Branch, standard gauge, so the heritage line idea is parked as advocacy, not app work.

### Where to pick up next session

- Apple review result first. Then the backlog in the plan file, in order (classification table with a kcar bucket, tracker widened to all trolley routes, "what's running on my line" screen, K-car-on-Girard alert).
- Supabase queries were run by Cris in the SQL editor; the service key is a masked Netlify secret, so the CLI cannot read the tables. If a future session needs raw table access, ask Cris to run the query.

## 2026-08-16: submitted to Apple

### Work completed

- Apple developer account activated; APNs key, App ID with push, Netlify settings, App Store Connect API key (App Manager) all in place. Team ID 7QZM9CC55X, App Store Apple ID 6802036569.
- Alerts, end to end: first of the day, each new car, and stop alerts (several saved stops per phone, direction, distance); wording per Cris; verified with real pushes to the Simulator and to Cris's iPhone, on sandbox and production paths.
- App: redesigned alerts card, About page, support contact form (Netlify Forms), new logo, lock screen widgets, share button, widgets that refresh when an alert lands, offline mode, safe-area fixes, Title Case headings, "PCC Trolleys" capitalization, no-orphans pass.
- Website: promo strip for the iPhone app ($4.99 one time, no subscription) that reveals itself when the store listing goes live; Smart App Banner; safe-area padding for the home screen version.
- Store: seven 6.9-inch screenshots with three live trolleys; listing text, categories, subtitle, privacy URL, age rating 4+, price, US-only availability, copyright, manual release, review contact and notes, all set through the API. Build 1 then build 2 uploaded (Xcode-account signing plus altool with the API key). Cris tested build 1 through TestFlight on his phone.
- Submitted: version 1.0, build 2, Waiting for Review since 2:34 PM ET. Release is manual.

### Where this falls in the plan

- Every phase of the plan is done except Apple's decision and the release. Google Play stays banked.

### Roadblocks and challenges

- Netlify keeps an unchanged function bundle across deploys, so the tracker ignored the new APNs settings until its file changed; the morning's first-of-day alert was missed for that reason. Same again for APNS_SANDBOX: force a bundle change after any env change.
- Netlify CLI links the home folder to the personal site; always pass NETLIFY_SITE_ID. A value beginning with dashes cannot be passed to env:set; the .p8 went in base64.
- The App Manager API key cannot create distribution certificates; sign with the Xcode login, upload with the key.
- Internal TestFlight testers cannot be added by API; Cris added himself in the UI.
- Simulator taps land only when the Simulator is frontmost, and its window moves; re-read the AXGroup position before tapping. Momentum scrolls need a slow drag with a hold.
- pcc_observations.vehicle_id is varchar(10); some run rejects a batch. The tracker now retries row by row and logs the culprit; the culprit had not appeared in the log by end of day.

### Successes and new understandings

- The whole App Store Connect setup can be driven by API in one sitting: localizations, app info, age rating (new 2026 fields), price schedules with ${local} ids, availability needs all 175 territories, screenshot upload flow, review submission.
- The Simulator issues real device tokens; with the production-first-then-sandbox fallback, one server setting serves Xcode, TestFlight, and App Store installs.
- content-available on visible pushes plus a background mode lets the app refresh widgets the moment an alert arrives.

### Where to pick up next session

1. Apple's review email. Approved: "release" (API or the Release button). Rejected: paste the reason, fix, resubmit.
2. First update after approval: tap-to-refresh icon on the home screen widget; check the tracker log for the over-long vehicle id.
3. After launch: watch push-status and Netlify credits; consider Google Play.

## 2026-08-15 to 2026-08-16: from web app to App Store candidate

### Work completed

- Scoped the App Store move: research on SEPTA data terms and trademarks, Apple review rules, fees, tooling. Written up in `docs/APP-STORE-PLAN.md`.
- Banked decisions: website stays free, iPhone app is $4.99 pay once, name "Philly Trolleys" (matches the logo Cris drew), bundle ID `com.cristoferslotoroff.phillytrolleys`, iPhone-only, US only at launch.
- Built the Capacitor shell in `native/`. Same web files serve the site and the app; `IS_NATIVE` in `app.js` swaps the header, hides the coffee link, skips visit logging, and points function calls at the live site.
- New logo installed as app icon (text-free crop), splash, and in-app header. Icon and splash generated from `Graphics/philly-trolleys-logo.png`.
- Push alerts: Trolley Alerts card with an opt-in toggle, Capacitor push plugin, AppDelegate hooks, entitlement. Server side sends straight to Apple over HTTP/2 (`netlify/lib/apns.js`), one alert per Philadelphia day when the first PCC appears, claimed in `push_alerts_sent` to prevent duplicates. Supabase tables created by Cris. Verified on the Simulator: permission prompt, token issued, token saved.
- Home screen widget "PCC Trolleys Now" (small and medium), fed by `/.netlify/functions/widget-status`, refreshes every 15 minutes and on app open. Extension target added by script (xcodeproj gem). Verified live on the Simulator home screen.
- Offline mode: last trolley list and analytics saved locally and shown with their time when there is no connection. `?offline=1` simulates no network on the web preview.
- Website improvements shipped live: "Not affiliated with SEPTA" footer, privacy and support pages, 404 page, 404 rules for internal folders, analytics auto-retry with a Try again button, all stray dashes removed, no-orphans pass (pretty and balanced wrapping, tiles and buttons that fill rows, phone step text wraps instead of clipping, line buttons two per row on phones, roster 8 per desktop row and 4 per phone row).
- Store listing copy drafted in `docs/APP-STORE-LISTING.md`: name, subtitle, description, keywords, URLs, privacy label answers, review notes, screenshot plan.

### Where this falls in the plan

- Phases done: scoping, shell, native features (alerts, widget, offline), listing copy.
- Phases left: Apple account activation (pending), APNs key and Netlify env vars, Xcode signing team, store screenshots during service hours, TestFlight on Cris's phone, submission. Google Play is banked for later.

### Roadblocks and challenges

- Credentials are off limits to the assistant (Netlify env, Supabase), so Cris ran the SQL by pasting; the first attempt pasted the file name instead of its contents.
- Xcode was not installed at the start; `xcode-select` still points at CommandLineTools, so every build uses `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`.
- Simulator builds with signing disabled strip the push entitlement; ad-hoc signing (`CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO`) keeps it.
- Scripted taps needed Accessibility access; long presses needed a Quartz CGEvent helper (`pyobjc-framework-Quartz`).
- A pre-existing phone-width bug clipped route step text mid-word; fixed as part of the orphans pass.

### Successes and new understandings

- The whole app can be built, installed, launched, tapped, scrolled, and screenshotted from the terminal: `xcodebuild` plus `simctl`, System Events clicks at `{1073 + x_pt, 119 + y_pt}` for the iPhone 17 Pro window, PageDown (key code 121) to scroll the web view, and the Quartz helper for long press and drag.
- The Simulator issues real APNs device tokens on Apple silicon, so the alert flow could be verified end to end short of delivery.
- Apple's sandbox answered the HTTP/2 push probe in 133 ms with the expected 403 for a fake key, so the sender is known good before the real key arrives.
- `text-wrap` is inherited, so one rule on `body` covers runtime-built text; `balance` on short blocks is what actually removes two-word last lines.

### Late addition, 2026-08-16

- Apple enrollment cleared. APNs key made, Netlify variables set (base64 key, trolley site by ID), App ID registered with push. A real test alert reached the Simulator through Apple's servers. Team ID recorded in the Xcode project.
- Lesson: `~/.netlify/state.json` links the home folder to the personal site; always pass `NETLIFY_SITE_ID`. And a value that starts with dashes must be base64-encoded for `netlify env:set`.

### 2026-08-16, afternoon (autonomous stretch while Cris was out)

- Store screenshots captured with three live trolleys on the iPhone 17 Pro Max Simulator (docs/store-screenshots).
- Build 1 archived, exported with Xcode-account signing, uploaded with altool and an App Store Connect API key (App Manager keys cannot create distribution certificates, so signing and upload are separate steps).
- App Store Connect filled through the API: text, categories, subtitle, privacy URL, age rating, $4.99 US price, US-only availability, copyright, manual release, content rights, screenshots, review notes drafted (phone number still needed), build attached to 1.0, internal TestFlight group created.
- APNs sender now tries production first and falls back to sandbox per token; tokens dead in both are disabled. Verified with a 3-phone test send.
- Redesigned alerts card (master switch, three checkboxes, several saved stops), alert wording per Cris, share button with the App Store link, About page, support form via Netlify Forms, new logo everywhere, lock screen widgets, safe-area fix on the site.

### Submitted

- 2026-08-16, 2:34 PM ET: version 1.0 (build 2, widgets refresh on alerts) submitted for App Review through the API. TestFlight verified on Cris's iPhone, including a real alert through the production path. Manual release after approval.

### Pick up next session

1. Watch for Apple's review result (email). Approved: say "release". Rejected: paste the reason.
2. Sign in to Xcode with the Apple ID once (Xcode, Settings, Accounts) so signing and TestFlight work.
2. Capture 6.9-inch store screenshots on the iPhone 17 Pro Max Simulator on a weekday between 10am and 4pm Eastern, when PCC cars are out (list in `docs/APP-STORE-LISTING.md`).
3. TestFlight build to Cris's phone, confirm a real alert arrives, then submit.
