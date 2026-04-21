import type { ApiResponse, PageResponse } from '../types/shelter'
import { http } from './http'

export {
  getAdminPassword,
  setAdminPassword,
  clearAdminPassword,
  UnauthorizedError,
} from './http'

export async function adminLogin(password: string): Promise<boolean> {
  const { data } = await http.post<ApiResponse<boolean>>('/admin/login', { password })
  return data.success
}

export type ShelterReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type ShelterReport = {
  id: number
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
  requestStatus: ShelterReportStatus
  createDate: string
}

export type ShelterReportImageView = {
  fileId: number
  category: string | null
  description: string | null
  url: string
  fileName: string
}

export type ShelterReportDetail = ShelterReport & {
  shelterName: string | null
  shelterAddress: string | null
  images: ShelterReportImageView[]
}

export async function fetchReports(
  status: ShelterReportStatus | 'ALL',
  page: number,
  size: number,
): Promise<PageResponse<ShelterReport>> {
  const params: Record<string, string | number> = { page, size }
  if (status !== 'ALL') params.status = status
  const { data } = await http.get<ApiResponse<PageResponse<ShelterReport>>>('/admin/reports', {
    params,
  })
  return data.data
}

export async function fetchReportDetail(id: number): Promise<ShelterReportDetail> {
  const { data } = await http.get<ApiResponse<ShelterReportDetail>>(`/admin/reports/${id}`)
  return data.data
}

export async function approveReport(id: number): Promise<void> {
  await http.post(`/admin/reports/${id}/approve`)
}

export async function getDownloadUrl(fileId: number): Promise<string> {
  const { data } = await http.get<ApiResponse<string>>(`/download-file/${fileId}`)
  return data.data
}

export async function downloadFilesAsZip(ids: number[], name: string): Promise<Blob> {
  const { data } = await http.post<Blob>(
    '/download-file/zip',
    { ids, name },
    { responseType: 'blob' },
  )
  return data
}

export async function rejectReport(id: number): Promise<void> {
  await http.post(`/admin/reports/${id}/reject`)
}
