#!/usr/bin/env bash
# OTA(hot-updater)용 JS 번들 zip 만들기.
#
#   bash scripts/ota-bundle.sh <android|ios> <출력폴더>
#   → <출력폴더>/<platform>.zip
#
# 스토어 빌드와 같은 방식(Metro 번들 → Hermes 바이트코드)으로 만든다.
# zip 맨 위에 번들 파일(android: index.android.bundle / ios: main.jsbundle)과 이미지 에셋이 들어간다.
set -euo pipefail

PLATFORM="${1:?platform(android|ios) 필요}"
OUT_DIR="${2:?출력 폴더 필요}"
cd "$(dirname "$0")/.."

case "$PLATFORM" in
  android) BUNDLE_NAME="index.android.bundle" ;;
  ios) BUNDLE_NAME="main.jsbundle" ;;
  *) echo "지원하지 않는 플랫폼: $PLATFORM" >&2; exit 1 ;;
esac

case "$(uname -s)" in
  Linux) HERMESC="node_modules/hermes-compiler/hermesc/linux64-bin/hermesc" ;;
  Darwin) HERMESC="node_modules/hermes-compiler/hermesc/osx-bin/hermesc" ;;
  *) HERMESC="node_modules/hermes-compiler/hermesc/win64-bin/hermesc.exe" ;;
esac

WORK_DIR="$OUT_DIR/$PLATFORM"
rm -rf "$WORK_DIR" "$OUT_DIR/$PLATFORM.zip"
mkdir -p "$WORK_DIR"

# Hermes가 최적화하므로 Metro 압축(minify)은 끈다(RN 릴리스 빌드와 같음).
npx react-native bundle \
  --platform "$PLATFORM" \
  --dev false \
  --minify false \
  --entry-file index.js \
  --bundle-output "$WORK_DIR/$BUNDLE_NAME" \
  --assets-dest "$WORK_DIR" \
  --reset-cache

"$HERMESC" -emit-binary -O -w -out "$WORK_DIR/$BUNDLE_NAME.hbc" "$WORK_DIR/$BUNDLE_NAME"
mv "$WORK_DIR/$BUNDLE_NAME.hbc" "$WORK_DIR/$BUNDLE_NAME"

(cd "$WORK_DIR" && zip -qr "../$PLATFORM.zip" .)
echo "$OUT_DIR/$PLATFORM.zip"
