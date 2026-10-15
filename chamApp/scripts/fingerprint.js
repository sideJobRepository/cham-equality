/**
 * 네이티브 지문(fingerprint) 계산. OTA 번들은 같은 지문의 앱에만 내려간다.
 *
 *   node scripts/fingerprint.js android   → 해시만 출력
 *   node scripts/fingerprint.js ios
 *
 * 지문엔 android/·ios/ 폴더와 네이티브 라이브러리(node_modules)가 들어간다.
 * 로컬에만 있는 파일(IDE 설정, 빌드 산출물, 키스토어, CI가 시크릿으로 복원하는 파일)은 뺀다.
 * 기준값은 CI(리눅스)에서 낸 값이다. Windows 체크아웃은 줄바꿈(CRLF)이 달라 같은 커밋이어도 값이 다르다.
 * hot-updater CLI는 Windows에서 android/ios 폴더를 못 읽어서 직접 계산한다.
 */
const path = require('path');
const { createFingerprintAsync } = require('@expo/fingerprint');

const IGNORE_PATHS = [
  'android/.idea/**',
  'android/.gradle/**',
  'android/.kotlin/**',
  'android/build/**',
  'android/app/build/**',
  'android/app/.cxx/**',
  'android/local.properties',
  'android/keystore.properties',
  'android/app/*.jks',
  'android/app/google-services.json',
  'ios/Pods/**',
  'ios/build/**',
  'ios/*.xcworkspace/xcuserdata/**',
  'ios/*.xcodeproj/xcuserdata/**',
  'ios/GoogleService-Info.plist',
  'ios/chamApp/GoogleService-Info.plist',
];

async function main() {
  const platform = process.argv[2];
  if (platform !== 'android' && platform !== 'ios') {
    console.error('usage: node scripts/fingerprint.js <android|ios>');
    process.exit(1);
  }
  const fingerprint = await createFingerprintAsync(path.join(__dirname, '..'), {
    platforms: [platform],
    ignorePaths: IGNORE_PATHS,
    debug: process.env.FINGERPRINT_DEBUG === '1',
  });
  if (process.env.FINGERPRINT_DEBUG === '1') {
    console.error(JSON.stringify(fingerprint.sources, null, 2));
  }
  process.stdout.write(fingerprint.hash);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
