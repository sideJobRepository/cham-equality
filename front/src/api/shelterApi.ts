import type { ApiResponse, PageResponse, Shelter } from '../types/shelter'

export type ShelterImageCategory =
  | 'EXTERIOR'
  | 'INTERIOR'
  | 'ENTRANCE'
  | 'RAMP'
  | 'ELEVATOR'
  | 'TOILET'
  | 'BRAILLE'
  | 'SIGNAGE'
  | 'ETC'

export type ReportImageItem = {
  fileId: number
  category: ShelterImageCategory | null
  description: string | null
}

export type ShelterReportCreateRequest = {
  shelterId: number
  name: string | null
  builtYear: number | null
  safetyGrade: number | null
  signageLanguage: string | null
  accessibleToilet: boolean | null
  ramp: boolean | null
  elevator: boolean | null
  brailleBlock: boolean | null
  etcFacilities: string | null
  requestNote: string | null
  images: ReportImageItem[]
}

export type PresignedUrlResponse = {
  url: string
  objectKey: string
  fileName: string
  bucket: string
  contentType: string
}

export type FileUploadResponse = {
  fileId: number
  fileName: string
  fileSize: number
  contentType: string
  objectKey: string
  bucketName: string
}

export async function fetchShelters(
  page: number,
  size: number,
  keyword?: string,
): Promise<PageResponse<Shelter>> {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (keyword && keyword.trim()) params.set('keyword', keyword.trim())
  const res = await fetch(`/api/shelters?${params}`)
  if (!res.ok) {
    throw new Error(`대피소 목록 조회 실패 (HTTP ${res.status})`)
  }
  const json: ApiResponse<PageResponse<Shelter>> = await res.json()
  return json.data
}

export async function createShelterReport(body: ShelterReportCreateRequest): Promise<number> {
  const res = await fetch(`/api/shelter-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`조사 정보 제출 실패 (HTTP ${res.status})`)
  }
  const json: ApiResponse<number> = await res.json()
  return json.data
}

type PresignInfo = { fileName: string; fileSize: number; contentType: string }

async function requestPresignedUrls(files: PresignInfo[]): Promise<PresignedUrlResponse[]> {
  const res = await fetch(`/api/presigned-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileType: 'SHELTER_IMAGE',
      files: files.map((f) => ({
        fileName: f.fileName,
        fileSize: f.fileSize,
        contentType: f.contentType,
      })),
    }),
  })
  if (!res.ok) throw new Error(`presigned URL 발급 실패 (HTTP ${res.status})`)
  return res.json()
}

async function putToS3(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  })
  if (!res.ok) throw new Error(`S3 업로드 실패 (HTTP ${res.status})`)
}

async function registerUploadedFiles(
  uploaded: { presign: PresignedUrlResponse; file: File }[],
): Promise<FileUploadResponse[]> {
  const res = await fetch(`/api/upload-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileType: 'SHELTER_IMAGE',
      files: uploaded.map(({ presign, file }) => ({
        fileName: presign.fileName,
        objectKey: presign.objectKey,
        contentType: presign.contentType,
        bucketName: presign.bucket,
        fileSize: file.size,
      })),
    }),
  })
  if (!res.ok) throw new Error(`파일 등록 실패 (HTTP ${res.status})`)
  const json: ApiResponse<FileUploadResponse[]> = await res.json()
  return json.data
}

export async function uploadShelterImage(file: File): Promise<FileUploadResponse> {
  const [presign] = await requestPresignedUrls([
    { fileName: file.name, fileSize: file.size, contentType: file.type },
  ])
  await putToS3(presign.url, file)
  const [registered] = await registerUploadedFiles([{ presign, file }])
  return registered
}
