# CLAUDE.md

Front-end module. See the repo-root `CLAUDE.md` for how this module fits into the monorepo, ports, and the Vite proxy.

## Stack

React 19 + TypeScript 6.0 + Vite 8 + react-router-dom 7 + axios. No Tailwind, no CSS Modules — plain `.css` files imported per component. No state library, no React Query — pages load data through the small hooks in `src/hooks/` (`usePagedList`, `useListQuery`, …) and keep the rest in local `useState`. No i18n on the web; only `chamApp/` has multi-language.

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
├─ main.tsx                         # Root + BrowserRouter(basename="/research"), routes
├─ index.css                        # Global styles
├─ api/
│  ├─ http.ts                       # axios instance, admin-password injection, UnauthorizedError, errorMessage
│  ├─ adminApi.ts                   # login + /api/admin/* (reports, app-reports, feedbacks, members, shelters,
│  │                                #   app-bundles, places/boundaries, push/test), /download-file;
│  │                                #   re-exports the password helpers / errorMessage / UnauthorizedError from http.ts
│  ├─ contentApi.ts                 # /api/admin/contents/*, uploadContentImage (CONTENT_IMAGE presign)
│  ├─ manualApi.ts                  # /api/admin/manuals/* (detail reads the public /api/manuals/{id})
│  └─ regionApi.ts                  # fetchRegions (/api/regions) for the shelter create modal
├─ types/                           # shelter.ts (PageResponse, ApiResponse), content.ts, manual.ts, file.ts
├─ lib/
│  ├─ adminRedirect.ts              # ADMIN_HOME_PATH, buildLoginPath / safeAdminNext (login ?next=)
│  ├─ pendingCounts.ts              # pending-count sources shared by dashboard cards and sidebar badges
│  └─ file/                         # presignedUpload (uploader factory), download (saveBlob, triggerDownload); see its README.md
├─ hooks/
│  ├─ useAdminRequest.ts            # run(promise) -> {ok,data} | {ok:false,message}; 401 -> login with next
│  ├─ usePagedList.ts               # list/detail loading with request sequencing (late responses dropped)
│  ├─ useListQuery.ts               # filter/page/q kept in the URL query
│  ├─ useReviewNavigation.ts        # prev/next + "open next pending" in report detail modals
│  ├─ useFeedback.ts                # toast / confirm
│  └─ usePendingCounts.ts           # sidebar badge counts + refreshCounts()
├─ pages/                           # Admin*Page.tsx (+ .css), one per route below
└─ components/
   ├─ RequireAdmin.tsx              # /admin/* guard: providers + AdminLayout + <Outlet/>
   ├─ AdminLayout.tsx               # Sidebar shell (MENU)
   ├─ AdminMaintenanceSection.tsx   # Dashboard maintenance: place-boundary fill loop, push test send
   ├─ Admin*Modal.tsx               # Detail / edit modals
   ├─ RichTextEditor.tsx            # Manual body editor (used by AdminManualEditModal)
   ├─ ManualMobilePreview.tsx       # Phone-frame preview of a manual body
   └─ common/                       # Pagination, Feedback (toast + confirm Provider), PendingCountsProvider
```

## Routing

`main.tsx` wraps everything in `<BrowserRouter basename="/research">`. All in-app paths should be written **without** the `/research` prefix — React Router adds it. So `navigate('/admin/login')`, not `navigate('/research/admin/login')`.

| Path (in-app)          | Element                |
|------------------------|------------------------|
| `/`                    | Navigate → `/admin`    |
| `/admin/login`         | `AdminLoginPage` (returns to `?next=` when it is an `/admin` path) |
| `/admin`               | `AdminDashboardPage` (pending cards + maintenance) |
| `/admin/reports`       | `AdminReportsPage` (웹 제보 검토) |
| `/admin/app-reports`   | `AdminAppReportsPage`  |
| `/admin/feedbacks`     | `AdminFeedbacksPage`   |
| `/admin/members`       | `AdminMembersPage`     |
| `/admin/shelters`      | `AdminSheltersPage`    |
| `/admin/contents`      | `AdminContentsPage`    |
| `/admin/manuals`       | `AdminManualsPage`     |
| `/admin/app-bundles`   | `AdminAppBundlesPage` (OTA bundles: promote, enable/disable) |
| `*`                    | Navigate → `/admin` (old links such as `/shelters`, typos) |

Every `/admin` route except login sits under `<Route element={<RequireAdmin/>}>`.

## API layer

`src/api/http.ts` is the single axios instance. `baseURL: '/api'`, so always call paths as `/admin/reports`, `/regions`, etc. — never hardcode the host.

### Admin password header

The backend has no session/JWT in the browser; admin calls are authenticated by `X-Admin-Password`:

- Stored in `sessionStorage['admin-password']` via `setAdminPassword(pw)` after `adminLogin(pw)` succeeds.
- The request interceptor attaches it to every request whose path starts with `/admin` or `/download-file`.
- On a `401` for those paths, the response interceptor throws `UnauthorizedError`. Pages and modals do not catch it themselves — they call APIs through `useAdminRequest().run(...)`, which clears the password and sends the user to `/admin/login?next=<current path>`.

### Endpoint wrappers

Keep all HTTP calls inside `src/api/*.ts`. Pages should not import `axios` or call `http` directly — they call the typed wrappers. Response types mirror the backend DTO records (read them in `chamApi` before adding a wrapper).

- `adminApi.ts`: `adminLogin`; web reports `fetchReports` / `fetchReportDetail` / `approveReport` / `rejectReport` / `requestReInvestigation`; app reports `fetchAppReports` / `fetchAppReportDetail` / `approveAppReport` / `rejectAppReport`; feedbacks `fetchFeedbacks` / `fetchFeedbackDetail` / `updateFeedback`; shelters `fetchAdminShelters` / `updateAdminShelter` / `createAdminShelter` / `bulkCreateAdminShelters`; members `fetchMembers` / `sendMemberPush`; OTA `fetchAppBundles` / `promoteAppBundles` / `setAppBundleEnabled`; maintenance `fillPlaceBoundaries` / `sendTestPush`; files `getDownloadUrl` / `downloadFilesAsZip`.
- `contentApi.ts`: `fetchContents` / `createContent` / `updateContent` / `deleteContent` / `uploadContentImage`. `updateContent` is **full replacement**, not PATCH — pass every field, including ones the caller doesn't edit (e.g. preserve `additionalInfo`), or they get nulled out. The wrapper maps server `contentType`/`displayStartDate/EndDate` (`LocalDateTime`) to `type` + `YYYY-MM-DD`.

- `manualApi.ts`: `fetchManuals` / `fetchManualDetail` / `createManual` / `updateManual` / `deleteManual`.
- `regionApi.ts`: `fetchRegions(depth, parentId?)`.

Response envelope from the API is `ApiResponse<T> = { code, success, message, data }`. Wrappers unwrap `.data.data` and return just `T`; pages should not see the envelope. Paged endpoints return `PageResponse<T>`.

## Presigned-URL upload

`src/lib/file/presignedUpload/createUploader.ts` exposes a generic `createPresignedUploader<Presign, Registered>(adapter)` factory. The adapter supplies two API calls (`requestPresignedUrls`, `registerUploadedFiles`) and optionally `putToRemote` (defaults to `axios.put`). The returned object has a single `upload(file)` (one file per call — callers loop or `Promise.all` for several) which runs:

1. POST `/presigned-url` for the file
2. PUT the file to its presigned URL
3. POST `/upload-file` to register (transitions the file row from `UPLOADING` → `COMPLETE` on the server), returning the backend file records

Current uploader: `contentImageUploader` — `fileType: 'CONTENT_IMAGE'`, exposed via `contentApi.uploadContentImage(file)`.

If you add another upload kind, build a new uploader with the same factory — don't duplicate the three-step sequence inline. The backend's `FileType` enum has to grow alongside.

## Download / ZIP

- `src/lib/file/download/index.ts` — generic helpers: `saveBlob(blob, name)`, `triggerDownload(url, name)`.
- `adminApi.ts#downloadFilesAsZip(ids, name)` — calls `POST /download-file/zip` with `responseType: 'blob'`. **The server returns a ready-made ZIP**; pass the result straight to `saveBlob`. There is no client-side zipping anywhere in the app — `jszip` was removed from dependencies. If you ever need to bundle files the server didn't zip, add `jszip` back and a helper, but check whether the server endpoint can do it first.

## Admin page shell

`RequireAdmin` renders `PendingCountsProvider` → `AdminLayout` (sidebar) → `FeedbackProvider` → `<Outlet/>`. Pages do not wrap themselves in `<AdminLayout>` and do not check the password on mount. The sidebar `MENU` constant in `AdminLayout.tsx` is the source of truth — add new admin routes there *and* in `main.tsx`.

## Modal conventions

All modals follow the same pattern — copy it when adding another:

- Backdrop `onClick={onClose}`; inner `onClick={clickEvent => clickEvent.stopPropagation()}`.
- `useEffect` to listen for `Escape` and to set `document.body.style.overflow = 'hidden'`; cleanup both on unmount.
- Props shape is `{ ...inputs, onClose, onSaved | onSent | onActionDone }` — parents handle list reloads. API calls go through `useAdminRequest().run`.

`AdminContentEditModal` tracks a single image with `uploading | done | failed` state (`existing` vs `new`, so the previous image URL stays visible until upload completes). Submit is blocked while uploading or failed.

## Page conventions

- List/detail loading uses `usePagedList(fetcher)` with a `useCallback` fetcher. It keeps the previous data while reloading (tables get `aria-busy` and dim); show "불러오는 중…" only when there is no data yet.
- Filter / page / search live in the URL via `useListQuery` (`filter`, `page` 1-based, `q`); defaults are omitted.
- Messages: `useFeedback().toast(message, tone)` (error toasts stay until closed) and `await confirm({ title, description, confirmLabel, destructive })` instead of browser `alert`/`confirm`. Destructive or wide-impact actions (reject, delete, push, OTA disable/promote) must confirm.
- Pagination: shared `components/common/Pagination`.
- After approve/reject/feedback save, call `refreshCounts()` so the sidebar badges update.
- Variable names: no single-letter names (`e`, `t`, `r` …) — use `changeEvent`, `clickEvent`, `requestError`, etc.

## Styling

Visual language, color tokens, typography, and component-level design rules live in `front/DESIGN.md`. Read that file before touching styles or building new UI — do not re-derive design decisions from existing CSS.

## Gotchas

- `base: '/research/'` in `vite.config.ts` must match the `basename` in `main.tsx` and the backend's serving path. Changing one without the others breaks routing.
- The Vite proxy only runs in `npm run dev`. `npm run preview` serves the built bundle but does **not** proxy `/api` — you need the backend reachable at the same origin (or a reverse proxy).
- `verbatimModuleSyntax` is on: `import { Shelter } from '@/types/shelter'` fails if `Shelter` is a type-only export. Use `import type`.
- `sessionStorage` (not `localStorage`) is intentional — closing the tab logs the admin out.
- `contentApi.updateContent` is a full PUT — anything you omit becomes `null` on the server. The modal solves this by passing `content?.additionalInfo ?? null` even though that field isn't editable in the UI.
