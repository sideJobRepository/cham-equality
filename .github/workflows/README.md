# CI/CD 한눈에

배포 대상마다 파일 하나. 자동(main 푸시)은 "테스트 단계까지"만 가고, 실제 사용자에게 내보내는 건 전부 수동이다.

| 파일 | Actions 이름 | 언제 | 하는 일 |
|---|---|---|---|
| `api-deploy.yaml` | API 배포 | `chamApi/**` 푸시, 수동 | jar 빌드 → 서버 8081 재기동 |
| `web-deploy.yaml` | 웹 배포 | `front/**` 푸시, 수동 | vite 빌드 → nginx 폴더 교체 |
| `app-release.yaml` | 앱 빌드 | `chamApp/**` 푸시, 수동 | 아래 "앱 흐름" |
| `app-promote-play.yaml` | 앱 Play 프로덕션 승격 | 수동 | Play alpha → 프로덕션(단계적 출시·중단) |
| `app-promote-ios.yaml` | 앱 App Store 출시 | 수동 | TestFlight 빌드 → 심사 제출 → 출시(단계적 출시·정지) |
| `app-promote-ota.yaml` | 앱 OTA 승격 | 수동 | OTA 번들 테스터 → 전체, 롤백 |

## 앱 흐름

```
chamApp 푸시
 ├─ 네이티브 파일도 바뀜 ─→ Android AAB → Play 비공개 테스트(alpha) ─[앱 Play 프로덕션 승격]→ 프로덕션
 │                       └→ iOS IPA   → TestFlight(내부 테스트 자동)  ─[앱 App Store 출시]→ 심사 → 출시
 └─ JS 만 바뀜 ─────────→ OTA 번들(alpha 채널, "베타 업데이트 받기" 켠 기기만) ─[앱 OTA 승격]→ 전체
```

- "JS 만" = `chamApp/src/**`, `App.tsx`, `index.js`. 그 밖의 파일이 하나라도 섞이면 스토어 빌드로 간다.
- 수동 실행(앱 빌드)은 스토어 빌드만 한다. 플랫폼(ios/android/both)을 고른다.

## 프로덕션 출시 조작

| 하고 싶은 것 | Android (앱 Play 프로덕션 승격) | iOS (앱 App Store 출시) |
|---|---|---|
| 테스트한 빌드 내보내기 | `promote` (rollout 0.2 = 20%) | `submit` → 심사(보통 하루) → `release` |
| 비율 늘리기 | `rollout` | 없음. 애플이 7일에 걸쳐 1→100% 자동으로 올린다 |
| 전원에게 | `complete` | `complete` |
| 멈추기 | `halt` | `pause` (다시 `resume`) |
| 지금 상태 | Play Console | `status` |

- iOS 는 `release_after_approval` 을 켜면 승인 즉시 나가서 `release` 를 안 눌러도 된다.
- iOS 첫 출시는 단계적 출시가 안 된다(애플 제약, 업데이트부터 가능). 그래서 첫 출시 때는 phased 를 켜 둬도 무시한다.
- iOS 메타데이터(설명·스크린샷·개인정보·연령등급·심사용 연락처)는 App Store Connect 화면에서 관리한다.
  빠진 게 있으면 `submit` 이 실패하면서 그 항목을 로그에 보여준다.
- 스크립트는 `.github/scripts/app-store.rb` (App Store Connect API 직접 호출).

## 빌드 번호·버전

빌드 번호 = `run_number + BUILD_NUMBER_OFFSET`(app-release.yaml). Android versionCode 와 iOS 빌드 번호가 같은 값이다.
보이는 버전 = 앞자리 + 빌드 번호(예 `1.0.1042`). 앞자리는 Android 가 `build.gradle` 의 versionName, iOS 가 Xcode 의 MARKETING_VERSION.
큰 업데이트 때 둘 다 같이 올린다. iOS 는 같은 버전 문자열로 두 번 출시할 수 없어서 빌드 번호를 붙인다.
`run_number` 는 워크플로 파일마다 1부터 다시 세므로 **`app-release.yaml` 이름을 바꾸면 오프셋을 올려야 한다.**
안 그러면 번호가 줄어들어 스토어가 업로드를 거부한다.

## 공통 준비 단계

`.github/actions/app-setup` — Node 22 + `npm ci` + `.env` 생성. android·ios·ota 잡이 같이 쓴다.
`.env` 키를 추가하면 여기와 호출하는 두 잡(android·ios)의 `with:` 를 같이 고친다.
