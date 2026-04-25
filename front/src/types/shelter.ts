export type ShelterType =
  | 'CIVIL_DEFENSE'
  | 'EARTHQUAKE'
  | 'CHEMICAL_ACCIDENT'
  | 'EARTHQUAKE_TEMPORARY_HOUSING'
  | 'DISASTER_TEMPORARY_HOUSING'

export type ShelterSurveyStatus = 'NOT_INVESTIGATED' | 'INVESTIGATED' | 'RE_INVESTIGATION'

export const SHELTER_TYPE_LABEL: Record<ShelterType, string> = {
  CIVIL_DEFENSE: '민방위대피시설',
  EARTHQUAKE: '지진대피장소',
  CHEMICAL_ACCIDENT: '화학사고대피장소',
  EARTHQUAKE_TEMPORARY_HOUSING: '지진겸용 임시주거시설',
  DISASTER_TEMPORARY_HOUSING: '이재민 임시주거시설',
}

export type Shelter = {
  id: number
  name: string
  shelterType: ShelterType | null
  address: string
  oldAddress: string | null
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
  surveyStatus: ShelterSurveyStatus | null
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
