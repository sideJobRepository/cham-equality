import type {
  ApiResponse,
  PageResponse,
  Shelter,
  ShelterSurveyStatus,
  ShelterType,
} from '@/types/shelter'
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
): Promise<PageResponse<Shelter>> {
  const params: Record<string, string | number> = { page, size }
  if (keyword && keyword.trim()) params.keyword = keyword.trim()
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

// ===== 회원(관리자) =====
// 회원 조회 + 회원 지정 앱 푸시. 푸시는 그 회원으로 앱에 로그인해 알림을 등록한 기기에만 간다.

export type AdminMember = {
  id: number
  name: string | null
  email: string | null
  socialType: 'KAKAO' | 'NAVER' | 'APPLE' | null
  createDate: string
  /** 알림 받을 기기 수. 0이면 푸시를 보낼 수 없다. */
  pushDeviceCount: number
}

export async function fetchMembers(
  keyword: string,
  page: number,
  size: number,
): Promise<PageResponse<AdminMember>> {
  const params: Record<string, string | number> = { page, size }
  if (keyword.trim()) params.keyword = keyword.trim()
  const { data } = await http.get<ApiResponse<PageResponse<AdminMember>>>('/admin/members', {
    params,
  })
  return data.data
}

/** 회원의 모든 기기에 알림 발송. 실제로 보낸 기기 수를 돌려준다. */
export async function sendMemberPush(
  memberId: number,
  body: { title: string; body: string },
): Promise<number> {
  const { data } = await http.post<ApiResponse<number>>(`/admin/members/${memberId}/push`, body)
  return data.data
}

// ===== 앱 업데이트(OTA 번들) =====
// 번들 등록(POST)은 CI 전용이라 화면에서 쓰지 않는다. 응답은 서버 AppBundleResponse와 같은 모양이다.

export type AppBundlePlatform = 'ANDROID' | 'IOS'

/** ALPHA = 테스터("베타 업데이트 받기"를 켠 기기)에게만, PRODUCTION = 전체 사용자에게. */
export type AppBundleChannel = 'ALPHA' | 'PRODUCTION'

export type AppBundle = {
  uuid: string
  platform: AppBundlePlatform
  channel: AppBundleChannel
  /** 네이티브 지문. 같은 지문의 앱만 이 번들을 받는다. */
  fingerprint: string | null
  gitCommit: string | null
  message: string | null
  enabled: boolean
  /** 받자마자 재시작해 적용하는 번들인지(아니면 다음 실행 때 적용) */
  forceUpdate: boolean
  createDate: string | null
}

/** 최근 번들(최신순). 서버가 limit을 1~100으로 자른다. */
export async function fetchAppBundles(limit: number): Promise<AppBundle[]> {
  const { data } = await http.get<ApiResponse<AppBundle[]>>('/admin/app-bundles', {
    params: { limit },
  })
  return data.data
}

/** 테스터 채널에 켜져 있는 번들을 전부 전체 공개로 바꾼다. 바뀐 번들 목록을 돌려준다. */
export async function promoteAppBundles(): Promise<AppBundle[]> {
  const { data } = await http.post<ApiResponse<AppBundle[]>>('/admin/app-bundles/promote')
  return data.data
}

export async function setAppBundleEnabled(uuid: string, enabled: boolean): Promise<AppBundle> {
  const action = enabled ? 'enable' : 'disable'
  const { data } = await http.post<ApiResponse<AppBundle>>(
    `/admin/app-bundles/${encodeURIComponent(uuid)}/${action}`,
  )
  return data.data
}

// ===== 유지보수 =====

/** 장소 경계 채우기 한 번의 결과. remaining이 0이 될 때까지 다시 부른다. */
export type PlaceBoundaryFillResult = {
  /** 이번에 조회한 장소 수 */
  processed: number
  /** 경계를 찾아 저장한 수 */
  updated: number
  /** 필지를 못 찾아 다시 조회하지 않게 표시한 수 */
  notFound: number
  /** 통신 오류로 남겨 둔 수(다음 호출 때 다시 시도된다) */
  failed: number
  /** 아직 조회하지 않은 장소 수 */
  remaining: number
}

export async function fillPlaceBoundaries(limit: number): Promise<PlaceBoundaryFillResult> {
  const { data } = await http.post<ApiResponse<PlaceBoundaryFillResult>>(
    '/admin/places/boundaries/fill',
    null,
    { params: { limit } },
  )
  return data.data
}

/** 최신 재난문자 1건을 지정한 푸시 토큰 하나에만 보낸다(실기기 수신 확인용). */
export async function sendTestPush(token: string): Promise<void> {
  await http.post('/admin/push/test', { token })
}
