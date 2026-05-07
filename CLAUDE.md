# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Seoul disaster shelter information & citizen-report system. Monorepo with a Spring Boot API, a Vite/React admin+research web, and a bootstrap React Native app.

```
cham-equality/
├─ chamApi/            Spring Boot 4.0.3 backend  (see chamApi/CLAUDE.md)
├─ front/              React 19 + Vite 8 web     (research + admin, served under /research/)
├─ chamApp/            React Native 0.84 app     (template stage — no business logic yet)
├─ dummy-shelter.sql   Seed data: 100 Seoul shelters across 25 구 (개발용 더미)
└─ shelter.sql         실제 대전 대피소 1100건 (정보공개청구 4종 통합)
```

Each module is self-contained (own `package.json` / `build.gradle`, own `.env`). There is no root workspace manager; commands below are run per-module.

## Build & run

Backend (`chamApi/`):
```
./gradlew bootRun                                            # dev on :8080 (application.yml)
./gradlew bootRun --args='--spring.profiles.active=real'     # real profile
./gradlew test
```

Web (`front/`):
```
npm install
npm run dev        # Vite on :5173, basePath /research/
npm run build
npm run lint
```

App (`chamApp/`):
```
npm install
npm start          # Metro
npm run android | npm run ios    # Node >= 22.11
```

## How the front and the API talk

- Web dev server proxies `/api` → `http://localhost:8080` (`front/vite.config.ts`).
- API is **always** reached via the `/api` prefix from the front — do not hardcode `localhost:8080`. `src/api/http.ts` sets `axios` `baseURL = '/api'`.
- Backend CORS allows the Vite origin via `cors.url: http://localhost:5173` in `application.yml`.
- Auth headers from the front:
  - `X-Admin-Password` — set from `sessionStorage` after admin login, attached per request.
  - `X-User-Password` — one-shot password on citizen report edit (not stored).
- Refresh token lives in an HttpOnly cookie issued by the backend (`auth.cookie.*`).

## Routing map

Web routes are all under the Vite base path `/research/`:

| Path                              | Page                  |
|-----------------------------------|-----------------------|
| `/research/shelters`              | ShelterListPage       |
| `/research/admin/login`           | AdminLoginPage        |
| `/research/admin/reports`         | AdminReportsPage      |
| `/research/admin/shelters`        | AdminSheltersPage     |

Core API endpoints (see `chamApi/CLAUDE.md` for auth/authorization details):

```
GET    /api/shelters?keyword=&filter=&page=&size= (keyword matches name|address|oldAddress; filter ∈ SUBMITTED|COMPLETED|NOT_SUBMITTED|RE_INVESTIGATION)
POST   /api/shelter-reports                       (X-User-Password required iff shelter.surveyStatus=RE_INVESTIGATION)
GET    /api/shelter-reports/{id}
PUT    /api/shelter-reports/{id}                  (requires X-User-Password)
GET    /api/shelter-reports/shelter/{shelterId}

POST   /api/admin/login
GET    /api/admin/reports?filter=&page=&size=     (filter ∈ PENDING|APPROVED|REJECTED|RE_INVESTIGATION; RE_INVESTIGATION = pending reports on shelters with surveyStatus=RE_INVESTIGATION)
GET    /api/admin/reports/{id}
POST   /api/admin/reports/{id}/approve | /reject
POST   /api/admin/reports/{id}/re-investigate     (unlock shelter for citizen resubmit)
GET    /api/admin/shelters?keyword=&page=&size=
PUT    /api/admin/shelters/{id}                   (admin-only fields: name, builtYear, shelterType)

POST   /api/presigned-url                         (S3 upload URL)
POST   /api/upload-file                           (register uploaded file)
GET    /api/download-file/{id}                    (filename rewritten by FileNameResolver beans)
POST   /api/download-file/zip                     (bulk by ids; same rewrite applies)
POST   /api/refresh
```

## Citizen submission gate (Shelter.surveyStatus)

Each `Shelter` row carries `SHELTER_SURVEY_STATUS` (enum `ShelterSurveyStatus`) which gates citizen submissions to `POST /api/shelter-reports`:

- `NOT_INVESTIGATED` — no approval has happened yet → submit freely (no password)
- `INVESTIGATED` — one report has been approved → backend rejects new submissions with 400; the front shows a "완료" badge and blocks the row
- `RE_INVESTIGATION` — admin pressed "재조사 요청" on an approved report → submissions are accepted again **but only with `X-User-Password`**

State transitions: approve → `INVESTIGATED`; admin re-investigate → `RE_INVESTIGATION`; subsequent approve → back to `INVESTIGATED`.

## Admin-only shelter fields

`Shelter.name`, `Shelter.builtYear`, `Shelter.shelterType`, and `Shelter.safetyGrade` are **never written by citizen reports**. They only change through `PUT /api/admin/shelters/{id}` (`AdminSheltersPage` UI). The citizen submission form (`ShelterReportModal`) shows them as read-only in the header info box and does not expose any input. `Shelter.applyReport()` does not copy them from `ShelterInfoReport`, and `ShelterInfoReport` no longer carries those columns.

## Accessibility photo uploads

Citizen reports attach photos **per accessibility facility**, not as a single bucket: each row of "장애인 화장실 / 경사로 / 엘리베이터 / 점자블록 / 기타 접근성 시설" has its own multi-file picker that hard-codes the corresponding `ShelterImageCategory` (`TOILET`/`RAMP`/`ELEVATOR`/`BRAILLE`/`ETC`). There is no per-image category dropdown anymore.

## Database

- MySQL schema `CHAM_EQUALITY`, managed manually (`ddl-auto: none`). See `chamApi/README-db.md` for conventions (BIGINT PK, SNAKE_CASE uppercase columns, every table has `CREATE_DATE`/`MODIFY_DATE`).
- Seed: load `dummy-shelter.sql`(서울 더미 100건) 또는 `shelter.sql`(대전 실데이터 1100건)을 `CHAM_EQUALITY`에 로드. 두 파일 모두 헤더에 동일한 `ALTER TABLE` 가이드(add `SHELTER_OLD_ADDRESS` / `SHELTER_TYPE` / `SHELTER_SURVEY_STATUS` on `SHELTER`; drop `SHELTER_NAME` / `SHELTER_BUILT_YEAR` / `SHELTER_SAFETY_GRADE` from `SHELTER_INFO_REPORT`)를 포함 — 컬럼이 아직 없으면 한 번 적용해야 함. `shelter.sql`은 맨 앞에 `DELETE FROM SHELTER; ALTER TABLE SHELTER AUTO_INCREMENT = 1;`이 있어 기존 행을 비우고 갈아끼움.
- Tests hit the real DB via the same `.env` — there is no H2 fallback.

### shelter.sql (대전 실데이터 1100건)

정보공개청구로 받은 4개 엑셀(리포지토리 루트의 `*.xlsx`)을 통합. 각 파일은 `ShelterType` enum 값으로 매핑됨:

| 출처 엑셀 | 건수 | `SHELTER_TYPE` | 좌표 | 비고 |
|---|---|---|---|---|
| 대전 민방위 대피시설 내역(25.12.31. 기준).xlsx | 614 | `CIVIL_DEFENSE` | DMS→십진수 변환 | 도로명·지번 둘 다 보유 → `SHELTER_OLD_ADDRESS`도 채움 |
| 임시주거시설목록(대전시).xlsx (내진설계 적용) | 104 | `EARTHQUAKE_TEMPORARY_HOUSING` | 십진수 | 지진겸용 |
| 임시주거시설목록(대전시).xlsx (내진설계 미적용) | 94 | `DISASTER_TEMPORARY_HOUSING` | 십진수 | 일반 이재민용 |
| 지진옥외대피장 현황.xlsx (대전 행만) | 249 | `EARTHQUAKE` | **없음** | 전국 자료 중 `관할 시도 = 대전광역시`만 필터 |
| 화학사고 대피장소 현황 정보공개.xlsx | 39 | `CHEMICAL_ACCIDENT` | **없음** | 서구만. 소재지에 `대전광역시 서구 ` 자동 prefix |

- 위/경도 미보유 288건(`EARTHQUAKE` + `CHEMICAL_ACCIDENT`)은 NULL — 지도 표시하려면 별도 지오코딩 필요.
- `SHELTER_SAFETY_GRADE`는 4개 자료 어디에도 없어 전부 NULL.
- `SHELTER_SURVEY_STATUS`는 모든 행 `NOT_INVESTIGATED`로 시작.
- `SHELTER_OLD_ADDRESS`는 민방위 자료에만 지번 정보가 있어 그 614건만 채워짐, 나머지 486건은 NULL.
- 임시주거 타입 분기는 엑셀 `내진설계` 컬럼(`적용`/`미적용`)으로 결정 — `ShelterType` 주석의 "지진겸용" vs "이재민" 정의에 맞춤.
- 민방위 자료의 이동약자 시설 매핑:
  - `완만한경사로 + 출입구경사로 + 접이식이동경사로 > 0` → `SHELTER_RAMP_WHETHER = 1`
  - `승강기 + 장애인용에스컬레이터 > 0` → `SHELTER_ELEVATOR_WHETHER = 1`
  - `점자블록 > 0` → `SHELTER_BRAILLE_BLOCK_WHETHER = 1`
  - 나머지(휠체어리프트·계단용들것·점자안내판·라디오중계기·라디오수신장치)는 `SHELTER_ETC_ACCESSIBILITY_FACILITIES`에 콤마 결합.
  - `SHELTER_ACCESSIBLE_TOILET_WHETHER`는 원본에 정보 없음 → NULL.
- `미입력`, `정보부존재`, 빈 문자열은 모두 NULL로 변환.
- 재생성/검증 스크립트는 `C:\tmp\gen-shelter-sql.js` / `C:\tmp\verify-shelter2.js` (Node + xlsx 패키지 필요).

## Environment

`chamApi/.env` (loaded via `spring-dotenv`):
```
DB_URL, DB_PORT, DB_USERNAME, DB_PASSWORD
AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION, AWS_BUCKET
ADMIN_PASSWORD, USER_PASSWORD
COOKIE_SECURE           # false for local http
```

`front/` and `chamApp/` currently have no env vars; the front relies entirely on the Vite proxy in dev and the `/research/` base path in prod.

## Deeper docs

- `chamApi/CLAUDE.md` — backend package layout, dynamic URL↔Role authorization, RSA JWT (public key in file, private key in DB), QueryDSL repo trio, S3 presigned-URL cache.
- `chamApi/README-db.md` — DB naming / column conventions.
- `chamApp/README.md` — React Native standard setup.
