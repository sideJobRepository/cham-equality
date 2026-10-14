import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { CircleHelp, SlidersHorizontal, X } from 'lucide-react-native';
import MapFilterSheet, { useShelterTypeSummary } from './MapFilterSheet.tsx';
import {
  ACCESSIBILITY_ALL_LABEL,
  SHELTER_ALL_LABEL,
  accessibilityFilterLabelKeys,
  useMapFilterStore,
} from '../store/mapFilters.ts';
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  size,
  spacing,
} from '../theme/index.ts';

interface MapFilterBarProps {
  onPressAccessibilityInfo?: () => void;
}

// 지도 상단에 유형·접근성 칩 두 줄이 있으면 360dp 에서 지도가 절반 가까이 가려졌다.
// 한 줄(필터 버튼 + 선택 요약)로 접고, 고르는 건 하단 시트에서 한다.
export default function MapFilterBar({
  onPressAccessibilityInfo,
}: MapFilterBarProps) {
  const { t: translate } = useTranslation();
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const toggleAccessibility = useMapFilterStore(
    state => state.toggleAccessibility,
  );
  const applyFilters = useMapFilterStore(state => state.applyFilters);
  const shelterTypeSummary = useShelterTypeSummary();

  const [visible, setVisible] = useState(false);

  const activeAccessibility = selectedAccessibility.filter(
    item => item !== ACCESSIBILITY_ALL_LABEL,
  );
  const selectedCount = shelterTypeSummary.count + activeAccessibility.length;

  const openSheet = () => setVisible(true);
  const closeSheet = () => setVisible(false);

  // 유형은 한 칩으로 접혀 있으니 X 는 유형 선택을 통째로 푼다
  const summaryItems = [
    ...(shelterTypeSummary.count
      ? [
          {
            key: 'type',
            label: shelterTypeSummary.label,
            a11yLabel: shelterTypeSummary.fullLabel,
            color: colors.filterStrong.shelter,
            onRemove: () =>
              applyFilters([SHELTER_ALL_LABEL], selectedAccessibility),
          },
        ]
      : []),
    ...activeAccessibility.map(item => {
      const label = translate(accessibilityFilterLabelKeys[item] ?? item);
      return {
        key: `a11y-${item}`,
        label,
        a11yLabel: label,
        color: colors.filterStrong.accessibility,
        onRemove: () => toggleAccessibility(item),
      };
    }),
  ];

  return (
    <Bar>
      <FilterButton
        accessibilityRole="button"
        accessibilityLabel={
          selectedCount
            ? translate('map.filterSheet.buttonSelected', {
                count: selectedCount,
              })
            : translate('map.filterSheet.button')
        }
        $active={selectedCount > 0}
        onPress={openSheet}
      >
        <SlidersHorizontal
          color={selectedCount ? colors.textOnColor : colors.textSecondary}
          size={17}
          strokeWidth={2.4}
        />
        <FilterButtonText $active={selectedCount > 0}>
          {translate('map.filterSheet.button')}
        </FilterButtonText>
        {selectedCount ? (
          <CountBadge>
            <CountBadgeText>{selectedCount}</CountBadgeText>
          </CountBadge>
        ) : null}
      </FilterButton>

      {onPressAccessibilityInfo ? (
        <InfoChip
          accessibilityRole="button"
          accessibilityLabel={translate('map.accessibilityInfo.title')}
          onPress={onPressAccessibilityInfo}
        >
          <InfoChipText numberOfLines={1}>
            {translate('map.accessibilityInfo.label')}
          </InfoChipText>
          <CircleHelp
            color={colors.primaryPressed}
            size={17}
            strokeWidth={2.5}
          />
        </InfoChip>
      ) : null}

      <SummaryScroll
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={summaryContentStyle}
      >
        {summaryItems.length ? (
          summaryItems.map(item => (
            <SummaryChip
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={translate('map.filterSheet.remove', {
                label: item.a11yLabel,
              })}
              onPress={item.onRemove}
            >
              <SummaryChipBody $color={item.color}>
                <SummaryChipText numberOfLines={1}>
                  {item.label}
                </SummaryChipText>
                <X color={colors.textOnColor} size={14} strokeWidth={2.8} />
              </SummaryChipBody>
            </SummaryChip>
          ))
        ) : (
          <EmptySummaryText numberOfLines={1}>
            {translate('map.filterSheet.noneSelected')}
          </EmptySummaryText>
        )}
      </SummaryScroll>

      <MapFilterSheet visible={visible} onClose={closeSheet} />
    </Bar>
  );
}

const summaryContentStyle = {
  alignItems: 'center' as const,
  gap: spacing.sm,
  paddingRight: spacing.xl,
};

const Bar = styled.View`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.md}px;
  padding: 0 ${spacing.xxl}px;
`;

const FilterButton = styled.Pressable<{ $active: boolean }>`
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.sm}px;
  min-height: ${size.touchMin}px;
  padding: 0 ${spacing.lg}px;
  border-radius: ${radius.full}px;
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? colors.primary : colors.borderStrong};
  background-color: ${({ $active }) =>
    $active ? colors.primary : colors.surface};
`;

const FilterButtonText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) =>
    $active ? colors.textOnColor : colors.textSecondary};
  font-size: ${fontSize.label}px;
  font-weight: ${fontWeight.heavy};
`;

const CountBadge = styled.View`
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 ${spacing.sm}px;
  border-radius: ${radius.full}px;
  background-color: ${colors.surface};
`;

const CountBadgeText = styled.Text`
  color: ${colors.primary};
  font-size: ${fontSize.caption}px;
  font-weight: ${fontWeight.heavy};
`;

const InfoChip = styled.Pressable`
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  min-height: ${size.touchMin}px;
  padding: 0 ${spacing.lg}px;
  border-radius: ${radius.full}px;
  border-width: 1px;
  border-color: ${colors.primaryBorder};
  background-color: ${colors.primarySoft};
`;

const InfoChipText = styled.Text`
  color: ${colors.primaryPressed};
  font-size: ${fontSize.label}px;
  font-weight: ${fontWeight.bold};
`;

const SummaryScroll = styled.ScrollView`
  flex: 1;
`;

// 스크롤뷰 밖으로 나간 hitSlop 은 안드로이드에서 눌리지 않아서,
// 눌리는 영역은 44로 두고 보이는 칩만 낮게 그린다
const SummaryChip = styled.Pressable`
  min-height: ${size.touchMin}px;
  justify-content: center;
`;

const SummaryChipBody = styled.View<{ $color: string }>`
  flex-direction: row;
  align-items: center;
  gap: ${spacing.xs}px;
  height: 34px;
  padding: 0 ${spacing.mdPlus}px;
  border-radius: ${radius.full}px;
  background-color: ${({ $color }) => $color};
`;

const SummaryChipText = styled.Text`
  color: ${colors.textOnColor};
  font-size: ${fontSize.caption}px;
  font-weight: ${fontWeight.bold};
`;

const EmptySummaryText = styled.Text`
  color: ${colors.textMuted};
  font-size: ${fontSize.caption}px;
`;
