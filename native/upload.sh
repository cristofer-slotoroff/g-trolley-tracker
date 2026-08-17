#!/bin/bash
# Uploads an archived build to App Store Connect through the Xcode account (no API issuer needed).
# Usage: ./native/upload.sh [archive name, default App3]      Added 2026-08-17.
set -e
cd "$(dirname "$0")/ios/App"
ARCHIVE="${1:-App3}"
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
rm -rf "build/upload-$ARCHIVE"
xcodebuild -exportArchive -archivePath "build/$ARCHIVE.xcarchive" \
  -exportOptionsPlist build/ExportOptionsUpload.plist \
  -exportPath "build/upload-$ARCHIVE" -allowProvisioningUpdates 2>&1 | grep -E "EXPORT|error|Upload|upload|Error" | tail -20
