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

```
Philly Trolleys is an independent tracker for SEPTA's vintage PCC trolley cars on the G Line in Philadelphia. It is not affiliated with SEPTA. Data comes from SEPTA's public open-data feeds (www3.septa.org/api).

The PCC cars run roughly 6am to 8pm Eastern on most days. Outside those hours the app shows the buses covering the route and says so. Analytics, the widget, and the alert toggle work at any hour.

Trolley alerts are optional. Turning on the toggle requests notification permission and sends one alert per day when the first PCC car appears.

No login is needed. The app works offline by showing the last data it saw, labeled with its time.
```

## Screenshots

Required: iPhone 6.9 inch (1320 by 2868), at least three, up to ten. Apple scales these for smaller phones.

Capture on the iPhone 17 Pro Max Simulator during service hours (a weekday between about 10am and 4pm Eastern), so real PCC cars appear:

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
