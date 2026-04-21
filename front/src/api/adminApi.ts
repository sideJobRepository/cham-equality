import type { ApiResponse, PageResponse } from '../types/shelter'

const ADMIN_PW_KEY = 'admin-password'

export function getAdminPassword(): string | null {
  return sessionStorage.getItem(ADMIN_PW_KEY)
}

export function setAdminPassword(pw: string): void {
  sessionStorage.setItem(ADMIN_PW_KEY, pw)
}

export function clearAdminPassword(): void {
  sessionStorage.removeItem(ADMIN_PW_KEY)
}

function adminHeaders(): HeadersInit {
  const pw = getAdminPassword()
  return pw ? { 'X-Admin-Password': pw } : {}
}

export async function adminLogin(password: string): Promise<boolean> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const json: ApiResponse<boolean> = await res.json()
  return json.success
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
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(size))
  if (status !== 'ALL') params.set('status', status)
  const res = await fetch(`/api/admin/reports?${params}`, {
    headers: adminHeaders(),
  })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`리포트 조회 실패 (HTTP ${res.status})`)
  const json: ApiResponse<PageResponse<ShelterReport>> = await res.json()
  return json.data
}

export async function fetchReportDetail(id: number): Promise<ShelterReportDetail> {
  const res = await fetch(`/api/admin/reports/${id}`, { headers: adminHeaders() })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`상세 조회 실패 (HTTP ${res.status})`)
  const json: ApiResponse<ShelterReportDetail> = await res.json()
  return json.data
}

export async function approveReport(id: number): Promise<void> {
  const res = await fetch(`/api/admin/reports/${id}/approve`, {
    method: 'POST',
    headers: adminHeaders(),
  })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`승인 실패 (HTTP ${res.status})`)
}

export async function rejectReport(id: number): Promise<void> {
  const res = await fetch(`/api/admin/reports/${id}/reject`, {
    method: 'POST',
    headers: adminHeaders(),
  })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error(`반려 실패 (HTTP ${res.status})`)
}

export class UnauthorizedError extends Error {
  constructor() {
    super('관리자 인증이 필요합니다')
    this.name = 'UnauthorizedError'
  }
}
