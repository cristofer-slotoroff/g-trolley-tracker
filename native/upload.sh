#!/bin/bash
# Uploads an exported IPA to App Store Connect with the API key (key PWRCG89KNQ in ~/.appstoreconnect/private_keys).
# Usage: ./native/upload.sh <ISSUER_ID> [export dir, default export3]
# The Issuer ID is on App Store Connect, Users and Access, Integrations, App Store Connect API (Copy button).
# It is saved to ~/.appstoreconnect/issuer_id the first time, so later runs can omit it. Added 2026-08-17.
set -e
cd "$(dirname "$0")/ios/App"
ISSUER_FILE="$HOME/.appstoreconnect/issuer_id"
ISSUER="${1:-$(cat "$ISSUER_FILE" 2>/dev/null || true)}"
if [ -z "$ISSUER" ]; then echo "Need the Issuer ID: ./native/upload.sh <ISSUER_ID>"; exit 1; fi
echo "$ISSUER" > "$ISSUER_FILE"
EXPORT="${2:-export3}"
IPA="build/$EXPORT/App.ipa"
[ -f "$IPA" ] || { echo "No IPA at $IPA"; exit 1; }
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcrun altool --upload-app -f "$IPA" -t ios --apiKey PWRCG89KNQ --apiIssuer "$ISSUER" 2>&1 | grep -vi "^$" | tail -12
