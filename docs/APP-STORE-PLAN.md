# App Store plan: G Trolley Tracker

Written 2026-08-15. Status: scoping only. Nothing built yet.
Name decided 2026-08-15: **Philly Trolley App**. Do not relitigate.
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
8. Copy cleanup. Four stray dashes in the app copy. Fixed 2026-08-15.

## How it gets built

- Capacitor wraps the existing HTML, CSS, and JS in a real iOS app. No rewrite. API calls point at the live Netlify functions, which you can still update instantly without app review.
- Push: a small native piece plus one call from pcc-tracker.js (Firebase or OneSignal, decide at build time). Device tokens stored in Supabase.
- Widget: a small Swift widget that reads a JSON endpoint. Written with Claude, built in Xcode.
- PWABuilder for iOS is archived and experimental (verified). Skip it.

Estimate: 5 to 7 working sessions. Shell 1 to 2, push 1 to 2, widget 1 to 2, store listing and submission 1. Apple review takes 1 to 3 days; plan for one rejection round.

## What only Cris can do

1. Enroll in the Apple Developer Program: $99, legal name shown as seller, about 48 hours to activate. Then enroll in the Small Business Program, sign the Paid Apps agreement, add banking and tax info (verified).
2. App name: done. "Philly Trolley App."
3. Install Xcode and keep an iPhone handy for testing.
4. Later, if wanted: Google Play.

## Risks, plainly

- SEPTA can change or shut the free data feed anytime; its license says so (verified). Every third-party SEPTA app carries this. Both API hosts answer today and no shutdown notice exists (verified). Mitigation: keep data logic in Netlify functions so fixes ship without app review.
- Apple 4.2 rejection. Shrinks with alerts and the widget. A Capacitor transit app with only location and share sheet was rejected twice (verified), so do both.
- Duplicate app rule 4.3. No other app tracks PCC cars specifically. Low risk (inferred).
- The real-time API has no published license of its own (verified). Many paid SEPTA apps use it and no record of SEPTA objecting was found (inferred).

## Next move

Cris: start the $99 Apple enrollment, since the 48-hour clock is the longest wait.
Claude: build the Capacitor shell and the rename on a branch, then push and widget.

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
