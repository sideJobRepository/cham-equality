import type { ApiResponse } from '@/types/shelter'
import type { Content, ContentType, ContentUpsertRequest } from '@/types/content'
import { createPresignedUploader } from '@/lib/file'
import { http } from './http'
import { getDownloadUrl } from './adminApi'
import type { FileUploadResponse, PresignedUrlResponse } from './shelterApi'

type ServerContent = {
  id: number
  contentType: ContentType
  name: string
  imageFileId: number | null
  url: string | null
  additionalInfo: string | null
  displayStartDate: string | null // LocalDateTime (YYYY-MM-DDTHH:mm:ss)
  displayEndDate: string | null
  createDate: string
  modifyDate: string
}

function fromServer(s: ServerContent, imageUrl: string | null): Content {
  return {
    id: s.id,
    type: s.contentType,
    name: s.name,
    imageFileId: s.imageFileId,
    imageUrl,
    url: s.url,
    additionalInfo: s.additionalInfo,
    displayStartDate: s.displayStartDate ? s.displayStartDate.slice(0, 10) : null,
    displayEndDate: s.displayEndDate ? s.displayEndDate.slice(0, 10) : null,
  }
}

function toServerDate(date: string | null, endOfDay: boolean): string | null {
  if (!date) return null
  return endOfDay ? `${date}T23:59:59` : `${date}T00:00:00`
}

export async function fetchContents(): Promise<Content[]> {
  const { data } = await http.get<ApiResponse<ServerContent[]>>('/admin/contents')
  const items = data.data
  const imageUrls = await Promise.all(
    items.map((c) =>
      c.imageFileId
        ? getDownloadUrl(c.imageFileId).catch(() => null)
        : Promise.resolve(null),
    ),
  )
  return items.map((c, i) => fromServer(c, imageUrls[i]))
}

export async function createContent(body: ContentUpsertRequest): Promise<void> {
  await http.post('/admin/contents', {
    contentType: body.type,
    name: body.name,
    imageFileId: body.imageFileId,
    url: body.url,
    additionalInfo: body.additionalInfo,
    displayStartDate: toServerDate(body.displayStartDate, false),
    displayEndDate: toServerDate(body.displayEndDate, true),
  })
}

export async function updateContent(id: number, body: ContentUpsertRequest): Promise<void> {
  // PUT은 부분 수정이 아니라 전체 교체 — 누락 필드는 null로 덮어쓰임 (additionalInfo 포함)
  await http.put(`/admin/contents/${id}`, {
    name: body.name,
    imageFileId: body.imageFileId,
    url: body.url,
    additionalInfo: body.additionalInfo,
    displayStartDate: toServerDate(body.displayStartDate, false),
    displayEndDate: toServerDate(body.displayEndDate, true),
  })
}

export async function deleteContent(id: number): Promise<void> {
  await http.delete(`/admin/contents/${id}`)
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
