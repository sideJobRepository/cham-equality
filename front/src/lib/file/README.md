# `src/lib/file` — 파일 업로드/다운로드 유틸

프론트에서 S3로 **Presigned URL 직접 업로드**하는 공용 모듈, 그리고 서버에서 받은 파일/Blob을 브라우저에 저장하는 얇은 다운로드 유틸을 담고 있습니다.

API 호출(`http.post('/presigned-url', ...)` 같은 부분)은 **여기 두지 않습니다.** 이 폴더는 "업로드/다운로드 절차" 그 자체만 제공하고, 실제 API 호출은 `src/api/*.ts`의 각 도메인 API 파일에서 어댑터로 주입합니다. 그래서 이 폴더 안에는 `axios.post('/...')` 같은 하드코딩된 엔드포인트가 하나도 없습니다.

```
src/lib/file/
├─ index.ts                       # presignedUpload/download 재내보내기
├─ presignedUpload/
│  ├─ index.ts                    # createPresignedUploader + 타입 재내보내기
│  ├─ types.ts                    # 어댑터 계약, 업로더 인터페이스
│  └─ createUploader.ts           # 팩토리 구현 (단일 파일 3단계 오케스트레이션)
└─ download/
   └─ index.ts                    # saveBlob, triggerDownload
```

`import { createPresignedUploader, saveBlob, triggerDownload } from '../../lib/file'` 식으로 한 군데에서 가져다 씁니다 (경로 별칭 미설정).

---

## Presigned URL 업로드란? (3단계 흐름)

브라우저에서 파일을 S3에 올리되, **AWS 크리덴셜을 브라우저로 넘기지 않고**, 서버가 발급해 준 일회용 서명 URL에 직접 `PUT`을 날리는 방식입니다. 파일 1개를 올릴 때 다음 3단계가 순차적으로 실행됩니다.

```
[1] 프론트 → 서버  POST /presigned-url
    "이 파일 올릴 건데 서명 URL 좀 줘"
    요청 body: { fileType, files: [{ fileName, fileSize, contentType }] }
    응답:      [{ url, objectKey, fileName, bucket, contentType }]

[2] 프론트 → S3   PUT <presigned url>
    파일 바이트를 서명 URL로 직접 올림. 서버 경유 X.

[3] 프론트 → 서버  POST /upload-file
    "올리기 끝났으니 DB에 기록하고 fileId 줘"
    요청 body: { fileType, files: [{ fileName, objectKey, contentType, bucketName, fileSize }] }
    응답:      [{ fileId, ... }]   (앞으로 이 fileId로 참조)
```

현재 모듈은 **파일 1개 단위**로만 처리합니다. 여러 장을 올려야 할 때는 호출부에서 각 파일마다 `upload(file)`를 호출하세요(필요하면 `Promise.all`로 감싸기). 배치 presign이 필요해질 때 이 모듈을 확장하는 것이 좋습니다.

`createPresignedUploader`는 이 3단계를 책임지고 순서대로 실행합니다. [1]과 [3]의 **엔드포인트·페이로드 모양은 도메인마다 다를 수 있으므로** 어댑터(Adapter)로 외부에서 주입받고, [2]의 PUT은 `axios.put`으로 내장돼 있습니다.

---

## 공개 API

`src/lib/file/presignedUpload/types.ts`

```ts
// 서버에 presign 요청할 때 넘기는 파일 메타
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
// Presign    = [1]단계 응답 타입 (PresignedUrlInfo 확장 가능)
// Registered = [3]단계 응답 타입 (도메인이 원하는 대로 정의)
export type UploaderAdapter<Presign extends PresignedUrlInfo, Registered> = {
  requestPresignedUrls: (files: PresignRequestFile[]) => Promise<Presign[]>
  registerUploadedFiles: (
    uploaded: { presign: Presign; file: File }[],
  ) => Promise<Registered[]>
}

// 팩토리가 돌려주는 업로더 인터페이스
export type PresignedUploader<Registered> = {
  upload: (file: File) => Promise<Registered>
}
```

`src/lib/file/presignedUpload/createUploader.ts`

```ts
export function createPresignedUploader<
  Presign extends PresignedUrlInfo,
  Registered,
>(adapter: UploaderAdapter<Presign, Registered>): PresignedUploader<Registered>
```

어댑터의 두 함수가 **배열 계약**(`files: […]` / `uploaded: […]`)으로 되어 있는 이유는 백엔드 엔드포인트가 이미 배열을 주고받기 때문입니다. 지금은 배열 길이 1만 쓰지만 백엔드와의 스펙 일치는 그대로 두어, 추후 배치 업로드로 확장할 때 이 레이어만 고치면 되도록 했습니다.

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

### 업로더가 안쪽에서 실제로 하는 일

```ts
// createUploader.ts (요약)
const [presign] = await adapter.requestPresignedUrls([
  { fileName: file.name, fileSize: file.size, contentType: file.type },
])
if (!presign) throw new Error('presigned URL 응답이 비어 있습니다')

await axios.put(presign.url, file, {
  headers: { 'Content-Type': file.type || 'application/octet-stream' },
  transformRequest: [(d) => d],   // axios가 File을 JSON화하지 못하게 막음 — 꼭 필요
})

const [registered] = await adapter.registerUploadedFiles([{ presign, file }])
return registered
```

알아둘 점:

- **`transformRequest: [(d) => d]` 는 지우지 마세요.** 지우면 axios가 `File` 객체를 `{}`로 직렬화해서 S3에 0바이트가 올라갑니다. (실수로 한 번 밟고 오랫동안 디버깅할 수 있음.)
- PUT이 성공하고 `registerUploadedFiles`가 실패하면 S3에는 이미 파일이 올라간 상태입니다. 서버 측에 `TEMPORARY` 상태 + 일일 정리 배치(`CommonFileSchedule`, 01:00)가 있어서 `/upload-file` 호출이 오지 않은 파일은 다음 날 자동 삭제됩니다.
- presign 응답의 `url`에는 유효시간이 있습니다. 파일 선택 시점에 곧바로 업로드를 시작하세요(`ShelterReportModal`의 현재 동작). 선택만 해 두고 한참 뒤 submit하는 플로우를 만들면 403이 납니다.

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

## 에러 처리

팩토리 자체는 아무것도 catch하지 않고 그대로 throw합니다. 호출부(모달 등)에서 `try/catch`로 잡고 UI를 갱신하세요.

| 실패 지점 | 원인 | 기본 동작 | 복구 |
|---|---|---|---|
| `requestPresignedUrls` | 4xx/5xx, 네트워크 | axios 에러 throw | 사용자에게 에러 표시, 재시도 |
| presign 응답 비어 있음 | 서버 버그 | `'presigned URL 응답이 비어 있습니다'` throw | 서버 수정 |
| `PUT` | 만료된 URL, 네트워크, CORS | axios 에러 throw | 재시도 |
| `registerUploadedFiles` | 4xx/5xx | axios 에러 throw. S3에는 이미 올라간 상태 | 서버의 일일 `TEMPORARY` 정리 배치가 수거. 필요하면 사용자에게 재시도 버튼 |

`ShelterReportModal`은 이미지 단위로 `uploading | done | failed` 상태를 로컬에 들고 있고, `failed`일 때 해당 이미지만 다시 `uploadShelterImage`를 호출하는 재시도 버튼을 노출합니다. 새 화면을 만들 때 같은 UX를 참고하세요.

---

## `download/` 개요

브라우저에 파일을 저장하는 두 개짜리 얇은 유틸입니다.

```ts
saveBlob(blob, fileName)
  // 이미 손에 Blob이 있을 때. <a download> 트릭으로 즉시 저장.
  // 서버 ZIP 응답(adminApi.downloadFilesAsZip)을 받아 저장하는 용도.

triggerDownload(url, fileName)
  // URL을 <a download>로 네비게이션. fetch 안 함, CORS 불필요.
  // 서버가 Content-Disposition: attachment를 붙여주는 URL 전용.
```

### 단일 파일 다운로드 — 왜 `triggerDownload` 한 가지만 있는가

백엔드(`S3FileService.fileDownload`)가 presign할 때 이미 `responseContentDisposition("attachment; filename=...")`을 서명에 박아 넣습니다. 그래서 해당 URL은 브라우저가 어떻게 GET하든 S3 응답에 `Content-Disposition: attachment`가 붙어서 내려오고 — `<a download>` 네비게이션만으로 새 탭 없이 다운로드가 끝납니다. CORS 설정이나 fetch 왕복이 필요 없습니다. 이전에 있던 `downloadFile`(fetch → Blob → saveBlob) 변형은 이 구조에서 쓸모가 없어 삭제했습니다.

만약 나중에 서버가 `Content-Disposition`을 안 붙이거나 프론트가 파일명을 강제 변경해야 하는 상황이 생기면, `fetch → Blob → saveBlob` 3줄짜리 헬퍼를 그때 추가하세요(S3 버킷 CORS에 `GET` 허용 필수).

### 서버 ZIP 다운로드

`adminApi.downloadFilesAsZip(ids, name)`은 **서버가 미리 묶어서** `responseType: 'blob'`로 ZIP 바이너리를 돌려줍니다. 받은 Blob을 `saveBlob(blob, name)`으로 저장하면 끝입니다. `AdminReportDetailModal`의 "전체 다운로드" 버튼이 이 경로를 씁니다. 클라이언트에서 jszip으로 압축하는 변형은 사용처가 없어서 제거했고, 관련 `jszip` 의존성도 `package.json`에서 뺐습니다.

---

## 자주 하는 실수

- **페이지/모달 컴포넌트에서 `/presigned-url`, `/upload-file`을 직접 부르기.** → 기존 업로더를 재사용하거나 새 업로더를 `src/api/*.ts`에 추가하세요. 컴포넌트에는 `http`가 import되면 안 됩니다.
- **PUT 요청에 `Content-Type: application/json`이 달려 있음.** → `createUploader.ts`의 `transformRequest`를 지우거나 axios 전역 인터셉터가 건드리면 이렇게 됩니다. PUT은 반드시 파일의 MIME을 그대로 달아야 S3 서명이 맞습니다.
- **업로드 도중 모달을 닫을 수 있게 둠.** → 모달이 unmount돼도 업로드는 계속 진행되지만, 결과를 받을 상태가 사라져서 fileId가 유실됩니다. 업로드 중일 때는 닫기/submit을 disable하세요 (`ShelterReportModal`의 `pending` 체크 참고).
- **여러 파일을 한 번에 presign하려고 `upload`를 고치려 함.** → 현재는 단일 파일만 지원합니다. 배치가 필요해지면 이 모듈에 `uploadMany`를 다시 붙이는 게 맞고, 그때 백엔드가 이미 배열 계약을 유지하고 있어 프론트만 고치면 됩니다.

---

## 요약 체크리스트 — 새 업로드 종류 추가할 때

1. 서버에 `fileType` enum 값 추가 요청
2. `src/api/<domain>Api.ts`에 `Presign` / `Registered` 응답 타입 2개 선언
3. 같은 파일에 `createPresignedUploader<Presign, Registered>({ requestPresignedUrls, registerUploadedFiles })` 로 인스턴스 생성 (모듈 최상위)
4. `uploadXxx(file)` 래퍼 함수 export
5. 컴포넌트에서는 래퍼만 호출
6. UI는 `uploading | done | failed` 상태 관리 + 실패 시 재시도
7. 업로드 완료 후 돌려받은 `fileId`를 본문 API(create/update)에 실어 보냄
