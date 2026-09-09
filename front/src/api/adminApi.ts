import type {
  ApiResponse,
  PageResponse,
  Shelter,
  ShelterSurveyStatus,
  ShelterType,
} from '@/types/shelter'
import type { ShelterSearchFilter } from './shelterApi'
import { http } from './http'

export {
  getAdminPassword,
  setAdminPassword,
  clearAdminPassword,
  errorMessage,
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
  shelterName: string | null
  signageLanguage: string | null
  accessibleToilet: boolean | null
  ramp: boolean | null
  elevator: boolean | null
  brailleBlock: boolean | null
  etcFacilities: string | null
  reporter: string | null
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
  shelterSurveyStatus: ShelterSurveyStatus | null
  images: ShelterReportImageView[]
}

export type AdminReportFilter = ShelterReportStatus | 'RE_INVESTIGATION'

export async function fetchReports(
  filter: AdminReportFilter | 'ALL',
  page: number,
  size: number,
): Promise<PageResponse<ShelterReport>> {
  const params: Record<string, string | number> = { page, size }
  if (filter !== 'ALL') params.filter = filter
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

export async function rejectReport(id: number): Promise<void> {
  await http.post(`/admin/reports/${id}/reject`)
}

export async function requestReInvestigation(id: number): Promise<void> {
  await http.post(`/admin/reports/${id}/re-investigate`)
}

// ===== 앱 제보(관리자) =====
// 웹 제보와 거의 동일하나 조사자(reporter)·조사메모(requestNote)가 없고 재조사(RE_INVESTIGATION)가 없다.

export type ShelterAppReport = {
  id: number
  shelterId: number
  shelterName: string | null
  signageLanguage: string | null
  accessibleToilet: boolean | null
  ramp: boolean | null
  elevator: boolean | null
  brailleBlock: boolean | null
  etcFacilities: string | null
  requestStatus: ShelterReportStatus
  createDate: string
}

export type ShelterAppReportDetail = ShelterAppReport & {
  shelterAddress: string | null
  shelterSurveyStatus: ShelterSurveyStatus | null
  images: ShelterReportImageView[]
}

export type AdminAppReportFilter = ShelterReportStatus

export async function fetchAppReports(
  filter: AdminAppReportFilter | 'ALL',
  page: number,
  size: number,
): Promise<PageResponse<ShelterAppReport>> {
  const params: Record<string, string | number> = { page, size }
  if (filter !== 'ALL') params.filter = filter
  const { data } = await http.get<ApiResponse<PageResponse<ShelterAppReport>>>('/admin/app-reports', {
    params,
  })
  return data.data
}

export async function fetchAppReportDetail(id: number): Promise<ShelterAppReportDetail> {
  const { data } = await http.get<ApiResponse<ShelterAppReportDetail>>(`/admin/app-reports/${id}`)
  return data.data
}

export async function approveAppReport(id: number): Promise<void> {
  await http.post(`/admin/app-reports/${id}/approve`)
}

export async function rejectAppReport(id: number): Promise<void> {
  await http.post(`/admin/app-reports/${id}/reject`)
}

// ===== 앱 피드백(관리자) =====
// 앱의 피드백 창구로 접수된 자유 형식 의견. 대피소에 반영되지 않으므로 승인/반려가 아니라
// 처리 상태(접수/확인중/완료)와 내부 메모만 관리한다.

export type AppFeedbackStatus = 'RECEIVED' | 'IN_PROGRESS' | 'RESOLVED'

export type AppFeedbackCategory =
  | 'BUG'
  | 'IMPROVEMENT'
  | 'SHELTER_DATA'
  | 'CONTENT'
  | 'ETC'

export type AppFeedback = {
  id: number
  memberId: number | null
  category: AppFeedbackCategory | null
  content: string | null
  status: AppFeedbackStatus
  appVersion: string | null
  platform: string | null
  createDate: string
}

export type AppFeedbackImageView = {
  fileId: number
  url: string
  fileName: string
}

export type AppFeedbackDetail = AppFeedback & {
  memberName: string | null
  contact: string | null
  adminNote: string | null
  osVersion: string | null
  deviceModel: string | null
  screen: string | null
  modifyDate: string | null
  images: AppFeedbackImageView[]
}

export async function fetchFeedbacks(
  filter: AppFeedbackStatus | 'ALL',
  page: number,
  size: number,
): Promise<PageResponse<AppFeedback>> {
  const params: Record<string, string | number> = { page, size }
  if (filter !== 'ALL') params.filter = filter
  const { data } = await http.get<ApiResponse<PageResponse<AppFeedback>>>('/admin/feedbacks', {
    params,
  })
  return data.data
}

export async function fetchFeedbackDetail(id: number): Promise<AppFeedbackDetail> {
  const { data } = await http.get<ApiResponse<AppFeedbackDetail>>(`/admin/feedbacks/${id}`)
  return data.data
}

export async function updateFeedback(
  id: number,
  body: { status: AppFeedbackStatus; adminNote: string | null },
): Promise<void> {
  await http.put(`/admin/feedbacks/${id}`, body)
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

export async function fetchAdminShelters(
  page: number,
  size: number,
  keyword?: string,
  filter?: ShelterSearchFilter,
): Promise<PageResponse<Shelter>> {
  const params: Record<string, string | number> = { page, size }
  if (keyword && keyword.trim()) params.keyword = keyword.trim()
  if (filter) params.filter = filter
  const { data } = await http.get<ApiResponse<PageResponse<Shelter>>>('/admin/shelters', { params })
  return data.data
}

export type AdminShelterUpdateRequest = {
  name: string | null
  builtYear: number | null
  shelterType: ShelterType | null
  safetyGrade: number | null
}

export async function updateAdminShelter(
  id: number,
  body: AdminShelterUpdateRequest,
): Promise<void> {
  await http.put(`/admin/shelters/${id}`, body)
}

/**
 * 관리자 대피소 추가 요청. 위도/경도는 서버가 주소를 지오코딩해 채우므로 보내지 않는다.
 * address 또는 oldAddress 중 하나는 반드시 있어야 한다(서버가 지오코딩 대상으로 사용).
 */
export type AdminShelterCreateRequest = {
  name: string
  englishName: string | null
  description: string | null
  regionId: number | null
  address: string | null
  oldAddress: string | null
  englishAddress: string | null
  shelterType: ShelterType | null
  area: number | null
  capacity: number | null
  builtYear: number | null
  safetyGrade: number | null
  managingAuthorityName: string | null
  managingAuthorityTelNo: string | null
}

export async function createAdminShelter(body: AdminShelterCreateRequest): Promise<number> {
  const { data } = await http.post<ApiResponse<number>>('/admin/shelters', body)
  return data.data
}

/**
 * 엑셀 파일 한 개를 multipart 파라미터 `file`로 올려 대피소를 일괄 등록하고, 생성된 id 목록을 돌려준다.
 * Content-Type을 null로 지워야 브라우저가 boundary 포함 multipart 헤더를 붙인다 —
 * 인스턴스 기본값(application/json)이 남아 있으면 axios가 FormData를 JSON으로 직렬화해 버린다.
 */
export async function bulkCreateAdminShelters(file: File): Promise<number[]> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await http.post<ApiResponse<number[]>>('/admin/shelters/bulk', form, {
    headers: { 'Content-Type': null },
  })
  return data.data
}
