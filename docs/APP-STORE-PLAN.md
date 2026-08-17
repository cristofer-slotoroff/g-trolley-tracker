# App Store plan: G Trolley Tracker

Written 2026-08-15. Status: shell built 2026-08-15 (see Progress log at the bottom). Apple enrollment pending.
Name decided 2026-08-15: **Philly Trolleys** (first pick was "Philly Trolley App"; changed the same evening to match the logo Cris drew). Do not relitigate.
Why this name: room to grow. If SEPTA moves the PCC cars to other lines when the new Alstom trolleys arrive for testing (expected 2027), the app can follow them without a rename.
App Store check 2026-08-15: no existing app named "Philly Trolley" (verified via the App Store search API).
Facts below are tagged (verified) when read from the source, (inferred) when reasoned.

## Verdict

Yes, this can be a $4.99 pay-once App Store app, like KickMap.
Two things stand in the way today:

1. The name cannot lead with "SEPTA."
2. The app must do things a website cannot (alerts, a widget), or Apple rejects it as a "repackaged website."

Everything else is paperwork and polish.

## The money, in plain math

- Price: $4.99 one time. Apple keeps 15% under its Small Business Program (verified). You net about $4.24 a sale.
- Fixed cost: $99 a year for the Apple Developer Program (verified). Break-even: 24 sales a year.
- Servers: Netlify and Supabase free plans today. Netlify Free is now credit-based (300 credits a month; Pro is $20 a month) (verified). Check current usage in the Netlify dashboard before launch.
- Google Play: $25 once, 15% cut (verified). New personal accounts must first run a 14-day closed test with 12 testers (verified). Do this later, not now.

Recommended model: keep the website free. It is your Google and Gemini asset and it works as the free trial. Charge for the app, which adds alerts and a widget. Pay once, own it forever.

## What must change on the existing app

1. Name and branding. Drop "SEPTA" from the app name and icon. Keep it in the description ("for SEPTA's Route G"). Add "Not affiliated with SEPTA" in the footer and the store listing.
   Why: SEPTA's data license bars using its trademarks for profit (verified). Apple rule 4.1(c), added Nov 2025, bars other brands in app names and icons (verified). Live precedent: "onTime : SEPTA Rail, Bus" charges $4.99 for premium and carries a "not affiliated" line (verified), so the risk is real but survivable. Cleaner to avoid it. The current icon is original pixel art with no SEPTA mark (verified).
2. Native features, to pass Apple rule 4.2 (verified text: "elevate it beyond a repackaged website").
   - Push alert: "PCC trolleys are running now." The tracker function already checks every 5 minutes, so this is a small add.
   - Home Screen widget: "PCCs out now: 3. Next at Girard Station: 12 min."
   - Offline: keep last-known trolleys and the analytics cached so the app opens with content underground.
   - Optional: nearest origin stop by location.
3. Privacy pages. Apple requires a privacy policy URL and a support URL, and a privacy link inside the app (verified). Host both on the site: /privacy and /support. LinkedIn alone does not count.
4. Visitor logging. Drop the anonymous visitor ID in the app build. App Store Connect already reports downloads and usage. Fill the App Privacy labels honestly; push tokens may need an "Identifiers" entry (inferred).
5. Buy Me a Coffee link. Remove it from the app build. It is allowed in the US storefront today (verified), but the app is already paid and a bare submission reviews cleaner. Keep it on the website.
6. Robustness. Show a clear "SEPTA data unavailable" screen instead of endless "Loading..." Apple removes apps that look broken (verified). Test in airplane mode.
7. Phone fit. Safe-area padding for the notch, splash screen, full icon set, iPhone-only at first (skips iPad screenshots).
8. Copy cleanup. Stray dashes in the app copy. Fixed 2026-08-15.
9. Art. Logo done 2026-08-15 (Cris drew it; icon uses a text-free crop, full logo shows in the app header). The tiny bus icon depicts a real SEPTA bus with its logo; judged low risk 2026-08-15 and left as is. Swap only if SEPTA ever asks.

## How it gets built

- Capacitor wraps the existing HTML, CSS, and JS in a real iOS app. No rewrite. API calls point at the live Netlify functions, which you can still update instantly without app review.
- Push: a small native piece plus one call from pcc-tracker.js (Firebase or OneSignal, decide at build time). Device tokens stored in Supabase.
- Widget: a small Swift widget that reads a JSON endpoint. Written with Claude, built in Xcode.
- PWABuilder for iOS is archived and experimental (verified). Skip it.

Estimate: 5 to 7 working sessions. Shell 1 to 2, push 1 to 2, widget 1 to 2, store listing and submission 1. Apple review takes 1 to 3 days; plan for one rejection round.

## What only Cris can do

1. Enroll in the Apple Developer Program: $99, legal name shown as seller, about 48 hours to activate. Then enroll in the Small Business Program, sign the Paid Apps agreement, add banking and tax info (verified).
2. App name: done. "Philly Trolleys."
3. Install Xcode and keep an iPhone handy for testing. Xcode installed 2026-08-15.
4. Later, if wanted: Google Play.

## Risks, plainly

- SEPTA can change or shut the free data feed anytime; its license says so (verified). Every third-party SEPTA app carries this. Both API hosts answer today and no shutdown notice exists (verified). Mitigation: keep data logic in Netlify functions so fixes ship without app review.
- Apple 4.2 rejection. Shrinks with alerts and the widget. A Capacitor transit app with only location and share sheet was rejected twice (verified), so do both.
- Duplicate app rule 4.3. No other app tracks PCC cars specifically. Low risk (inferred).
- The real-time API has no published license of its own (verified). Many paid SEPTA apps use it and no record of SEPTA objecting was found (inferred).

## APPLE ASKED FOR INFORMATION 2026-08-16, 11:54 PM ET

Guideline 2.1, Information Needed (not a rule violation). Apple wants a screen recording from a physical iPhone plus written answers (devices tested, description, setup, external services, regions, regulated material). Everything is drafted in `docs/APP-REVIEW-REPLY.md`: Part A is the recording shot list for Cris's iPhone 15 Pro (iOS 26.6), Part B is the reply text. Reply in the App Store Connect message thread with the text and the video. Same morning, Cris found the schedBasedVehicle placeholder bug (see SESSION_LOG 2026-08-17); build 3 fixes it and is exported, so the choice is: reply and keep build 2 (bug ships in 1.0), or remove from review, attach build 3 with the notes and video, and resubmit. Next time, paste Part B into the App Review notes before submitting.

## SUBMITTED 2026-08-16, 2:34 PM ET

Version 1.0 with build 2 is Waiting for Review (review submission 431caa3b). Release is manual: when Apple approves, say "release" and it goes live (API), or click Release in App Store Connect. Typical review: 1 to 3 days. If Apple rejects, the message arrives by email and in App Store Connect; paste it here and it gets fixed and resubmitted.

## Status 2026-08-16 afternoon: build 1 uploaded, listing filled by API

Done through the App Store Connect API (key PWRCG89KNQ, App Manager role, in ~/.appstoreconnect/private_keys):
- Build 1 (version 1.0) uploaded from an Xcode-signed IPA with `xcrun altool`, processed VALID, attached to version 1.0. Export compliance answered by the Info.plist flag (no encryption prompt).
- Listing text (description, keywords, promo, support and marketing URLs), subtitle, privacy policy URL, categories (Navigation, Travel), age rating 4+, price $4.99 USD (proceeds $4.24), availability United States only, copyright, manual release, content rights, seven 6.9-inch screenshots in order.
- Internal TestFlight group "Cris (internal)" created with access to all builds. Testers cannot be added by API; Cris adds himself in the UI.
- APNs now tries production first and falls back to sandbox per token, so Xcode builds, TestFlight, and App Store installs all get alerts.

Cris, in App Store Connect (appstoreconnect.apple.com, Philly Trolleys):
1. TestFlight tab, Internal Testing, group "Cris (internal)", plus, add yourself. Install the TestFlight app on the iPhone, open it, install Philly Trolleys build 1, turn alerts on there.
2. App Privacy (left menu), Get Started: "Yes, we collect data"; Identifiers, Device ID; used for App Functionality; not linked to the user; not used for tracking; Publish.
3. Version 1.0, App Review Information: contact phone number (the rest is filled). Or send the number and I fill it.
4. When happy with TestFlight: say "submit" and I submit version 1.0 for review through the API (or click Add for Review, then Submit, in the UI).

## Next move (older)

Cris, one step left:
1. Supabase tables: done 2026-08-15. The Simulator's token saved and the app shows "You are set."
2. Apple enrollment cleared 2026-08-15. Team ID 7QZM9CC55X, APNs Key ID NMAT9J755Z (key file kept in ~/Downloads). Netlify env vars set on the trolley site (ID 07efeb5a-8dce-4252-adca-30b4c097f865): APNS_TEAM_ID, APNS_KEY_ID, APNS_SANDBOX=true, APNS_PRIVATE_KEY_B64. Note: `~/.netlify/state.json` links the home folder to the personal site, so always pass NETLIFY_SITE_ID when using the CLI. App ID registered on the portal with Push Notifications (2026-08-16). A real test alert reached the Simulator through Apple's sandbox servers (`push-status?test=<token>` returned sent 1). The daily alert will fire on its own the first morning a PCC appears. Still to do for TestFlight: sign in to Xcode with the Apple ID once (Xcode, Settings, Accounts) so signing works.
Claude: capture store screenshots during service hours (weekday, about 10am to 4pm), then TestFlight once Apple clears.

## Offline mode (built 2026-08-16)

- The app saves the last trolley list and analytics it fetched. With no connection it shows them, labeled "Offline, showing 9:52 PM data" with an amber dot, and hides route options (those need live train times). With nothing saved yet it says so plainly. Analytics fall back to the saved copy with a note.
- `?offline=1` on the web preview simulates no network. Verified both states in Chrome; live mode re-verified on the Simulator.

## Store listing (drafted 2026-08-16)

- All copy, keywords, URLs, privacy label answers, and review notes are in `docs/APP-STORE-LISTING.md`.

## Widget, how it works (built 2026-08-15)

- "PCC Trolleys Now" home screen widget, small and medium. Small: count out now (or "None out"). Medium: count plus up to three cars with direction. Tap opens the app.
- Data: `/.netlify/functions/widget-status`, a 60-second-cached feed of PCC cars on G1. The widget refreshes about every 15 minutes and whenever the app opens.
- Code: `native/ios/App/TrolleyWidget/TrolleyWidget.swift`. The extension target was added to the Xcode project by script (xcodeproj gem). App and widget target iOS 17.
- Verified on the Simulator: gallery listing, both previews, both sizes live on the home screen with real data.

## Alerts, how they work (built 2026-08-15)

- App: "Trolley Alerts" card with one toggle. Turning it on asks iOS for permission, gets a device token from Apple, and posts it to the push-subscription function. Turning it off marks the token disabled. Verified on the Simulator: permission prompt, token issued, server called.
- Server: the 5-minute tracker checks whether today (Philadelphia time) already had a PCC sighting. If this run is the first, it claims the day in push_alerts_sent (a duplicate claim from a parallel run is ignored), loads opted-in tokens, and sends "PCC trolleys are out. Cars 2332 and 2333 are on the G Line right now." straight to Apple over HTTP/2 with a signed token. No third-party push service. Tokens Apple reports as gone are disabled.
- Without the APNs env vars the tracker logs "APNs not configured" and skips, so nothing breaks before setup.
- Testing: `xcrun simctl push <udid> com.cristoferslotoroff.phillytrolleys file.apns` shows an alert on the Simulator once permission is granted.

## How to run the app (for reference)

1. `cd native && ./build-www.sh && npx cap sync ios`
2. `npx cap open ios` (opens Xcode), pick an iPhone simulator, press Run.
3. Web changes: rerun step 1 and Run again. Function changes: just push to GitHub; the app calls the live site.

## Progress log

Full session notes live in `SESSION_LOG.md` at the repo root.

- 2026-08-15: Plan written. Name banked. Apple enrollment submitted (pending). Xcode installed.
- 2026-08-15: Capacitor shell built in `native/` (bundle ID com.cristoferslotoroff.phillytrolleys, iPhone-only, portrait, light status bar, placeholder icon and splash). Same web files serve site and app; `IS_NATIVE` in app.js swaps the header to "Philly Trolleys", hides the coffee link, skips visit logging, and points function calls at the live site. Verified in Chrome with `?native=1`: live vehicles, routes, and analytics load from the live functions.
- 2026-08-15 (later): Name changed to "Philly Trolleys" to match the logo Cris drew. Icon (text-free crop), splash, and in-app header logo installed. Built with xcodebuild and run on the iPhone 17 Pro Simulator: live data loads, status bar and safe areas look right, home screen shows the "Philly Trolleys" icon.
- 2026-08-16: Apple account active. APNs key created, Netlify env vars set on the trolley site (by Cris, CLI), App ID registered with push. First real push delivered to the Simulator via Apple: alerts are verified end to end. push-status endpoint added for health checks.
- 2026-08-16 (afternoon): Alerts card redesigned (master switch, three checkboxes: first, each, my stop; several saved stops per phone with Remove; outlined save button; italic gold two-line confirmation). Alert wording per Cris (title carries car number, direction arrows, count, stops away; body "PCCs Out Now"). Share button with the App Store link (Apple ID 6802036569). New wordless logo everywhere. Support form live through Netlify Forms (form detection enabled). Website gets safe-area padding for the home screen version.
- 2026-08-16 (day): Alert modes (first of the day, or every car), stop alerts (saved stop, direction, distance; once per car per trip), lock screen widget sizes, About page, support contact form (Netlify Forms), rewritten support FAQ, Title Case headings, PCC Trolleys capitalization. Root cause of the missed morning alert: Netlify keeps an unchanged function bundle across deploys, so the tracker only saw the new APNs settings once its file changed. Tracker now logs every alert decision and retries rejected observation rows one by one (a vehicle_id longer than 10 characters was rejecting whole batches).
- 2026-08-16: Offline mode built and verified. Store listing copy drafted (docs/APP-STORE-LISTING.md).
- 2026-08-16 (early): Home screen widget built and verified on the Simulator (see "Widget, how it works"). Supabase alert tables created by Cris; the app's alert toggle saves its token ("You are set").
- 2026-08-15 (night): Push alerts built end to end (see "Alerts, how they work"). No-orphans pass over the whole app: pretty and balanced wrapping everywhere, tiles and buttons that fill their rows, phone step text wraps instead of clipping, metro and regional line buttons two per row on phones with names on one line, roster chips 8 per desktop row and 4 per phone row. Verified with Simulator screenshots of every screen and the live website on desktop.
- 2026-08-15: Website gained a "Not affiliated with SEPTA" footer, privacy.html, support.html, a 404 page, 404 rules for internal folders, an analytics auto-retry with a Try again button, and the last dashes removed. Deployed to the live site.

## Post-launch backlog (banked 2026-08-16, no code yet)

Research that day (SEPTA site, FY27 budget, GTFS, live feed, and the tracker's own data) settled these. Full notes in SESSION_LOG.md.

- Alstom Citadis timing: SEPTA's vehicles page now says manufacture 2027 to 2030, fleet delivery and deployment 2030 to 2034 (it said 2027 to 2032 until at least February 2026). Order of lines is T, then D, then G last. PCCs own the G into the 2030s. The M line is not a trolley line and is not in the order.
- Fleet ID ranges are disjoint: T K-cars 9000 to 9111 (single-ended), D K-cars 100 to 128 (double-ended), G PCCs 2320 to 2337, trackless 800 to 837, buses 700s, 3000s, 4600s, 7300s, 8400s, 8600s. Citadis numbers unannounced (one railfan roster guesses 9500 to 9630). No SEPTA feed field states vehicle type; only the ID does. Planned substitutions use route IDs T_BUS, D1_BUS, D2_BUS, M1_BUS; unplanned ones show bus IDs under the trolley route.
- The 23xx rule is correct: every ID ever logged as a PCC is inside 2320 to 2337 (8 cars: 2322, 2324, 2326, 2327, 2328, 2332, 2333, 2337) and no bus prefix starts with 2.
- K-cars in the G1 feed: Route 10 cars from Callowhill run up 59th St and along Girard to the Lancaster junction on every pull-out and pull-in, and SEPTA's AVL tags them G1 for a few minutes. The tracker files them as buses (41 distinct cars since February, almost all 1 to 8 samples near 59th St or the junction). One real event: Feb 23, 2026, cars 9039 and 9082 ran the G end to end on G1 blocks. Special trips not logged into a block (K-car 9000's retirement trip on Girard, March 15, 2026) do not appear in the feed at all.

To do, in order, after Apple review clears:

1. Table-driven vehicle classification (explicit ranges: pcc, kcar, bus, unknown) in app.js and pcc-tracker.js, replacing startsWith('23'). Alert on any unknown 4-digit ID on a rail route (that is how the first Citadis test car will surface). Add a `kcar` vehicle_type so bus counts stop absorbing K-cars.
2. Widen pcc-tracker.js from G1 only to T1 to T5, D1, D2, G1 and the _BUS routes (about 40k rows a day; aggregate later). Starts the per-line, per-vehicle dataset now.
3. "What's running on my line" screen for T, D, G: rail cars vs buses live, per vehicle with next stop. Works today for planned and unplanned substitution.
4. Rare-event push alert: a K-car with a G destination east of the Girard Ave bridge (longitude greater than about -75.19). "A Kawasaki is running on Girard right now."
5. Later: per-vehicle reliability views once months of data exist (compare each vehicle's lateness against other vehicles on the same block and hour; SEPTA on-time is 1 minute early to 6 late at timepoints; SEPTA publishes route-level OTP only).

Parked: Manayunk heritage line advocacy. The Venice Island track is the Reading's Venice Branch (standard gauge, so SEPTA broad-gauge cars cannot use it as is; last train April 2017; Norfolk Southern filed to discontinue in 2019; the city plans a trail over the Mule Bridge). Working templates elsewhere are Tampa (assessment district plus city) and Dallas (nonprofit plus DART and a BID).

## Sources

- SEPTA developer terms: https://www3.septa.org/developer/ and https://wwww.septa.org/license-agreement/
- SEPTA copyright: https://wwww.septa.org/copyright/
- SEPTA API doc: https://www3.septa.org/apidoc.json
- Apple review guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple 4.1(c) brand rule: https://developer.apple.com/news/?id=ey6d8onl
- Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/
- Apple enrollment: https://developer.apple.com/programs/enroll/
- Apple privacy labels: https://developer.apple.com/app-store/app-privacy-details/
- Google Play fees: https://support.google.com/googleplay/android-developer/answer/6112435
- Google Play 12-tester rule: https://support.google.com/googleplay/android-developer/answer/14151465
- Capacitor: https://capacitorjs.com/docs
- PWABuilder iOS (archived): https://github.com/pwa-builder/pwabuilder-ios-app-store
- Capacitor transit app rejected under 4.2: https://developer.apple.com/forums/thread/812889
- onTime SEPTA app precedent: https://apps.apple.com/us/app/ontime-septa-rail-bus/id1254614333
- KickMap NYC precedent: https://apps.apple.com/us/app/kickmap-nyc/id364438839
- Netlify pricing: https://www.netlify.com/pricing/
