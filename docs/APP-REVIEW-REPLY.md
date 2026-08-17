# App Review reply: Guideline 2.1, Information Needed

Apple asked for this on 2026-08-16 (submission 431caa3b). Decided 2026-08-17: resubmit with build 4
(schedBased placeholder fix, widget refresh button) instead of replying on build 2. The answers go in
the App Review notes (`docs/app-review-notes.txt`, the under-4000-character version of Part B), the
recording goes in as an App Review attachment, then the submission is resubmitted. Scripts, all run
by Cris with the `!` prefix because Apple-side writes are blocked for the assistant:
`./native/upload.sh` (newest IPA), `python3 scripts/asc_stage.py 4` (notes plus build),
`python3 scripts/asc_submit.py attach <video>`, `python3 scripts/asc_submit.py submit`.

Facts below were checked on 2026-08-17: Cris's phone is an iPhone 15 Pro on iOS 26.6 (23G71),
the Simulators run iOS 26.5, Xcode is 26.6, the app targets iOS 17.0, iPhone only.

## Part A: the screen recording (Cris, on the iPhone 15 Pro)

Record during service hours (PCC cars usually run about 6 AM to 8 PM Eastern; two were out
at 6:38 AM on 2026-08-17). Aim for 90 seconds to 2 minutes. Keep it under about 100 MB.

Setup, before recording:
1. Delete Philly Trolleys from the phone, then reinstall the newest build from TestFlight (build 4,
   the one going to Apple). This resets notification permission so the prompt appears on camera.
2. Add the screen recorder to Control Center if it is not there (Settings, Control Center).
3. Turn on Do Not Disturb so nothing else pops in.

Shot list, in this order:
1. Home screen with the app icon visible. Start recording (Control Center, record button, wait
   for the 3-second countdown). Tap the icon so the recording begins with the launch.
2. Home: live PCC cars on the G Line, direction and destination for each. Pause 3 seconds.
3. Scroll to Route Options. Tap a Metro station, then a Regional Rail station, and show the
   live directions and times.
4. Scroll to Trolley Alerts. Turn the main switch on. The iOS notification permission prompt
   appears; tap Allow. Show the checkboxes (first of the day, each car, my stop). Save a stop
   alert (pick a stop, direction, distance) and show the confirmation.
5. Scroll to Analytics: typical hours, today's trolleys, roster, service history.
6. Footer: tap Share (show the share sheet, then dismiss). Tap About, scroll a little, go back.
7. Widget: go to the home screen, long press, add the Philly Trolleys widget (small or medium),
   show it with the live count. Tap the "Updated" line to show it refresh, then tap the widget
   body to show it opens the app.
8. Offline: turn on Airplane Mode in Control Center, pull to refresh or reopen the app, show
   the "Offline, showing ... data" label. Turn Airplane Mode off.
9. Stop recording (tap the red status bar, Stop). The video lands in Photos.

Send the video to the Mac (AirDrop) so it can be attached to the reply, or attach it straight
from the phone in Safari at appstoreconnect.apple.com.

## Part B: the reply text (paste as is)

Thank you for the review. Answers to each item are below, and the screen recording is attached.

1. Screen recording

Attached. Recorded on an iPhone 15 Pro running iOS 26.6. It begins with launching the app and
shows the full user flow: live PCC trolley positions on the G Line, route directions from a
Metro and a Regional Rail station, turning on Trolley Alerts (including the iOS notification
permission prompt, the only permission the app requests), saving a stop alert, the analytics
section, the share sheet, the About page, adding and tapping the home screen widget, and offline
mode in Airplane Mode. The app has no accounts, no login, no registration, no in-app purchases,
no subscriptions, and no user-generated content.

2. Devices and operating systems tested

- iPhone 15 Pro, iOS 26.6 (physical device, installed through TestFlight and Xcode)
- iPhone 17 Pro and iPhone 17 Pro Max Simulators, iOS 26.5, Xcode 26.6
- Minimum supported version: iOS 17.0. iPhone only.

3. What the app does and who it is for

Philly Trolleys shows where SEPTA's vintage 1940s PCC trolley cars are running on the G Line
(Girard Avenue) in Philadelphia right now. The PCC cars share the route with buses and do not
run every day, so riders and visitors who want to ride one cannot tell from SEPTA's own tools
whether a trolley or a bus is coming. The app tracks the trolleys specifically: which cars are
out, where each is heading, how to reach the line from any SEPTA Metro or Regional Rail station
with live times, optional notifications when trolleys start running or near a saved stop, a home
and lock screen widget with the count of cars out, and analytics on typical hours, busiest days,
the car roster, and service history. It also keeps the last data it saw so it opens with content
underground. Target audience: Philadelphia transit riders, tourists, and rail enthusiasts. Rated
4+. It is a one-time paid app with no ads, accounts, tracking, or in-app purchases.

4. Setup and access

No login, credentials, or sample files are needed. Open the app and the home screen loads live
positions from SEPTA's feeds within a few seconds. Notes for review:

- PCC cars usually run about 6 AM to 8 PM Eastern. Outside those hours the home screen says no
  PCC cars are out and lists the buses covering the route instead. Route directions, alerts,
  the widget, analytics, and offline mode work at any hour.
- Trolley Alerts: scroll to the Trolley Alerts card and turn on the switch. iOS asks for
  notification permission (the only permission the app requests). Choose "first car of the
  day" or "every car", and optionally save a stop, direction, and distance for stop alerts.
- Widget: long press the home screen, tap the plus button, search "Philly Trolleys", add the
  small or medium widget. It shows how many PCC cars are out and refreshes about every 10
  minutes, when the app opens, and when the "Updated" line on the widget is tapped.
- Offline mode: with no connection the app shows the last positions and analytics it saw,
  labeled with their time.
- Share, About, Privacy, and Support are in the footer.

5. External services, tools, and platforms

- SEPTA public transit data APIs (www3.septa.org/api: TransitView, NextToArrive, Arrivals,
  Stops, BusSchedules) and SEPTA GTFS schedule data: vehicle positions and schedules.
- Netlify: hosts the app's web content and the serverless functions that fetch and cache the
  SEPTA data, compute the analytics, and send notifications. Netlify Forms receives the
  optional support contact form.
- Supabase (hosted Postgres): stores the trolley sighting log behind the analytics, and, only
  after a user turns on alerts, the device push token and any saved stop alerts.
- Apple Push Notification service, called directly from our server. No third-party push
  provider.
- Capacitor (Ionic): the native shell around the app's web content.

No authentication service, no payment processor (the app is a one-time App Store purchase),
no advertising or analytics SDK, and no AI service.

6. Regional differences

None. The app is offered in the United States only, its content is specific to Philadelphia,
and it functions the same in every region.

7. Regulated industry and third-party material

The app is not in a regulated industry. Vehicle positions and schedules come from SEPTA's
public, documented developer data feeds. The app is an independent project, is not affiliated
with SEPTA, and says so in the app, in the store description, and on the website. SEPTA's name
appears only descriptively (to say which transit system's vehicles are shown); the app name,
icon, and artwork are original.

Support: https://septa-g-trolley-tracker.netlify.app/support.html
Privacy: https://septa-g-trolley-tracker.netlify.app/privacy.html
