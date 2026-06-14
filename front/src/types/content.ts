export type ContentType = 'IN_APP_POPUP' | 'ORGANIZATION_ACTIVITY' | 'CITIZEN_PARTICIPATION'

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  IN_APP_POPUP: '인앱팝업',
  ORGANIZATION_ACTIVITY: '단체활동보기',
  CITIZEN_PARTICIPATION: '시민참여',
}

export type Content = {
  id: number
  name: string
  imageFileId: number | null
  imageUrl: string | null // fileId → /download-file 로 클라이언트에서 해석한 표시용 URL
  type: ContentType
  url: string | null
  additionalInfo: string | null
  displayStartDate: string | null // YYYY-MM-DD (서버 LocalDateTime에서 날짜만 추출)
  displayEndDate: string | null // YYYY-MM-DD
}

export type ContentUpsertRequest = {
  name: string
  imageFileId: number | null
  type: ContentType // 서버는 PUT 시 contentType을 무시함 (생성 시에만 사용)
  url: string | null
  additionalInfo: string | null
  displayStartDate: string | null // YYYY-MM-DD; 전송 시 LocalDateTime으로 변환됨
  displayEndDate: string | null
}
