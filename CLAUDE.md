# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Seoul disaster shelter information & citizen-report system. Monorepo with a Spring Boot API, a Vite/React admin+research web, and a bootstrap React Native app.

```
cham-equality/
├─ chamApi/            Spring Boot 4.0.3 backend  (see chamApi/CLAUDE.md)
├─ front/              React 19 + Vite 8 web     (research + admin, served under /research/)
├─ chamApp/            React Native 0.84 app     (template stage — no business logic yet)
└─ dummy-shelter.sql   Seed data: 100 Seoul shelters across 25 구
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

Core API endpoints (see `chamApi/CLAUDE.md` for auth/authorization details):

```
GET    /api/shelters?keyword=&page=&size=
POST   /api/shelter-reports
GET    /api/shelter-reports/{id}
PUT    /api/shelter-reports/{id}                 (requires X-User-Password)
GET    /api/shelter-reports/shelter/{shelterId}

POST   /api/admin/login
GET    /api/admin/reports?status=
GET    /api/admin/reports/{id}
POST   /api/admin/reports/{id}/approve | /reject

POST   /api/presigned-url                         (S3 upload URL)
POST   /api/upload-file                           (register uploaded file)
GET    /api/download-file/{id}
POST   /api/download-file/zip                     (bulk by ids)
POST   /api/refresh
```

## Database

- MySQL schema `CHAM_EQUALITY`, managed manually (`ddl-auto: none`). See `chamApi/README-db.md` for conventions (BIGINT PK, SNAKE_CASE uppercase columns, every table has `CREATE_DATE`/`MODIFY_DATE`).
- Seed: load `dummy-shelter.sql` into `CHAM_EQUALITY` after running the app once so table DDL exists.
- Tests hit the real DB via the same `.env` — there is no H2 fallback.

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
