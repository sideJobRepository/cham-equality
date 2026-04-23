# chamApp (React Native)

`cham-equality` 모노레포의 모바일 앱. 대피소 정보 열람 + 시민 제보를 담당한다.

- React Native 0.84 (bare, Expo 아님) — **New Architecture (Fabric/Bridgeless) 활성**
- React 19
- 타겟: Android / iOS
- 로그인: 카카오 (추후 네이버/구글/애플 추가 예정)
- 백엔드: `../chamApi` (Spring Boot, `/api/*`)

---

## 개발 환경 요구사항

| 항목 | 버전 / 비고 |
|---|---|
| Node.js | **>= 22.11** (`package.json` engines) |
| JDK | **17** (Android Gradle Plugin 요구사항) |
| Android Studio | 최신 안정판 |
| Android SDK | API 34 (UpsideDownCake) 이상 |
| Xcode | 15 이상 (iOS 빌드 시, **맥 필수**) |
| CocoaPods | 최신 (iOS 빌드 시) |

> iOS는 macOS에서만 빌드 가능하다. 윈도우/리눅스에서는 Android만 개발할 수 있다.

---

## 초기 세팅 (머신당 1회)

### 1. Android SDK 경로 설정

Android Studio 설치 후 SDK 위치를 확인한다. 보통:
- Windows: `C:\Users\<사용자>\AppData\Local\Android\Sdk`
- macOS: `~/Library/Android/sdk`

**환경변수 등록 (권장)** — OS 설정에서 다음 세 개를 추가한다. 터미널 / IDE 모두 닫았다가 새로 열어야 반영된다.

| 변수 | 값 |
|---|---|
| `ANDROID_HOME` | 위 SDK 경로 |
| `PATH`에 추가 | `%ANDROID_HOME%\platform-tools` (Windows) / `$ANDROID_HOME/platform-tools` (macOS) |
| `PATH`에 추가 | `%ANDROID_HOME%\emulator` / `$ANDROID_HOME/emulator` |

확인:
```bash
echo $ANDROID_HOME
adb version
```

**대안 — `local.properties`** (환경변수 귀찮을 때)
`chamApp/android/local.properties`:
```
sdk.dir=C:\\Users\\<사용자>\\AppData\\Local\\Android\\Sdk
```
> `.gitignore` 대상이라 머신별로 직접 만들어야 한다.

### 2. AVD 만들기

Android Studio → `Tools → Device Manager → Create Virtual Device`
- Pixel 7 (또는 Pixel 6) → Next
- System Image: API 34 (UpsideDownCake) 다운로드 → Next → Finish
- 생성된 AVD 옆 ▶ 버튼으로 실행, 홈화면까지 대기

### 3. `.env` 파일 생성

`chamApp/.env` 파일을 만들고 다음 값을 채운다:
```
KAKAO_NATIVE_APP_KEY=<카카오 디벨로퍼스 - 앱 설정 - 네이티브 앱 키>
API_BASE_URL=http://10.0.2.2:8080
```
> `.env`는 `.gitignore` 대상. 머신별로 직접 작성해야 한다.

### 4. 카카오 디버그 키 해시 (이미 등록됨 — 확인만)

**이 프로젝트는 `chamApp/android/app/debug.keystore`를 Git에 커밋해서 공유한다.** 그래서:
- 팀원 전원이 같은 서명 키를 쓰고, 키 해시도 동일
- 카카오 디벨로퍼스에 **디버그 키 해시 하나만 등록해 두면 모두 로그인 가능**
- 새 개발 머신에서 별도로 뽑아서 등록할 필요 없음 — `git clone`만 받으면 끝

확인용: 현재 키 해시 뽑아보기
```bash
cd chamApp/android
keytool -exportcert -alias androiddebugkey \
  -keystore app/debug.keystore \
  -storepass android -keypass android \
  | openssl sha1 -binary | openssl base64
```

값이 카카오 디벨로퍼스 → 앱 설정 → 플랫폼 → Android → **키 해시** 에 등록된 값과 같은지만 확인하면 된다. 다르다면 누군가 `debug.keystore`를 교체한 상황이니 팀에 확인.

> 릴리즈용 키스토어(플레이스토어 배포용)는 **절대 Git에 올리지 말 것.** 별도 비밀 저장소로 관리.

### 5. 의존성 설치

```bash
cd chamApp
npm install
```

iOS(맥)면 추가:
```bash
cd ios && bundle install && bundle exec pod install
```

---

## 실행 방법

### Android

1. 에뮬레이터를 먼저 띄운다 (Android Studio → Device Manager → ▶)
2. 앱 빌드 + 설치 + 실행:
   ```bash
   cd chamApp
   npm run android
   ```

하는 일:
- Metro 번들러 자동 실행 (포트 8081)
- Gradle로 APK 빌드
- 에뮬레이터에 설치
- 앱 자동 실행

### iOS (맥)

```bash
cd chamApp
npm run ios
```

### Metro만

네이티브 재빌드 없이 JS만 재실행:
```bash
npm start
```

---

## 개발 루프

### Hot Reload (JS/TSX 수정)

- 저장 → 에뮬레이터에 **자동 반영** (1~2초)
- 반영 안 되면 에뮬에서 `R` 두 번 → 수동 리로드
- `Ctrl+M` (Win) / `Cmd+M` (Mac) → Dev Menu

### JS 로그 보는 법

RN 0.73+부터 JS 로그가 Metro 터미널에 안 찍힌다. Metro 터미널에서 **`j` 키** 누르면 **React Native DevTools**가 열리고 Console 탭에서 확인 가능.

### 재빌드 필요한 경우 (`npm run android` 재실행)

- 새 네이티브 패키지 설치 후
- `AndroidManifest.xml`, `Info.plist`, `build.gradle`, `settings.gradle` 수정
- Kotlin/Swift 네이티브 소스 수정

---

## 주요 의존성

| 패키지 | 역할 |
|---|---|
| `@react-native-kakao/core`, `@react-native-kakao/user` | 카카오 로그인 (New Arch 호환) |
| `@react-navigation/native` + `native-stack` | 화면 전환 |
| `react-native-screens` | 네비게이션 성능용 (네이티브 뷰 스택) |
| `react-native-safe-area-context` | 노치/상단바 안전 영역 |
| `axios` | HTTP 클라이언트 |
| `@tanstack/react-query` | 서버 상태 (캐싱/리페치) |
| `zustand` | 클라 상태 (로그인 상태 등) |
| `react-native-keychain` | 리프레시 토큰 보안 저장 |
| `@react-native-async-storage/async-storage` (**v2.x**) | 일반 로컬 저장. v3은 New Arch에서 `storage-android` 의존성 문제 있어서 **v2로 고정** |
| `react-native-config` | 환경변수 (`.env` 읽기) |

---

## 폴더 구조

```
chamApp/
├─ android/                    Android 네이티브
├─ ios/                        iOS 네이티브
├─ App.tsx                     RN 루트 컴포넌트
├─ index.js                    RN 진입점 (Kakao SDK 초기화 여기서)
├─ src/
│  ├─ auth/                    카카오 로그인, 토큰 관리
│  │  └─ kakao.ts              loginWithKakao(), logoutFromKakao()
│  ├─ api/                     (예정) axios 인스턴스, API 호출
│  ├─ navigation/              (예정) React Navigation 설정
│  ├─ screens/                 (예정) 화면 단위 컴포넌트
│  ├─ components/              (예정) 재사용 컴포넌트
│  ├─ store/                   (예정) zustand 스토어
│  └─ types/                   (예정) TS 타입
├─ .env                        환경변수 (gitignored)
├─ .env.example                환경변수 템플릿
├─ package.json
└─ tsconfig.json
```

---

## 카카오 로그인 세팅

### 어떻게 구성돼 있는지

1. **`.env`의 `KAKAO_NATIVE_APP_KEY`** 한 곳에서 관리
2. **Android 빌드 시**: `react-native-config`의 `dotenv.gradle`이 `.env`를 읽음 → `project.env.get("KAKAO_NATIVE_APP_KEY")`로 Gradle에서 사용 가능
3. `build.gradle`에서 **manifestPlaceholder**로 `kakao{APPKEY}` URL scheme 주입
4. `AndroidManifest.xml`의 `AuthCodeHandlerActivity`가 그 scheme으로 들어오는 OAuth 리다이렉트를 받음
5. **런타임**: `index.js`에서 `Config.KAKAO_NATIVE_APP_KEY`로 SDK 초기화 (`initializeKakaoSDK()`)
6. `src/auth/kakao.ts`의 `loginWithKakao()` 호출 → 카카오톡 앱 또는 웹 OAuth → 토큰 반환

### Android 파일별 역할

| 파일 | 뭘 하나 |
|---|---|
| `android/settings.gradle` | 카카오 Maven 저장소 등록 (`devrepo.kakao.com`). `repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)` 필요 |
| `android/app/build.gradle` | `dotenv.gradle` apply + `manifestPlaceholders = [KAKAO_SCHEME: "kakao" + kakaoAppKey]` |
| `android/app/src/main/AndroidManifest.xml` | `AuthCodeHandlerActivity` 등록 (URL scheme `${KAKAO_SCHEME}://oauth`) |
| `chamApp/index.js` | `initializeKakaoSDK(Config.KAKAO_NATIVE_APP_KEY)` 앱 부팅 시 호출 |
| `chamApp/src/auth/kakao.ts` | `@react-native-kakao/user`의 `login/logout/me` 래핑 |

### iOS 세팅 (맥에서 작업 필요)

- `ios/chamApp/Info.plist`에 `CFBundleURLTypes`(URL scheme `kakao{APPKEY}`) + `LSApplicationQueriesSchemes`(`kakaokompassauth`, `kakaolink`) 추가
- `@react-native-kakao/core` iOS 설정은 [라이브러리 문서](https://github.com/Pelagornis/react-native-kakao) 참조

---

## 백엔드 연동

- Base URL: 로컬 개발 시 `http://10.0.2.2:8080` (Android 에뮬 → 호스트 머신), iOS 시뮬레이터는 `http://localhost:8080`
- **흐름**: 앱이 카카오 SDK로 access token 획득 → `POST /api/auth/social/kakao`로 백엔드에 전달 → 백엔드가 카카오로 토큰 검증 + `MEMBER` upsert + 자체 JWT(access/refresh) 발급 → 앱에 반환
- 백엔드에 소셜 로그인 로직은 이미 있음 (`chamApi/src/main/java/com/chamapi/security/service/impl/KaKaoServiceImpl.java` 등)
- JWT access: 메모리, refresh: `react-native-keychain` (쿠키 아님 — 모바일이라)

---

## 자주 마주치는 에러

### `No connected devices!`
에뮬레이터가 안 떠 있거나 부팅 덜 끝남. Device Manager → ▶, 홈화면까지 기다린 뒤 재시도.

### `SDK location not found`
`ANDROID_HOME` 환경변수 미설정. 초기 세팅 섹션 참고. 임시로는 `android/local.properties`에 `sdk.dir=...`.

### `'adb'은(는) 내부 또는 외부 명령이 아닙니다`
PATH에 `platform-tools` 미등록. 빌드·설치는 되지만 자동 실행만 실패. PATH에 `%ANDROID_HOME%\platform-tools` 추가 후 **모든 터미널·IDE 재시작**.

### `Could not find com.kakao.sdk:v2-common:...`
카카오 SDK는 Maven Central에 없고 카카오 자체 저장소(`devrepo.kakao.com`)에 있음. `android/settings.gradle`의 `dependencyResolutionManagement`에 등록돼 있어야 하고, 모드는 **`PREFER_SETTINGS`** (서브프로젝트가 자기 repo 선언해도 settings repo를 함께 사용).

### `Cannot read property 'login' of null` (카카오 SDK 호출 시)
라이브러리가 New Architecture(Bridgeless)를 지원하지 않아서 네이티브 모듈이 등록 안 됨. **`@react-native-seoul/kakao-login`이 아니라 `@react-native-kakao/core` + `@react-native-kakao/user`를 써야** New Arch 환경에서 동작.

### `Could not find org.asyncstorage.shared_storage:storage-android:1.0.0`
`@react-native-async-storage/async-storage@3.x`가 자체 `local_repo`를 요구하는데 Gradle이 못 찾음. **v2.x로 고정**(`"@react-native-async-storage/async-storage": "^2.1.0"`).

### Metro는 뜨는데 `No apps connected`
앱 자체가 에뮬레이터에 설치 안 된 상태. `npm run android`로 APK 빌드·설치부터.

### 패키지 설치 후 `cannot find native module`
네이티브 모듈이 붙은 라이브러리는 설치만으로 부족. `npm run android` 재빌드 필요 (iOS는 `pod install` 후 `npm run ios`).

### 카카오 로그인 시 Chrome "Google 계정으로 로그인" 프롬프트
Kakao SDK가 카카오톡 앱 부재로 Chrome Custom Tabs를 쓰는데, Chrome이 처음 실행되면 Google 계정 연결 프롬프트를 띄움. 건너뛰기(No thanks)하면 진짜 카카오 로그인 페이지가 뜬다.

### LF will be replaced by CRLF 경고
Windows에서 Git이 줄바꿈 자동 변환. 무시.

### `Need to install react-native@x.x.x`
`npx react-native`를 프로젝트 외부에서 실행한 것. `chamApp/` 안에서 `npm run android`로 실행할 것.

---

## 참고 문서

- 루트: `../CLAUDE.md` — 모노레포 구조, 모듈 간 통신
- 백엔드: `../chamApi/CLAUDE.md` — API 구조, 인증/인가
- React Native: https://reactnative.dev
- `@react-native-kakao/*`: https://github.com/Pelagornis/react-native-kakao
- Kakao 디벨로퍼스: https://developers.kakao.com
