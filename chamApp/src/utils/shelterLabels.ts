// 홈 최근접 대피소 카드와 지도 상세가 같은 접근성 칩을 그린다.
// 한국어 표시명을 lookup key 로 쓰면 매핑이 빠졌을 때 외국어 화면에 한국어가 그대로 새어 나와서,
// 영문 key 와 i18n 키를 따로 둔다.

interface AccessibilityFields {
  ramp?: boolean | null;
  elevator?: boolean | null;
  brailleBlock?: boolean | null;
  accessibleToilet?: boolean | null;
}

export interface AccessibilityChip {
  key: 'ramp' | 'elevator' | 'brailleBlock' | 'accessibleToilet';
  labelKey: string;
  active: boolean;
}

export function getAccessibilityChips(
  shelter: AccessibilityFields,
): AccessibilityChip[] {
  return [
    { key: 'ramp', labelKey: 'map.filters.ramp', active: shelter.ramp === true },
    {
      key: 'elevator',
      labelKey: 'map.filters.elevator',
      active: shelter.elevator === true,
    },
    {
      key: 'brailleBlock',
      labelKey: 'map.filters.brailleBlock',
      active: shelter.brailleBlock === true,
    },
    {
      key: 'accessibleToilet',
      labelKey: 'map.filters.accessibleToilet',
      active: shelter.accessibleToilet === true,
    },
  ];
}
