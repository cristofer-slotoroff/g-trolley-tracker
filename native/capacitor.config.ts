import type { CapacitorConfig } from '@capacitor/cli';

// Philly Trolley App: native shell around the G Trolley Tracker web files.
// webDir is filled by ./build-www.sh from the repo root. Added 2026-08-15.
const config: CapacitorConfig = {
  appId: 'com.cristoferslotoroff.phillytrolley',
  appName: 'Philly Trolley App',
  webDir: 'www',
  ios: {
    // Dark green behind the web view so the notch and home-indicator areas match the app.
    backgroundColor: '#0D2818',
    contentInset: 'never',
    scrollEnabled: true,
    // Let the web view use the safe-area CSS variables (env(safe-area-inset-*)).
    preferredContentMode: 'mobile'
  }
};

export default config;
