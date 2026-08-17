# App Store listing: Philly Trolleys

Drafted 2026-08-16. Paste these into App Store Connect when the developer account is active.
Character limits are Apple's. Everything below follows the house copy rules (no dashes, no emoji, no sentence ending on a preposition).

## Names

- App name (30 max): `Philly Trolleys`
- Subtitle (30 max): `Vintage PCC Trolley tracker`
- Bundle ID: `com.cristoferslotoroff.phillytrolleys`
- SKU: `phillytrolleys-ios`
- Primary category: Navigation. Secondary: Travel.
- Price: Tier for $4.99 USD, pay once. No in-app purchases.
- Availability: United States only at launch (avoids EU trader disclosures for now).
- Age rating: 4+.

## Promotional text (170 max)

`See where Philadelphia's 1940s PCC Trolleys are running right now, get alerts when they roll out or near your stop, and check the widget from your home or lock screen.`

## Description (4000 max)

```
Philly Trolleys shows you where SEPTA's vintage PCC Trolleys are running on the G Line (Girard Avenue) right now, so you can plan a ride on a piece of Philadelphia transit history.

The PCC cars share the route with buses and do not run every day. This app tracks the trolleys specifically, tells you which cars are out, where each one is heading, and how to reach the line from any SEPTA Metro or Regional Rail station.

What you get:

- Live trolley positions on the G Line, refreshed every minute
- Directions to the nearest pickup point from any Metro or Regional Rail station, with live train and trolley times
- Trolley alerts, your way: one notification a day when the first PCC car appears, or one for every car that starts running
- Stop alerts: save your G Line stop and direction, and get a notification when a PCC car is a few stops away
- Home screen and lock screen widgets showing how many PCC cars are out and which ones
- Share the app with a friend straight from the footer
- Service analytics: typical hours, busiest days, the car roster, and the record books
- Works underground: the app remembers the last positions and analytics it saw and shows them, labeled with their time, until you are back online

Pay once and keep it. No subscriptions, no ads, no accounts, no tracking.

Philly Trolleys is an independent project made in Philadelphia. It is not affiliated with SEPTA. Vehicle positions and schedules come from SEPTA's public data feeds.
```

## Keywords (100 max, comma separated, no spaces after commas)

`SEPTA,trolley,PCC,streetcar,Philadelphia,Philly,Girard,G line,route 15,transit,tram,rail`

## URLs

- Support URL: `https://septa-g-trolley-tracker.netlify.app/support.html`
- Privacy Policy URL: `https://septa-g-trolley-tracker.netlify.app/privacy.html`
- Marketing URL (optional): `https://septa-g-trolley-tracker.netlify.app/`

## App Privacy (nutrition label)

Answer "Yes, we collect data" and declare one item:

- Identifiers, Device ID: collected, used for App Functionality (push alerts), not linked to the user's identity, not used for tracking. This is the push token, stored only after the user turns on alerts.

Nothing else is collected in the app: no analytics, no location, no contact info.

## App Review notes

Full answers to Apple's Guideline 2.1 "Information Needed" request (2026-08-16) live in
`docs/APP-REVIEW-REPLY.md`. Paste Part B of that file into the Notes field of App Review
Information for every future submission, and keep the device list there current.

Short version:

```
Philly Trolleys is an independent tracker for SEPTA's vintage PCC trolley cars on the G Line in Philadelphia. It is not affiliated with SEPTA. Data comes from SEPTA's public developer feeds (www3.septa.org/api) through our Netlify functions; Supabase stores the sighting log and, only after a user opts in, push tokens and saved stop alerts. Notifications go straight to APNs from our server. No login, accounts, purchases, subscriptions, ads, or user content. The only permission requested is notifications, when the user turns on Trolley Alerts.

PCC cars run roughly 6 AM to 8 PM Eastern on most days. Outside those hours the home screen says so and shows the buses covering the route. Route directions, alerts, the widget, analytics, and offline mode work at any hour.

Tested on iPhone 15 Pro (iOS 26.6) and iPhone 17 Pro and Pro Max Simulators (iOS 26.5, Xcode 26.6). Minimum iOS 17. iPhone only. United States only; no regional differences.
```

## Screenshots

Required: iPhone 6.9 inch (1320 by 2868), at least three, up to ten. Apple scales these for smaller phones.

Captured 2026-08-16 on the iPhone 17 Pro Max Simulator with three PCC cars running: see `docs/store-screenshots/` (1320 by 2868, upload in numbered order). Retake any of them the same way if the app changes:

1. Home with PCC trolleys running (the hero shot)
2. Route options from a Metro station
3. Trolley Alerts card with the toggle on
4. Analytics: typical hours and today's trolleys
5. Analytics: roster and service history
6. Home screen with the widget (medium) showing cars out

Command to capture: `xcrun simctl io <udid> screenshot shot.png` on the 17 Pro Max simulator, which produces 1320 by 2868 directly.

## Version and build

- Version 1.0, build 1. Bump the build number for every upload; bump the version for every public release.
- Release: manual release after approval, so the launch day can be chosen.
