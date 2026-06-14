# CLAUDE.md

Front-end module. See the repo-root `CLAUDE.md` for how this module fits into the monorepo, ports, and the Vite proxy.

## Stack

React 19 + TypeScript 6.0 + Vite 8 + react-router-dom 7 + axios. No Tailwind, no CSS Modules — plain `.css` files imported per component. No state library, no React Query — each page manages its own `useState` + effect calls. No i18n on the web; only `chamApp/` has multi-language.

## Scripts

```
npm run dev        # Vite dev server on :5173, basePath /research/
npm run build      # tsc -b (project references) then vite build
npm run lint       # eslint . (flat config, typescript-eslint + react-hooks + react-refresh)
npm run preview
```

`tsconfig.app.json` does **not** enable `strict`, but does set `noUnusedLocals`, `noUnusedParameters`, and `verbatimModuleSyntax: true` — so type-only imports must use `import type`.

### Path alias

`@/*` resolves to `src/*` — declared in both `tsconfig.app.json` (`paths`) and `vite.config.ts` (`resolve.alias`). Keep the two in sync when adding aliases. **Always import via `@/...`**, not relative paths (`../../api/...`). New code added with relative paths will fail review.

## Layout

```
src/
├─ main.tsx                         # Root + BrowserRouter(basename="/research")
├─ index.css                        # Global styles
├─ api/
│  ├─ http.ts                       # axios instance, interceptors, password injection, UnauthorizedError
│  ├─ shelterApi.ts                 # /api/shelters, /shelter-reports, uploadShelterImage
│  ├─ adminApi.ts                   # /api/admin/*, getDownloadUrl, downloadFilesAsZip
│  └─ contentApi.ts                 # /api/admin/contents/*, uploadContentImage
├─ types/
│  ├─ shelter.ts                    # Shelter, PageResponse<T>, ApiResponse<T>
│  └─ content.ts                    # Content, ContentType, ContentUpsertRequest
├─ lib/file/
│  ├─ presignedUpload/              # Generic presigned-URL uploader factory
│  └─ download/                     # saveBlob, downloadFile
├─ pages/
│  ├─ AdminLoginPage.tsx            # /research/admin/login
│  ├─ AdminReportsPage.tsx          # /research/admin/reports
│  ├─ AdminSheltersPage.tsx         # /research/admin/shelters
│  ├─ AdminContentsPage.tsx         # /research/admin/contents
│  └─ temp/
│     └─ ShelterListPage.tsx        # /research/shelters — legacy citizen survey, to be removed
└─ components/
   ├─ AdminLayout.tsx               # Sidebar shell shared by every admin page
   ├─ AdminReportDetailModal.tsx    # Admin detail view + approve/reject + downloads
   ├─ AdminShelterEditModal.tsx     # Admin-only shelter field edit
   ├─ AdminContentEditModal.tsx     # Create/edit content (image upload + display period)
   └─ temp/
      ├─ ShelterReportModal.tsx     # Citizen create/edit report — slated for removal
      ├─ PendingReportsListModal.tsx
      └─ ShelterInfoViewModal.tsx
```

The `temp/` subdirectories hold the citizen-survey UI (the original "research" mode) which is being phased out as the app pivots to admin-only management. Do not extend code under `temp/` — add new work in the top-level `pages/` and `components/` directories.

## Routing

`main.tsx` wraps everything in `<BrowserRouter basename="/research">`. All in-app paths should be written **without** the `/research` prefix — React Router adds it. So `navigate('/admin/login')`, not `navigate('/research/admin/login')`.

| Path (in-app)       | Element              |
|---------------------|----------------------|
| `/`                 | Navigate → `/shelters` |
| `/shelters`         | `temp/ShelterListPage` |
| `/admin`            | Navigate → `/admin/reports` |
| `/admin/login`      | `AdminLoginPage`     |
| `/admin/reports`    | `AdminReportsPage`   |
| `/admin/shelters`   | `AdminSheltersPage`  |
| `/admin/contents`   | `AdminContentsPage`  |

## API layer

`src/api/http.ts` is the single axios instance. `baseURL: '/api'`, so always call paths as `/shelters`, `/admin/reports`, etc. — never hardcode the host.

### Password-header flow (important)

The backend has no session/JWT in the browser; it authenticates admin and edit actions by two custom headers that the request interceptor injects:

- **`X-Admin-Password`** — persistent.
  - Stored in `sessionStorage['admin-password']` via `setAdminPassword(pw)` after `adminLogin(pw)` succeeds.
  - Interceptor attaches it to every request whose path starts with `/admin` or `/download-file`.
  - On a `401` for those paths, the response interceptor throws `UnauthorizedError` (exported from `http.ts`). Pages/modals must catch it and call `clearAdminPassword()` + navigate back to `/admin/login`.
- **`X-User-Password`** — one-shot.
  - Set immediately before a single request via `useNextUserPassword(pw)`; the interceptor attaches it once and clears it. Currently only `updateShelterReport` and `createShelterReport` (when the shelter is in `RE_INVESTIGATION`) use this.
  - Do not persist user passwords anywhere.

`adminApi.ts` re-exports `getAdminPassword`, `setAdminPassword`, `clearAdminPassword`, and `UnauthorizedError` so pages import them from one place.

### Endpoint wrappers

Keep all HTTP calls inside `src/api/*.ts`. Pages should not import `axios` or call `http` directly — they call the typed wrappers:

- `shelterApi.ts`: `fetchShelters(page, size, keyword?, filter?)`, `createShelterReport(body, userPassword?)`, `fetchPendingReportsByShelter(shelterId)`, `fetchApprovedReportsByShelter(shelterId)`, `fetchShelterReportDetail(id)`, `updateShelterReport(id, body, userPassword)`, `uploadShelterImage(file)`.
- `adminApi.ts`: `adminLogin(password)`, `fetchReports(status, page, size)` where `status` is `ShelterReportStatus | 'ALL' | 'RE_INVESTIGATION'`, `fetchReportDetail(id)`, `approveReport(id)`, `rejectReport(id)`, `reInvestigateReport(id)`, `fetchAdminShelters`, `updateAdminShelter`, `getDownloadUrl(fileId)`, `downloadFilesAsZip(ids, name)`.
- `contentApi.ts`: `fetchContents()`, `createContent(body)`, `updateContent(id, body)`, `deleteContent(id)`, `uploadContentImage(file)`. The server speaks `contentType` and `displayStartDate/EndDate` as `LocalDateTime`; the wrapper maps it to `type` + `YYYY-MM-DD` for the UI and resolves `imageFileId` → presigned download URL for display. `updateContent` is **full replacement**, not PATCH — pass every field, including ones the caller doesn't edit (e.g. preserve `additionalInfo` from the loaded content), or they get nulled out.

Response envelope from the API is `ApiResponse<T> = { code, success, message, data }`. Wrappers unwrap `.data.data` and return just `T`; pages should not see the envelope. Paged endpoints return `PageResponse<T>`.

## Presigned-URL upload

`src/lib/file/presignedUpload/createUploader.ts` exposes a generic `createPresignedUploader<Presign, Registered>(adapter)` factory. The adapter supplies two API calls (`requestPresignedUrls`, `registerUploadedFiles`) and optionally `putToRemote` (defaults to `axios.put`). The returned object has `upload(file)` and `uploadMany(files)` which run:

1. POST presign-URL request for all files
2. PUT each file to its presigned URL in parallel
3. POST register (transitions the file row from `UPLOADING` → `COMPLETE` on the server), returning the backend file records

Current uploaders, each with a distinct `fileType` constant the backend recognises:

- `shelterImageUploader` — `fileType: 'SHELTER_IMAGE'`, exposed via `shelterApi.uploadShelterImage(file)`.
- `contentImageUploader` — `fileType: 'CONTENT_IMAGE'`, exposed via `contentApi.uploadContentImage(file)`.

If you add another upload kind, build a new uploader with the same factory — don't duplicate the three-step sequence inline. The backend's `FileType` enum has to grow alongside.

## Download / ZIP

- `src/lib/file/download/index.ts` — generic helpers: `saveBlob(blob, name)`, `downloadFile(url, name)`.
- `adminApi.ts#downloadFilesAsZip(ids, name)` — calls `POST /download-file/zip` with `responseType: 'blob'`. **The server returns a ready-made ZIP**; pass the result straight to `saveBlob`. There is no client-side zipping anywhere in the app — `jszip` was removed from dependencies. If you ever need to bundle files the server didn't zip, add `jszip` back and a helper, but check whether the server endpoint can do it first.

## Admin page shell

Every admin page renders inside `<AdminLayout>`, which provides the left-hand sidebar (`리포트 검토 / 대피소 편집 / 컨텐츠 관리` + logout). The sidebar `MENU` constant in `AdminLayout.tsx` is the source of truth — add new admin routes there *and* in `main.tsx`. The sidebar's logout button just clears the admin password and navigates to `/admin/login`; pages still handle `UnauthorizedError` themselves.

## Modal conventions

All modals follow the same pattern — copy it when adding another:

- Backdrop `onClick={onClose}`; inner `onClick={e => e.stopPropagation()}`.
- `useEffect` to listen for `Escape` and to set `document.body.style.overflow = 'hidden'`; cleanup both on unmount.
- Props shape is `{ ...inputs, onClose, onSaved | onSubmitted | onActionDone, onUnauthorized? }` — parents handle navigation; modals do not call `useNavigate`.
- On `UnauthorizedError` inside an admin modal, call `onUnauthorized()` rather than navigating yourself.

`ShelterReportModal` has two modes keyed by whether `reportId` is passed. In edit mode it requires a user password (bound to `X-User-Password`) and disables submit while any image is still uploading (tracked in a `PendingImage` local state with `uploading | done | failed`, with retry).

`AdminContentEditModal` uses the same `uploading | done | failed` image state but tracks only a single image (with `existing` vs `new` discriminator so the previous image URL stays visible until upload completes). Submit is blocked while uploading or failed.

## Page conventions

- Each page owns its loading / error / page / data state with `useState`; no shared store.
- Error handling: `try/catch` around the API call, set an `error` string, render inline. In admin pages, first check `if (e instanceof UnauthorizedError)` → `clearAdminPassword()` → `navigate('/admin/login')`.
- Admin pages also guard mount with `if (!getAdminPassword()) navigate('/admin/login', { replace: true })`.
- `ShelterListPage` debounces the search input by 300ms before calling `fetchShelters`.
- Flash messages are local `useState` with a `setTimeout` (2500ms) clear — no toast library.
- Pagination is block-based (10 per block), implemented inline in `ShelterListPage` and `AdminReportsPage`. There is no shared `<Pagination>` component yet — if a third page needs it, extract then.

## Styling

Plain CSS, one file per component, co-located (`AdminContentEditModal.tsx` + `AdminContentEditModal.css`). Global reset/typography in `src/index.css`. Do not introduce Tailwind or CSS-in-JS without discussing — the current convention is intentional.

## Gotchas

- `base: '/research/'` in `vite.config.ts` must match the `basename` in `main.tsx` and the backend's serving path. Changing one without the others breaks routing.
- The Vite proxy only runs in `npm run dev`. `npm run preview` serves the built bundle but does **not** proxy `/api` — you need the backend reachable at the same origin (or a reverse proxy).
- `verbatimModuleSyntax` is on: `import { Shelter } from '@/types/shelter'` fails if `Shelter` is a type-only export. Use `import type`.
- `sessionStorage` (not `localStorage`) is intentional — closing the tab logs the admin out.
- `contentApi.updateContent` is a full PUT — anything you omit becomes `null` on the server. The modal solves this by passing `content?.additionalInfo ?? null` even though that field isn't editable in the UI.
