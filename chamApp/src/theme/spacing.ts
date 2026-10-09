export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  mdPlus: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
} as const;

export const radius = { xs: 4, sm: 8, md: 12, lg: 16, full: 999 } as const;

// 고령자·장애인 사용자가 많아 터치 영역 최소 44를 상수로 고정
export const size = { touchMin: 44, buttonLg: 48 } as const;
