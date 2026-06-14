import type { ApiResponse, PageResponse } from '@/types/shelter'
import type { Content, ContentType, ContentUpsertRequest } from '@/types/content'
import { createPresignedUploader } from '@/lib/file'
import { http } from './http'
import type { FileUploadResponse, PresignedUrlResponse } from './shelterApi'

// TODO: 백엔드 API 미구현. 아래 mock(MOCK_CONTENTS / paginate / fetch* / create* / update* / delete*) 제거하고
// 주석 처리된 실제 http 호출로 교체할 것.

const MOCK_CONTENTS: Content[] = [
  {
    id: 1,
    name: '신규 대피소 등록 안내',
    imageFileId: null,
    imageUrl: 'https://placehold.co/400x300?text=Popup',
    type: 'IN_APP_POPUP',
    url: 'https://example.com/notice',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  },
  {
    id: 2,
    name: '참여연대 — 7월 정기 활동',
    imageFileId: null,
    imageUrl: 'https://placehold.co/400x300?text=Activity',
    type: 'ORGANIZATION_ACTIVITY',
    url: 'https://example.com/activity/7',
    startDate: null,
    endDate: null,
  },
  {
    id: 3,
    name: '대피소 정보 검증 캠페인',
    imageFileId: null,
    imageUrl: null,
    type: 'CITIZEN_PARTICIPATION',
    url: 'https://example.com/campaign',
    startDate: null,
    endDate: null,
  },
]

function paginate<T>(items: T[], page: number, size: number): PageResponse<T> {
  const start = page * size
  const content = items.slice(start, start + size)
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  return {
    content,
    page,
    size,
    totalElements: items.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
    empty: content.length === 0,
  }
}

function mockImageUrlForFileId(fileId: number | null): string | null {
  // mock 한정: 실제 백엔드 붙으면 서버가 fileId → URL 렌더링해서 내려주므로 이 함수는 사라짐
  if (fileId === null) return null
  return `https://placehold.co/400x300?text=Uploaded+%23${fileId}`
}

// TODO: GET /api/admin/contents?type=&page=&size=
export async function fetchContents(
  page: number,
  size: number,
  type?: ContentType,
): Promise<PageResponse<Content>> {
  // const params: Record<string, string | number> = { page, size }
  // if (type) params.type = type
  // const { data } = await http.get<ApiResponse<PageResponse<Content>>>('/admin/contents', { params })
  // return data.data
  const filtered = type ? MOCK_CONTENTS.filter((c) => c.type === type) : MOCK_CONTENTS
  return Promise.resolve(paginate(filtered, page, size))
}

// TODO: GET /api/admin/contents/{id}
export async function fetchContentDetail(id: number): Promise<Content> {
  // const { data } = await http.get<ApiResponse<Content>>(`/admin/contents/${id}`)
  // return data.data
  const found = MOCK_CONTENTS.find((c) => c.id === id)
  if (!found) throw new Error('Content not found')
  return Promise.resolve(found)
}

// TODO: POST /api/admin/contents
export async function createContent(body: ContentUpsertRequest): Promise<Content> {
  // const { data } = await http.post<ApiResponse<Content>>('/admin/contents', body)
  // return data.data
  const next: Content = {
    id: Math.max(0, ...MOCK_CONTENTS.map((c) => c.id)) + 1,
    name: body.name,
    type: body.type,
    url: body.url,
    startDate: body.startDate,
    endDate: body.endDate,
    imageFileId: body.imageFileId,
    imageUrl: mockImageUrlForFileId(body.imageFileId),
  }
  MOCK_CONTENTS.push(next)
  return Promise.resolve(next)
}

// TODO: PUT /api/admin/contents/{id}
export async function updateContent(id: number, body: ContentUpsertRequest): Promise<Content> {
  // const { data } = await http.put<ApiResponse<Content>>(`/admin/contents/${id}`, body)
  // return data.data
  const idx = MOCK_CONTENTS.findIndex((c) => c.id === id)
  if (idx < 0) throw new Error('Content not found')
  const prev = MOCK_CONTENTS[idx]
  const fileIdChanged = body.imageFileId !== prev.imageFileId
  MOCK_CONTENTS[idx] = {
    id,
    name: body.name,
    type: body.type,
    url: body.url,
    startDate: body.startDate,
    endDate: body.endDate,
    imageFileId: body.imageFileId,
    imageUrl: fileIdChanged ? mockImageUrlForFileId(body.imageFileId) : prev.imageUrl,
  }
  return Promise.resolve(MOCK_CONTENTS[idx])
}

// TODO: DELETE /api/admin/contents/{id}
export async function deleteContent(id: number): Promise<void> {
  // await http.delete(`/admin/contents/${id}`)
  const idx = MOCK_CONTENTS.findIndex((c) => c.id === id)
  if (idx >= 0) MOCK_CONTENTS.splice(idx, 1)
  return Promise.resolve()
}

const contentImageUploader = createPresignedUploader<PresignedUrlResponse, FileUploadResponse>({
  async requestPresignedUrls(files) {
    const { data } = await http.post<PresignedUrlResponse[]>('/presigned-url', {
      fileType: 'CONTENT_IMAGE',
      files,
    })
    return data
  },
  async registerUploadedFiles(uploaded) {
    const { data } = await http.post<ApiResponse<FileUploadResponse[]>>('/upload-file', {
      fileType: 'CONTENT_IMAGE',
      files: uploaded.map(({ presign, file }) => ({
        fileName: presign.fileName,
        objectKey: presign.objectKey,
        contentType: presign.contentType,
        bucketName: presign.bucketName,
        fileSize: file.size,
      })),
    })
    return data.data
  },
})

export async function uploadContentImage(file: File): Promise<FileUploadResponse> {
  return contentImageUploader.upload(file)
}
