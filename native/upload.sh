#!/bin/bash
# Uploads an exported IPA to App Store Connect with the API key (key PWRCG89KNQ in ~/.appstoreconnect/private_keys).
# Usage: ./native/upload.sh [export dir, default: the newest build/export*]
# The Issuer ID is read from ~/.appstoreconnect/issuer_id (saved 2026-08-17). Pass it as $2 to overwrite.
set -e
cd "$(dirname "$0")/ios/App"
ISSUER_FILE="$HOME/.appstoreconnect/issuer_id"
[ -n "$2" ] && echo "$2" > "$ISSUER_FILE"
ISSUER="$(cat "$ISSUER_FILE" 2>/dev/null || true)"
[ -n "$ISSUER" ] || { echo "No Issuer ID. Run: ./native/upload.sh <export dir> <ISSUER_ID>"; exit 1; }
EXPORT="${1:-$(ls -td build/export*/ | head -1 | xargs basename)}"
IPA="build/$EXPORT/App.ipa"
[ -f "$IPA" ] || { echo "No IPA at $IPA"; exit 1; }
echo "Uploading $IPA"
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcrun altool --upload-app -f "$IPA" -t ios --apiKey PWRCG89KNQ --apiIssuer "$ISSUER" 2>&1 | grep -vi "^$" | tail -8
