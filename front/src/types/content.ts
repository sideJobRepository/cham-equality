export type ContentType = 'IN_APP_POPUP' | 'ORGANIZATION_ACTIVITY' | 'CITIZEN_PARTICIPATION'

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  IN_APP_POPUP: '인앱팝업',
  ORGANIZATION_ACTIVITY: '단체활동보기',
  CITIZEN_PARTICIPATION: '시민참여',
}

// 타입별 extra 응답 — 백엔드가 type에 맞춰 채워서 내려준다.
// IN_APP_POPUP만 노출 기간(startDate/endDate)을 사용한다.
export type Content = {
  id: number
  name: string
  imageFileId: number | null
  imageUrl: string | null // 서버가 fileId로부터 렌더링해 내려주는 표시용 URL
  type: ContentType
  url: string | null
  startDate: string | null // YYYY-MM-DD, IN_APP_POPUP 전용
  endDate: string | null // YYYY-MM-DD, IN_APP_POPUP 전용
}

export type ContentUpsertRequest = {
  name: string
  imageFileId: number | null
  type: ContentType
  url: string | null
  startDate: string | null // IN_APP_POPUP에서만 사용, 그 외 타입은 null로 전송
  endDate: string | null
}
