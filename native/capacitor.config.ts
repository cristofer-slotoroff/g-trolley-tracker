import type { CapacitorConfig } from '@capacitor/cli';

// Philly Trolleys: native shell around the G Trolley Tracker web files.
// webDir is filled by ./build-www.sh from the repo root. Added 2026-08-15.
const config: CapacitorConfig = {
  appId: 'com.cristoferslotoroff.phillytrolleys',
  appName: 'Philly Trolleys',
  webDir: 'www',
  plugins: {
    PushNotifications: {
      // Show alerts even while the app is open.
      presentationOptions: ['banner', 'sound', 'list']
    }
  },
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
