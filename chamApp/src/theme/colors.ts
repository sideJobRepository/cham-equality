// 화면 코드는 의미 토큰(colors)만 쓴다. 값이 바뀌어도 이름은 유지되게 하려는 것
export const colors = {
  brand: '#093a6e',
  brandDeep: '#1f3a5f',
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  primarySoft: '#eff6ff',
  primaryBorder: '#bfdbfe',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  warning: '#ea580c',
  warningSoft: '#fff7ed',
  warningText: '#9a3412',
  success: '#16a34a',
  successStrong: '#15803d',
  text: '#111827',
  textSecondary: '#374151',
  textTertiary: '#4b5563',
  textMuted: '#6b7280',
  textDisabled: '#9ca3af',
  textOnColor: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',
  background: '#f9fafb',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  inverse: '#1d1d1f',
  shadow: '#111827',
  overlay: 'rgba(15,23,42,0.45)',
  imageViewerBackdrop: 'rgba(0,0,0,0.86)',
  imageViewerControl: 'rgba(17,24,39,0.62)',
  alert: {
    critical: '#dc2626',
    emergency: '#ea580c',
    advisory: '#093a6e',
    etc: '#475569',
  },
  // 범례·배지·지도 마커가 모두 이 값을 쓴다. 흰 배경 위 글자 대비 때문에 진한 톤으로 고정
  a11yMatch: {
    accessible: '#15803d',
    partial: '#b45309',
    inaccessible: '#dc2626',
  },
  filter: { shelter: '#4aa199', accessibility: '#5088dc' },
  // 위 필터색 위에 흰 글자를 올리면 대비가 3:1 남짓이라, 칠한 배경에 흰 글자를 얹는 곳(필터 시트 칩)은 4.5:1 이상인 진한 톤을 쓴다
  filterStrong: { shelter: '#2b7a72', accessibility: '#3b6fc4' },
  // 웹 SweetAlert(.cham-alert) 색을 맞춘 값이라 다른 토큰과 합치지 않는다(오류·삭제만 앱 danger 를 따른다)
  dialog: { cancel: '#8a94a3', warning: '#f59e0b' },
} as const;

// 각 사의 공식 브랜드 가이드 색이라 디자인 토큰과 분리
export const externalBrand = {
  kakao: '#fee500',
  kakaoText: '#191600',
  naver: '#03c75a',
  apple: '#000000',
} as const;
