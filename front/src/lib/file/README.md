# `src/lib/file` — 파일 업로드/다운로드 유틸

프론트에서 S3로 **Presigned URL 직접 업로드**하는 공용 모듈, 그리고 서버에서 받은 파일/URL을 브라우저에 저장하거나 ZIP으로 묶는 다운로드 유틸을 담고 있습니다.

API 호출(`http.post('/presigned-url', ...)` 같은 부분)은 **여기 두지 않습니다.** 이 폴더는 "업로드/다운로드 절차" 그 자체만 제공하고, 실제 API 호출은 `src/api/*.ts`의 각 도메인 API 파일에서 어댑터로 주입합니다. 그래서 이 폴더 안에는 `axios.post('/...')` 같은 하드코딩된 엔드포인트가 하나도 없습니다.

```
src/lib/file/
├─ index.ts                       # presignedUpload/download 재내보내기
├─ presignedUpload/
│  ├─ index.ts                    # createPresignedUploader + 타입 재내보내기
│  ├─ types.ts                    # 어댑터 계약, 업로더 인터페이스
│  └─ createUploader.ts           # 팩토리 구현 (3단계 오케스트레이션)
└─ download/
   └─ index.ts                    # saveBlob, triggerDownload, downloadFile, downloadAsZip, zipBlobs
```

`import { createPresignedUploader, saveBlob } from '@/lib/file'` 식으로 한 군데에서 가져다 쓰면 됩니다 (현재 프로젝트는 경로 별칭 미설정이라 상대경로 `../../lib/file`).

---

## Presigned URL 업로드란? (3단계 흐름)

브라우저에서 파일을 S3에 올리되, **AWS 크리덴셜을 브라우저로 넘기지 않고**, 서버가 발급해 준 일회용 서명 URL에 직접 `PUT`을 날리는 방식입니다. 전체 흐름은 고정된 3단계입니다.

```
[1] 프론트 → 서버  POST /presigned-url
    "이 파일 N개 올릴 건데 서명 URL 좀 줘"
    요청 body: { fileType, files: [{ fileName, fileSize, contentType }, ...] }
    응답:     [{ url, objectKey, fileName, bucket, contentType }, ...]   (요청과 같은 순서)

[2] 프론트 → S3   PUT <presigned url>
    파일 바이트를 서명 URL로 직접 올림. 서버 경유 X.
    각 파일마다 한 번씩, 병렬로 실행됨.

[3] 프론트 → 서버  POST /upload-file
    "올리기 끝났으니 DB에 기록하고 fileId 줘"
    요청 body: { fileType, files: [{ fileName, objectKey, contentType, bucketName, fileSize }, ...] }
    응답:     [{
     
     fileId, ... }, ...]   (앞으로 이 fileId로 참조)
```

`createPresignedUploader`는 이 3단계를 책임지고 순서대로 실행합니다. [1]과 [3]의 **엔드포인트·페이로드 모양은 도메인마다 다를 수 있으므로** 어댑터(Adapter)로 외부에서 주입받고, [2]의 PUT만 기본 구현이 내장돼 있습니다.

---

## 공개 API

`src/lib/file/presignedUpload/types.ts`

```ts
// 서버에 presign 요청할 때 넘기는 파일 메타 (파일당 하나)
export type PresignRequestFile = {
  fileName: string
  fileSize: number
  contentType: string
}

// 서버가 돌려주는 presign 응답의 "공통 최소 스펙".
// 각 도메인 응답 타입은 이걸 extends 해서 필드를 더 붙여도 됨.
export type PresignedUrlInfo = {
  url: string           // PUT 대상 서명 URL (유효시간 있음)
  objectKey: string     // 버킷 내부 경로
  fileName: string      // 서버가 정한 파일명 (원본과 다를 수 있음)
  bucket: string
  contentType: string
}

// 각 도메인에서 구현해야 하는 계약.
// Presign   = [1]단계 응답 타입 (PresignedUrlInfo 확장 가능)
// Registered = [3]단계 응답 타입 (도메인이 원하는 대로 정의)
export type UploaderAdapter<Presign extends PresignedUrlInfo, Registered> = {
  requestPresignedUrls: (files: PresignRequestFile[]) => Promise<Presign[]>
  registerUploadedFiles: (
    uploaded: { presign: Presign; file: File }[],
  ) => Promise<Registered[]>
  putToRemote?: (url: string, file: File) => Promise<void>   // 선택. 없으면 기본 PUT 사용
}

// 팩토리가 돌려주는 업로더 인터페이스
export type PresignedUploader<Registered> = {
  upload: (file: File) => Promise<Registered>
  uploadMany: (files: File[]) => Promise<Registered[]>
}
```

`src/lib/file/presignedUpload/createUploader.ts`

```ts
export function createPresignedUploader<
  Presign extends PresignedUrlInfo,
  Registered,
>(adapter: UploaderAdapter<Presign, Registered>): PresignedUploader<Registered>
```

---

## 기존 업로더 쓰기 — 대피소 이미지 업로드

`src/api/shelterApi.ts`에 이미 등록된 `shelterImageUploader`가 `uploadShelterImage(file)` 한 줄로 노출돼 있습니다. 컴포넌트에서는 이것만 호출하면 되고, 3단계는 신경 쓰지 않습니다.

```tsx
import { uploadShelterImage } from '../api/shelterApi'

async function onFilePicked(file: File) {
  const registered = await uploadShelterImage(file)
  // registered.fileId 를 report body.images[].fileId 로 넘겨서 createShelterReport 호출
}
```

여러 장 한 번에 올리고 싶다면 업로더 인스턴스를 직접 꺼내거나 `uploadMany`를 노출하는 얇은 래퍼를 하나 더 만들면 됩니다. 현재는 단일 업로드만 `export`돼 있습니다.

### 업로더가 안쪽에서 실제로 하는 일

```ts
// createUploader.ts (요약)
const presigns = await adapter.requestPresignedUrls(
  files.map((f) => ({ fileName: f.name, fileSize: f.size, contentType: f.type })),
)
if (presigns.length !== files.length) {
  throw new Error('presigned URL 응답 개수가 요청과 일치하지 않습니다')
}
await Promise.all(presigns.map((p, i) => put(p.url, files[i])))
return adapter.registerUploadedFiles(
  presigns.map((presign, i) => ({ presign, file: files[i] })),
)
```

알아둘 점:

- **요청과 응답은 인덱스로 짝지워집니다.** 서버는 요청한 파일 순서대로 presign을 돌려줘야 하고, 길이가 다르면 에러가 납니다. 서버를 고칠 때 이 계약을 바꾸지 마세요.
- PUT은 `Promise.all`로 **병렬**입니다. N개 중 하나라도 실패하면 전체가 reject되고, 이미 성공한 PUT은 되돌아가지 않습니다 (S3에 orphan object가 남음). 서버 측에 `TEMPORARY` 상태 + 일일 정리 배치(`CommonFileSchedule`, 01:00)가 있어서 `/upload-file` 호출이 오지 않은 파일은 다음 날 자동 삭제됩니다.
- `registerUploadedFiles`가 실패해도 S3에는 이미 파일이 올라간 상태입니다. 같은 메커니즘으로 서버가 정리합니다.
- presign 응답에 `url`의 유효시간이 있으므로, 사용자가 파일 선택만 하고 한참 대기한 뒤 submit하는 플로우는 피하세요. 파일 선택 시점에 곧바로 업로드를 시작하는 것이 `ShelterReportModal`의 현재 동작입니다.

---

## 새 업로드 종류 추가하는 법

새 도메인(예: 공지사항 첨부파일 `NOTICE_ATTACHMENT`)의 업로더를 만들 때의 레시피입니다. `shelterApi.ts`의 `shelterImageUploader`가 그대로 교본입니다.

### 1) 응답 타입 2개 정의

```ts
// src/api/noticeApi.ts
import type { PresignedUrlInfo } from '../lib/file'

// [1]단계 응답. PresignedUrlInfo 최소 스펙을 만족시키면 필드 추가 자유.
export type NoticePresignedUrlResponse = PresignedUrlInfo

// [3]단계 응답. 서버가 DB에 기록하고 돌려주는 파일 식별자 등.
export type NoticeFileUploadResponse = {
  fileId: number
  fileName: string
  fileSize: number
  contentType: string
  objectKey: string
  bucketName: string
}
```

`Presign` 제네릭은 `extends PresignedUrlInfo` 제약이 걸려 있어서 `url/objectKey/fileName/bucket/contentType` 5개는 반드시 있어야 합니다. 그게 충족되면 `expiresAt`, `policy` 같은 필드를 도메인별로 더 붙여도 됩니다.

### 2) 어댑터로 팩토리 호출

```ts
// src/api/noticeApi.ts (이어서)
import { createPresignedUploader } from '../lib/file'
import { http } from './http'
import type { ApiResponse } from '../types/shelter'   // 공용 envelope

const noticeAttachmentUploader = createPresignedUploader<
  NoticePresignedUrlResponse,
  NoticeFileUploadResponse
>({
  async requestPresignedUrls(files) {
    const { data } = await http.post<NoticePresignedUrlResponse[]>('/presigned-url', {
      fileType: 'NOTICE_ATTACHMENT',
      files,
    })
    return data
  },
  async registerUploadedFiles(uploaded) {
    const { data } = await http.post<ApiResponse<NoticeFileUploadResponse[]>>('/upload-file', {
      fileType: 'NOTICE_ATTACHMENT',
      files: uploaded.map(({ presign, file }) => ({
        fileName: presign.fileName,
        objectKey: presign.objectKey,
        contentType: presign.contentType,
        bucketName: presign.bucket,
        fileSize: file.size,
      })),
    })
    return data.data
  },
})

export async function uploadNoticeAttachment(file: File): Promise<NoticeFileUploadResponse> {
  return noticeAttachmentUploader.upload(file)
}
```

### 3) 주의할 포인트

- 두 API 응답의 **envelope 유무가 다른 점**을 현재 코드가 그대로 반영하고 있습니다. `/presigned-url`은 배열을 바로 돌려주고, `/upload-file`은 `ApiResponse<T>`로 감싸 `data.data`에 배열이 있습니다. 이 부분은 어댑터 안에서 벗겨내야 합니다 (`shelterImageUploader`가 그렇게 하고 있음). 백엔드 합의 없이 envelope을 바꾸면 어댑터도 같이 고쳐야 합니다.
- `fileType`은 서버가 화이트리스트로 받고, 업로드 카테고리별 버킷/키 규칙에 사용됩니다. **아무 값이나 써도 안 되고**, 서버 enum에 추가부터 해야 합니다.
- `/presigned-url`, `/upload-file`은 경로가 도메인별로 갈라지지 않고 `fileType`으로 분기됩니다. 이 디자인을 유지해 주세요 (엔드포인트를 도메인마다 새로 파지 마세요).
- 팩토리는 **모듈 최상위에서 한 번만** 호출해 `const`에 담아두면 충분합니다. `upload()` 부를 때마다 만들면 불필요한 할당이 생깁니다.

---

## `putToRemote` 커스터마이징

기본 구현은 이렇습니다 (`createUploader.ts`).

```ts
async function defaultPutToRemote(url: string, file: File): Promise<void> {
  await axios.put(url, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    transformRequest: [(d) => d],     // axios가 File을 JSON화하지 못하게 막음 — 꼭 필요
  })
}
```

다음 경우에 어댑터에서 `putToRemote`를 직접 넘기세요.

- **진행률**: `axios.put(url, file, { onUploadProgress: e => setPct(e.loaded / e.total) })` 형태로 갈아끼움.
- **취소**: `AbortController` 시그널을 axios 설정에 넣거나, 함수 내부에서 fetch + signal 조합으로 바꿈.
- **대용량(멀티파트)**: S3 멀티파트 업로드를 쓰려면 여기서 일반 PUT 대신 멀티파트 흐름을 수행. 다만 그러면 `requestPresignedUrls`/`registerUploadedFiles` 쪽도 파트 단위 시그니처로 바꿔야 하므로, 이 업로더 대신 별도 유틸로 분리하는 게 낫습니다.
- **Content-Type 다른 계산 규칙**: 확장자로부터 강제 보정 등이 필요할 때.

`transformRequest: [(d) => d]` 는 지우지 마세요. 지우면 axios가 File 객체를 `{}`로 직렬화해서 S3에 0바이트가 올라갑니다. (실수로 한 번 밟고 오랫동안 디버깅할 수 있음.)

---

## 에러 처리

팩토리 자체는 아무것도 catch하지 않고 그대로 throw합니다. 호출부(모달 등)에서 `try/catch`로 잡고 UI를 갱신하세요.

| 실패 지점 | 원인 | 기본 동작 | 복구 |
|---|---|---|---|
| `requestPresignedUrls` | 4xx/5xx, 네트워크 | axios 에러 throw | 사용자에게 에러 표시, 재시도 |
| 응답 개수 불일치 | 서버 버그 | `'presigned URL 응답 개수가 요청과 일치하지 않습니다'` throw | 서버 수정 (프론트에서 workaround 금지) |
| `put`의 일부/전체 | 만료된 URL, 네트워크, CORS | axios 에러 throw. 성공한 PUT은 S3에 남음 | 서버의 일일 `TEMPORARY` 정리 배치가 수거 |
| `registerUploadedFiles` | 4xx/5xx | axios 에러 throw. S3에는 이미 올라간 상태 | 동일하게 배치가 수거. 필요하면 사용자에게 재시도 버튼 |

`ShelterReportModal`은 이미지 단위로 `uploading | done | failed` 상태를 로컬에 들고 있고, `failed`일 때 해당 이미지만 다시 `uploadShelterImage`를 호출하는 재시도 버튼을 노출합니다. 새 화면을 만들 때 같은 UX를 참고하세요.

---

## `download/` 개요

업로드와는 분리된 유틸입니다. 파일 바이트를 받아 브라우저에 저장만 합니다.

```ts
saveBlob(blob, fileName)
  // 이미 손에 Blob이 있을 때. <a download> 트릭으로 즉시 다운로드.
  // 다른 함수들도 내부에서 이걸 씁니다.

triggerDownload(url, fileName)
  // URL을 <a download>로 네비게이션. fetch 안 함, CORS 불필요.
  // 서버가 Content-Disposition: attachment를 붙여주는 URL 전용.

downloadFile(url, fileName)                       // URL → fetch → saveBlob  (CORS 필요)
downloadAsZip(items: {url,fileName}[], zipName)   // 여러 URL을 병렬 fetch 후 jszip으로 묶음
zipBlobs(items: {blob,fileName}[], zipName)       // 이미 가지고 있는 Blob들을 묶음
```

중복 파일명은 `disambiguate()`가 `사진.jpg, 사진-2.jpg, 사진-3.jpg` 식으로 자동 처리합니다 (`downloadAsZip` / `zipBlobs`).

### 단일 파일 다운로드: `triggerDownload` vs `downloadFile`

현재 프로젝트 기본값은 **`triggerDownload`** 입니다. 이유는 백엔드(`S3FileService.fileDownload`)가 presign할 때 이미 `responseContentDisposition("attachment; filename=...")`을 서명에 박아 넣기 때문입니다. 이 URL은 브라우저가 어떻게 GET하든 S3 응답에 `Content-Disposition: attachment`가 붙어서 내려오므로 — `<a download>` 네비게이션만으로 새 탭 없이 다운로드가 끝납니다. CORS 설정도 필요 없습니다.

`downloadFile`(fetch → Blob → saveBlob)은 다음 **두 경우에만** 쓰세요:

1. 서버가 `Content-Disposition`을 안 붙이고 파일명을 프론트가 강제로 덮어써야 할 때.
2. 다운로드 전에 Blob에 클라이언트에서 뭔가 해야 할 때 (미리보기, 서명 검증 등). 단 S3 버킷 CORS에 `GET` 허용이 걸려 있어야 합니다.

`AdminReportDetailModal`의 단일 이미지 다운로드가 전자 경로에 해당합니다.

### 서버 ZIP vs 클라이언트 ZIP

- `adminApi.downloadFilesAsZip(ids, name)`은 **서버가 미리 묶어서** `responseType: 'blob'`로 ZIP 바이너리를 돌려줍니다. 이 Blob을 다시 jszip에 넣지 마세요. 그냥 `saveBlob(blob, name)`로 저장합니다.
- `downloadAsZip()` (여기 유틸)은 **URL 목록을 받아 클라이언트에서** 모아 압축합니다. 파일 수가 적고 URL 직접 접근이 가능한 경우에만 쓰세요. 관리자 다운로드는 서버 ZIP 경로가 정석입니다.

### 바이트를 두 번 받지 않기

`downloadFile`과 `downloadAsZip`은 `fetch`로 바이트를 다시 받습니다. presigned GET URL에 유효시간이 있는 경우, 취득 직후에 호출하세요. 유효시간이 지난 뒤에 호출하면 403이 납니다. `triggerDownload`는 네비게이션이라 동일한 유효시간을 따르지만 프론트 메모리에 바이트를 올리지 않습니다.

---

## 자주 하는 실수

- **페이지/모달 컴포넌트에서 `/presigned-url`, `/upload-file`을 직접 부르기.** → 기존 업로더를 재사용하거나 새 업로더를 `src/api/*.ts`에 추가하세요. 컴포넌트에는 `http`가 import되면 안 됩니다.
- **PUT 요청에 `Content-Type: application/json`이 달려 있음.** → `defaultPutToRemote`의 `transformRequest`를 지우거나 axios 전역 인터셉터가 건드리면 이렇게 됩니다. PUT은 반드시 파일의 MIME을 그대로 달아야 S3 서명이 맞습니다.
- **presign 응답 순서에 의존하지 않도록 `objectKey`로 zip하려 함.** → 현재 구현은 **인덱스 기반**이고, 순서가 깨지면 아예 에러를 던지도록 짜여 있습니다. 서버 구현을 바꿔서 순서가 섞이면 여기도 같이 바꿔야 합니다.
- **업로드 도중 모달을 닫을 수 있게 둠.** → 모달이 unmount돼도 업로드는 계속 진행되지만, 결과를 받을 상태가 사라져서 fileId가 유실됩니다. 업로드 중일 때는 닫기/submit을 disable하세요 (`ShelterReportModal`의 `pending` 체크 참고).
- **단일 파일 `upload(file)`와 `uploadMany([file])`를 섞어 씀.** → 기능은 같지만 타입 경로가 다릅니다. 여러 개 올릴 땐 `uploadMany`, 하나면 `upload`를 쓰세요 (`upload`는 내부에서 `uploadMany`를 호출합니다).

---

## 요약 체크리스트 — 새 업로드 종류 추가할 때

1. 서버에 `fileType` enum 값 추가 요청
2. `src/api/<domain>Api.ts`에 `Presign` / `Registered` 응답 타입 2개 선언
3. 같은 파일에 `createPresignedUploader<Presign, Registered>({ requestPresignedUrls, registerUploadedFiles })` 로 인스턴스 생성 (모듈 최상위)
4. `uploadXxx(file)` 래퍼 함수 export
5. 컴포넌트에서는 래퍼만 호출. `upload` / `uploadMany` 중 선택
6. UI는 `uploading | done | failed` 상태 관리 + 실패 시 재시도
7. 업로드 완료 후 돌려받은 `fileId`를 본문 API(create/update)에 실어 보냄
