// 화면 코드는 의미 토큰(colors)만 쓴다. 값이 바뀌어도 이름은 유지되게 하려는 것
export const colors = {
  brand: '#093a6e',
  brandDeep: '#1f3a5f',
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  primarySoft: '#eff6ff',
  primaryBorder: '#bfdbfe',
  danger: '#dc2626',
  // UI 개선 때 의미별(위치 버튼·삭제 아이콘)로 다시 나눌 값이라 danger 와 따로 둔다
  dangerBright: '#ef4444',
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
  imageViewerBackdrop: 'rgba(0,0,0,0.86)',
  imageViewerControl: 'rgba(17,24,39,0.62)',
  alert: {
    critical: '#dc2626',
    emergency: '#ea580c',
    advisory: '#093a6e',
    etc: '#475569',
  },
  a11yMatch: {
    accessible: '#15803d',
    partial: '#b45309',
    inaccessible: '#dc2626',
  },
  a11yLegend: {
    accessible: '#16a34a',
    partial: '#f59e0b',
    inaccessible: '#dc2626',
  },
  filter: { shelter: '#4aa199', accessibility: '#5088dc' },
  // 웹 SweetAlert(.cham-alert) 색을 그대로 맞춘 값이라 다른 토큰과 합치지 않는다
  dialog: { cancel: '#8a94a3', destructive: '#e5484d', warning: '#f59e0b' },
} as const;

// 각 사의 공식 브랜드 가이드 색이라 디자인 토큰과 분리
export const externalBrand = {
  kakao: '#fee500',
  kakaoText: '#191600',
  naver: '#03c75a',
  apple: '#000000',
} as const;
