export type Shelter = {
  id: number
  name: string
  address: string
  latitude: string | null
  longitude: string | null
  area: number | null
  capacity: number | null
  builtYear: number | null
  safetyGrade: number | null
  managingAuthorityName: string | null
  managingAuthorityTelNo: string | null
  signageLanguage: string | null
  accessibleToilet: boolean | null
  ramp: boolean | null
  elevator: boolean | null
  brailleBlock: boolean | null
  etcFacilities: string | null
  pendingReportCount: number
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  empty: boolean
}

export type ApiResponse<T> = {
  code: number
  success: boolean
  message: string
  data: T
}
