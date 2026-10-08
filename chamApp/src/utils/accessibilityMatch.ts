// 접근성 필터 매칭 판정. chamApi Shelter.evaluateAccessibility / PlaceMapResponse 판정을 그대로 옮겼다.
// 서버는 접근성 칩으로 대피소를 거르지 않고 색만 정하므로, 칩을 누를 때마다 다시 받지 않고 여기서 칠한다.

export type AccessibilityMatchStatus =
  | 'ACCESSIBLE'
  | 'PARTIAL'
  | 'INACCESSIBLE'
  | 'NONE';

export type AccessibilityFeature =
  | 'ACCESSIBLE_TOILET'
  | 'RAMP'
  | 'ELEVATOR'
  | 'BRAILLE_BLOCK';

interface AccessibilityFields {
  accessibleToilet?: boolean | null;
  ramp?: boolean | null;
  elevator?: boolean | null;
  brailleBlock?: boolean | null;
}

const featureFields: Record<AccessibilityFeature, keyof AccessibilityFields> = {
  ACCESSIBLE_TOILET: 'accessibleToilet',
  RAMP: 'ramp',
  ELEVATOR: 'elevator',
  BRAILLE_BLOCK: 'brailleBlock',
};

export function isAccessibilityFeature(value: string): value is AccessibilityFeature {
  return Object.prototype.hasOwnProperty.call(featureFields, value);
}

// 서버와 같이 값이 정확히 true 일 때만 충족(null·미입력은 미충족). 필터가 비면 NONE.
export function evaluateShelterMatch(
  shelter: AccessibilityFields | null | undefined,
  features: readonly AccessibilityFeature[],
): AccessibilityMatchStatus {
  if (!features.length) return 'NONE';

  const satisfied = features.filter(
    feature => shelter?.[featureFields[feature]] === true,
  ).length;

  if (satisfied === features.length) return 'ACCESSIBLE';
  if (satisfied === 0) return 'INACCESSIBLE';
  return 'PARTIAL';
}

// 장소는 소속 대피소 중 가장 좋은 판정을 쓴다(ACCESSIBLE > PARTIAL > INACCESSIBLE > NONE).
export function evaluatePlaceMatch(
  shelters: readonly (AccessibilityFields | null | undefined)[] | null | undefined,
  features: readonly AccessibilityFeature[],
): AccessibilityMatchStatus {
  const statuses = (shelters ?? []).map(shelter =>
    evaluateShelterMatch(shelter, features),
  );
  if (statuses.includes('ACCESSIBLE')) return 'ACCESSIBLE';
  if (statuses.includes('PARTIAL')) return 'PARTIAL';
  if (statuses.includes('INACCESSIBLE')) return 'INACCESSIBLE';
  return 'NONE';
}
