# Session log

Newest entry first. The plan and its short progress log live in `docs/APP-STORE-PLAN.md`; store copy in `docs/APP-STORE-LISTING.md`.

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

### Pick up next session

1. When Apple enrollment clears: Cris creates the APNs key, sets `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_SANDBOX=true` in Netlify, opens the Xcode project once and picks his team under Signing.
2. Capture 6.9-inch store screenshots on the iPhone 17 Pro Max Simulator on a weekday between 10am and 4pm Eastern, when PCC cars are out (list in `docs/APP-STORE-LISTING.md`).
3. TestFlight build to Cris's phone, confirm a real alert arrives, then submit.
