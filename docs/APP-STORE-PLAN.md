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

## Next move

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
- 2026-08-16: Offline mode built and verified. Store listing copy drafted (docs/APP-STORE-LISTING.md).
- 2026-08-16 (early): Home screen widget built and verified on the Simulator (see "Widget, how it works"). Supabase alert tables created by Cris; the app's alert toggle saves its token ("You are set").
- 2026-08-15 (night): Push alerts built end to end (see "Alerts, how they work"). No-orphans pass over the whole app: pretty and balanced wrapping everywhere, tiles and buttons that fill their rows, phone step text wraps instead of clipping, metro and regional line buttons two per row on phones with names on one line, roster chips 8 per desktop row and 4 per phone row. Verified with Simulator screenshots of every screen and the live website on desktop.
- 2026-08-15: Website gained a "Not affiliated with SEPTA" footer, privacy.html, support.html, a 404 page, 404 rules for internal folders, an analytics auto-retry with a Try again button, and the last dashes removed. Deployed to the live site.

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
