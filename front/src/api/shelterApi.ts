import type { ApiResponse, PageResponse, Shelter } from '../types/shelter'
import { createPresignedUploader } from '../lib/presignedUpload'
import { http } from './http'

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
  const params: Record<string, string | number> = { page, size }
  if (keyword && keyword.trim()) params.keyword = keyword.trim()
  const { data } = await http.get<ApiResponse<PageResponse<Shelter>>>('/shelters', { params })
  return data.data
}

export async function createShelterReport(body: ShelterReportCreateRequest): Promise<number> {
  const { data } = await http.post<ApiResponse<number>>('/shelter-reports', body)
  return data.data
}

const shelterImageUploader = createPresignedUploader<PresignedUrlResponse, FileUploadResponse>({
  async requestPresignedUrls(files) {
    const { data } = await http.post<PresignedUrlResponse[]>('/presigned-url', {
      fileType: 'SHELTER_IMAGE',
      files,
    })
    return data
  },
  async registerUploadedFiles(uploaded) {
    const { data } = await http.post<ApiResponse<FileUploadResponse[]>>('/upload-file', {
      fileType: 'SHELTER_IMAGE',
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

export async function uploadShelterImage(file: File): Promise<FileUploadResponse> {
  return shelterImageUploader.upload(file)
}
