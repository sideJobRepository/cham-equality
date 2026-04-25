import type { ApiResponse, PageResponse, Shelter, ShelterSurveyStatus } from '../types/shelter'
import { createPresignedUploader } from '../lib/file'
import { http, useNextUserPassword } from './http'

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
  bucketName: string
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

export type ShelterSearchFilter =
  | 'COMPLETED'
  | 'RE_INVESTIGATION'
  | 'SUBMITTED'
  | 'NOT_SUBMITTED'

export async function fetchShelters(
  page: number,
  size: number,
  keyword?: string,
  filter?: ShelterSearchFilter,
): Promise<PageResponse<Shelter>> {
  const params: Record<string, string | number> = { page, size }
  if (keyword && keyword.trim()) params.keyword = keyword.trim()
  if (filter) params.filter = filter
  const { data } = await http.get<ApiResponse<PageResponse<Shelter>>>('/shelters', { params })
  return data.data
}

/**
 * 신고 생성. 대피소가 RE_INVESTIGATION 상태면 userPassword가 필요하다.
 * NOT_INVESTIGATED 상태에선 비번 없이도 보낼 수 있고, INVESTIGATED 상태면 서버가 400으로 막는다.
 */
export async function createShelterReport(
  body: ShelterReportCreateRequest,
  userPassword?: string,
): Promise<number> {
  if (userPassword) useNextUserPassword(userPassword)
  const { data } = await http.post<ApiResponse<number>>('/shelter-reports', body)
  return data.data
}

export type ShelterReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ShelterReportSummary = {
  id: number
  shelterId: number
  shelterName: string | null
  signageLanguage: string | null
  accessibleToilet: boolean | null
  ramp: boolean | null
  elevator: boolean | null
  brailleBlock: boolean | null
  etcFacilities: string | null
  requestNote: string | null
  requestStatus: ShelterReportStatus
  createDate: string
}

export type ShelterReportImageView = {
  fileId: number
  category: ShelterImageCategory | null
  description: string | null
  url: string
  fileName: string
}

export type ShelterReportDetail = ShelterReportSummary & {
  shelterName: string | null
  shelterAddress: string | null
  shelterSurveyStatus: ShelterSurveyStatus | null
  images: ShelterReportImageView[]
}

export async function fetchPendingReportsByShelter(
  shelterId: number,
): Promise<ShelterReportSummary[]> {
  const { data } = await http.get<ApiResponse<ShelterReportSummary[]>>(
    `/shelter-reports/shelter/${shelterId}`,
    { params: { status: 'PENDING' } },
  )
  return data.data
}

export async function fetchApprovedReportsByShelter(
  shelterId: number,
): Promise<ShelterReportSummary[]> {
  const { data } = await http.get<ApiResponse<ShelterReportSummary[]>>(
    `/shelter-reports/shelter/${shelterId}`,
    { params: { status: 'APPROVED' } },
  )
  return data.data
}

export async function fetchShelterReportDetail(id: number): Promise<ShelterReportDetail> {
  const { data } = await http.get<ApiResponse<ShelterReportDetail>>(`/shelter-reports/${id}`)
  return data.data
}

export type FileProcessStatus = 'CREATE' | 'DELETE'

export type ImageChange = {
  fileId: number
  status: FileProcessStatus
  category: ShelterImageCategory | null
  description: string | null
}

export type ShelterReportUpdateRequest = {
  signageLanguage: string | null
  accessibleToilet: boolean | null
  ramp: boolean | null
  elevator: boolean | null
  brailleBlock: boolean | null
  etcFacilities: string | null
  requestNote: string | null
  imageChanges: ImageChange[]
}

export async function updateShelterReport(
  id: number,
  body: ShelterReportUpdateRequest,
  userPassword: string,
): Promise<void> {
  useNextUserPassword(userPassword)
  await http.put(`/shelter-reports/${id}`, body)
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
        bucketName: presign.bucketName,
        fileSize: file.size,
      })),
    })
    return data.data
  },
})

export async function uploadShelterImage(file: File): Promise<FileUploadResponse> {
  return shelterImageUploader.upload(file)
}
