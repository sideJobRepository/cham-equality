import styled from 'styled-components/native';
import { Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ACCESSIBILITY_SELECTED_COLOR } from '../../store/mapFilters.ts';
import { colors, fontSize, fontWeight, radius } from '../../theme/index.ts';

interface AccessibilityChipProps {
  label: string;
  active: boolean;
}

// 색만으로 있음/없음을 가르지 않게 아이콘과 읽기 라벨을 같이 둔다(흑백·색약에서도 구분).
export default function AccessibilityChip({
  label,
  active,
}: AccessibilityChipProps) {
  const { t: translate } = useTranslation();

  return (
    <Chip
      $active={active}
      accessible
      accessibilityLabel={translate(
        active ? 'map.a11y.facilityAvailable' : 'map.a11y.facilityUnavailable',
        { name: label },
      )}
    >
      {active ? (
        <Check color={colors.textOnColor} size={12} strokeWidth={3} />
      ) : (
        <X color={INACTIVE_TEXT_COLOR} size={12} strokeWidth={3} />
      )}
      <ChipText $active={active}>{label}</ChipText>
    </Chip>
  );
}

// surfaceMuted 배경 위에서 textMuted 는 약 4.4:1 이라 4.5:1 에 못 미쳐 한 단계 진한 색을 쓴다
const INACTIVE_TEXT_COLOR = colors.textTertiary;

const Chip = styled.View<{ $active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 3px;
  padding: 5px 8px;
  border-radius: ${radius.full}px;
  background-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : colors.surfaceMuted};
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : colors.borderStrong};
`;

const ChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : INACTIVE_TEXT_COLOR};
  font-size: ${fontSize.caption}px;
  font-weight: ${fontWeight.heavy};
`;
