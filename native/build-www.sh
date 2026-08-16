#!/bin/bash
# Copies the website files into native/www so Capacitor can bundle them into the iOS app.
# Run before `npx cap sync ios`. The website itself is untouched. Added 2026-08-15.
set -e
cd "$(dirname "$0")"
rm -rf www && mkdir -p www
for f in index.html app.js styles.css t_line_gtfs_data.js manifest.json privacy.html support.html about.html; do
  cp "../$f" www/
done
mkdir -p www/Graphics
cp ../Graphics/philly-trolleys-logo.png ../Graphics/PCC\ App\ Logo.png ../Graphics/favicon-32.png ../Graphics/apple-touch-icon.png ../Graphics/icon-192.png ../Graphics/icon-512.png ../Graphics/Septa_Bus_EB.svg ../Graphics/Septa_Bus_WB.svg ../Graphics/EB_PCC_App_Logo.svg ../Graphics/WB\ PCC\ App\ Logo.svg www/Graphics/ 2>/dev/null || true
echo "www/ built: $(find www -type f | wc -l | tr -d ' ') files"
