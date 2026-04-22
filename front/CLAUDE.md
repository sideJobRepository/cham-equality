# CLAUDE.md

Front-end module. See the repo-root `CLAUDE.md` for how this module fits into the monorepo, ports, and the Vite proxy.

## Stack

React 19 + TypeScript 6.0 + Vite 8 + react-router-dom 7 + axios + jszip. No Tailwind, no CSS Modules — plain `.css` files imported per component. No state library, no React Query — each page manages its own `useState` + effect calls.

## Scripts

```
npm run dev        # Vite dev server on :5173, basePath /research/
npm run build      # tsc -b (project references) then vite build
npm run lint       # eslint . (flat config, typescript-eslint + react-hooks + react-refresh)
npm run preview
```

`tsconfig.app.json` does **not** enable `strict`, but does set `noUnusedLocals`, `noUnusedParameters`, and `verbatimModuleSyntax: true` — so type-only imports must use `import type`.

## Layout

```
src/
├─ main.tsx                         # Root + BrowserRouter(basename="/research")
├─ index.css                        # Global styles
├─ api/
│  ├─ http.ts                       # axios instance, interceptors, password injection, UnauthorizedError
│  ├─ shelterApi.ts                 # /api/shelters, /shelter-reports, uploadShelterImage
│  └─ adminApi.ts                   # /api/admin/*, getDownloadUrl, downloadFilesAsZip
├─ types/shelter.ts                 # Shelter, PageResponse<T>, ApiResponse<T>
├─ lib/file/
│  ├─ presignedUpload/              # Generic presigned-URL uploader factory
│  └─ download/                     # saveBlob, downloadFile, downloadAsZip, zipBlobs
├─ pages/
│  ├─ ShelterListPage.tsx           # /research/shelters
│  ├─ AdminLoginPage.tsx            # /research/admin/login
│  └─ AdminReportsPage.tsx          # /research/admin/reports
└─ components/
   ├─ ShelterReportModal.tsx        # Create/edit report (images + accessibility fields)
   ├─ PendingReportsListModal.tsx   # List pending reports for one shelter
   └─ AdminReportDetailModal.tsx    # Admin detail view + approve/reject + downloads
```

## Routing

`main.tsx` wraps everything in `<BrowserRouter basename="/research">`. All in-app paths should be written **without** the `/research` prefix — React Router adds it. So `navigate('/admin/login')`, not `navigate('/research/admin/login')`.

| Path (in-app)       | Element              |
|---------------------|----------------------|
| `/`                 | Navigate → `/shelters` |
| `/shelters`         | `ShelterListPage`    |
| `/admin`            | Navigate → `/admin/reports` |
| `/admin/login`      | `AdminLoginPage`     |
| `/admin/reports`    | `AdminReportsPage`   |

## API layer

`src/api/http.ts` is the single axios instance. `baseURL: '/api'`, so always call paths as `/shelters`, `/admin/reports`, etc. — never hardcode the host.

### Password-header flow (important)

The backend has no session/JWT in the browser; it authenticates admin and edit actions by two custom headers that the request interceptor injects:

- **`X-Admin-Password`** — persistent.
  - Stored in `sessionStorage['admin-password']` via `setAdminPassword(pw)` after `adminLogin(pw)` succeeds.
  - Interceptor attaches it to every request whose path starts with `/admin` or `/download-file`.
  - On a `401` for those paths, the response interceptor throws `UnauthorizedError` (exported from `http.ts`). Pages/modals must catch it and call `clearAdminPassword()` + navigate back to `/admin/login`.
- **`X-User-Password`** — one-shot.
  - Set immediately before a single request via `useNextUserPassword(pw)`; the interceptor attaches it once and clears it. Currently only `updateShelterReport` uses this.
  - Do not persist user passwords anywhere.

`adminApi.ts` re-exports `getAdminPassword`, `setAdminPassword`, `clearAdminPassword`, and `UnauthorizedError` so pages import them from one place.

### Endpoint wrappers

Keep all HTTP calls inside `src/api/*.ts`. Pages should not import `axios` or call `http` directly — they call the typed wrappers:

- `shelterApi.ts`: `fetchShelters(page, size, keyword?)`, `createShelterReport(body)`, `fetchPendingReportsByShelter(shelterId)`, `fetchShelterReportDetail(id)`, `updateShelterReport(id, body, userPassword)`, `uploadShelterImage(file)`.
- `adminApi.ts`: `adminLogin(password)`, `fetchReports(status, page, size)` where `status` is `ShelterReportStatus | 'ALL'`, `fetchReportDetail(id)`, `approveReport(id)`, `rejectReport(id)`, `getDownloadUrl(fileId)`, `downloadFilesAsZip(ids, name)`.

Response envelope from the API is `ApiResponse<T> = { code, success, message, data }`. Wrappers unwrap `.data.data` and return just `T`; pages should not see the envelope. Paged endpoints return `PageResponse<T>`.

## Presigned-URL upload

`src/lib/file/presignedUpload/createUploader.ts` exposes a generic `createPresignedUploader<Presign, Registered>(adapter)` factory. The adapter supplies two API calls (`requestPresignedUrls`, `registerUploadedFiles`) and optionally `putToRemote` (defaults to `axios.put`). The returned object has `upload(file)` and `uploadMany(files)` which run:

1. POST presign-URL request for all files
2. PUT each file to its presigned URL in parallel
3. POST register, returning the backend file records

`shelterApi.ts` builds one instance (`shelterImageUploader`) with `fileType: 'SHELTER_IMAGE'` and exposes `uploadShelterImage(file)`. If you add another upload kind, build a new uploader with the same factory — don't duplicate the three-step sequence inline.

## Download / ZIP

Two places handle downloads — keep them straight:

- `src/lib/file/download/index.ts` — generic helpers: `saveBlob(blob, name)`, `downloadFile(url, name)`, `downloadAsZip(items, zipName)` (client-side jszip), `zipBlobs(items, zipName)`.
- `adminApi.ts#downloadFilesAsZip(ids, name)` — calls `POST /download-file/zip` with `responseType: 'blob'`. **The server returns a ready-made ZIP**; do not run it through jszip again. Pass the result straight to `saveBlob`.

Use `downloadAsZip` (client-side) only if you ever need to bundle URLs the server didn't zip.

## Modal conventions

All three modals follow the same pattern — copy it when adding another:

- Backdrop `onClick={onClose}`; inner `onClick={e => e.stopPropagation()}`.
- `useEffect` to listen for `Escape` and to set `document.body.style.overflow = 'hidden'`; cleanup both on unmount.
- Props shape is `{ ...inputs, onClose, onSubmitted | onActionDone, onUnauthorized? }` — parents handle navigation; modals do not call `useNavigate`.
- On `UnauthorizedError` inside an admin modal, call `onUnauthorized()` rather than navigating yourself.

`ShelterReportModal` has two modes keyed by whether `reportId` is passed. In edit mode it requires a user password (bound to `X-User-Password`) and disables submit while any image is still uploading (tracked in a `PendingImage` local state with `uploading | done | failed`, with retry).

## Page conventions

- Each page owns its loading / error / page / data state with `useState`; no shared store.
- Error handling: `try/catch` around the API call, set an `error` string, render inline. In admin pages, first check `if (e instanceof UnauthorizedError)` → `clearAdminPassword()` → `navigate('/admin/login')`.
- `ShelterListPage` debounces the search input by 300ms before calling `fetchShelters`.
- Flash messages are local `useState` with a `setTimeout` (2500ms) clear — no toast library.
- Pagination is block-based (10 per block), implemented inline in `ShelterListPage` and `AdminReportsPage`. There is no shared `<Pagination>` component yet — if a third page needs it, extract then.

## Styling

Plain CSS, one file per component, co-located (`ShelterReportModal.tsx` + `ShelterReportModal.css`). Global reset/typography in `src/index.css`. Do not introduce Tailwind or CSS-in-JS without discussing — the current convention is intentional.

## Gotchas

- `base: '/research/'` in `vite.config.ts` must match the `basename` in `main.tsx` and the backend's serving path. Changing one without the others breaks routing.
- The Vite proxy only runs in `npm run dev`. `npm run preview` serves the built bundle but does **not** proxy `/api` — you need the backend reachable at the same origin (or a reverse proxy).
- `verbatimModuleSyntax` is on: `import { Shelter } from '../types/shelter'` fails if `Shelter` is a type-only export. Use `import type`.
- `sessionStorage` (not `localStorage`) is intentional — closing the tab logs the admin out.
