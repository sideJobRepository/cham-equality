// 매뉴얼(앱 내 사용 안내) — 언어별로 제목 + 리치텍스트 본문을 가진다.
// 본문 HTML 안의 이미지는 업로드 시 base64 data URL로 인라인 삽입된다(별도 파일 저장 없음).

// 서버 Language enum(KO/EN/ZH/JA/VI)과 일치시킨다.
export type ManualLanguage = 'KO' | 'EN' | 'ZH' | 'JA' | 'VI'

export const MANUAL_LANGUAGE_LABEL: Record<ManualLanguage, string> = {
  KO: '한국어',
  EN: 'English',
  ZH: '中文',
  JA: '日本語',
  VI: 'Tiếng Việt',
}

export const MANUAL_LANGUAGES = Object.keys(MANUAL_LANGUAGE_LABEL) as ManualLanguage[]

// 목록 조회 응답 — 본문(content)은 내려오지 않는다.
export type ManualListItem = {
  id: number
  language: ManualLanguage
  title: string
}

// 상세 조회 응답 — 본문 포함.
export type Manual = {
  id: number
  language: ManualLanguage
  title: string
  contentHtml: string // 이미지가 base64로 인라인된 완성 HTML
}

// 저장 요청 바디(서버 연동 전까지는 콘솔 로그로만 사용)
export type ManualUpsertRequest = {
  language: ManualLanguage
  title: string
  contentHtml: string
}
