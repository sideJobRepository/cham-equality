import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { ChevronDown, CircleHelp } from 'lucide-react-native';
import {
  ACCESSIBILITY_ALL_LABEL,
  ACCESSIBILITY_SELECTED_COLOR,
  accessibilityFilterLabelKeys,
  accessibilityOptions,
  useMapFilterStore,
} from '../store/mapFilters.ts';
import { colors } from '../theme/index.ts';
import MapFilterBar from './MapFilterBar.tsx';
import MapFilterSheet, { useShelterTypeSummary } from './MapFilterSheet.tsx';

interface MapSearchFiltersProps {
  horizontalPadding?: number;
  showShelterTypes?: boolean;
  showAccessibilityAll?: boolean;
  onPressAccessibilityInfo?: () => void;
  /** 지도처럼 세로 공간이 귀한 곳은 칩 대신 필터 버튼 한 줄 + 하단 시트로 접는다 */
  compact?: boolean;
}

export default function MapSearchFilters({
  horizontalPadding = 20,
  showShelterTypes = true,
  showAccessibilityAll = true,
  onPressAccessibilityInfo,
  compact = false,
}: MapSearchFiltersProps) {
  if (compact) {
    return <MapFilterBar onPressAccessibilityInfo={onPressAccessibilityInfo} />;
  }
  return (
    <ChipFilters
      horizontalPadding={horizontalPadding}
      showShelterTypes={showShelterTypes}
      showAccessibilityAll={showAccessibilityAll}
      onPressAccessibilityInfo={onPressAccessibilityInfo}
    />
  );
}

function ChipFilters({
  horizontalPadding,
  showShelterTypes,
  showAccessibilityAll,
  onPressAccessibilityInfo,
}: Required<
  Omit<MapSearchFiltersProps, 'onPressAccessibilityInfo' | 'compact'>
> &
  Pick<MapSearchFiltersProps, 'onPressAccessibilityInfo'>) {
  const { t: translate } = useTranslation();
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const toggleAccessibility = useMapFilterStore(
    state => state.toggleAccessibility,
  );
  const openAccessibilityInfo = () => {
    onPressAccessibilityInfo?.();
  };
  const visibleAccessibilityOptions = useMemo(
    () => accessibilityOptions.filter(item => item !== ACCESSIBILITY_ALL_LABEL),
    [],
  );
  const shelterTypeSummary = useShelterTypeSummary();
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);

  return (
    <FilterSection $horizontalPadding={horizontalPadding}>
      <FilterGroup>
        <AccessibilityRow>
          {showAccessibilityAll ? (
            <InfoChip
              accessibilityRole="button"
              onPress={openAccessibilityInfo}
              accessibilityLabel={translate('map.accessibilityInfo.label')}
              hitSlop={8}
            >
              <InfoChipText>
                {translate('map.accessibilityInfo.label')}
              </InfoChipText>
              <CircleHelp
                color={colors.primaryPressed}
                size={17}
                strokeWidth={2.5}
              />
            </InfoChip>
          ) : null}
          <AccessibilityFilterRow
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={rowContentStyle}
          >
            {showShelterTypes ? (
              <>
                <FilterChip
                  $selected={shelterTypeSummary.count > 0}
                  $selectedColor={colors.filterStrong.shelter}
                  accessibilityRole="button"
                  accessibilityLabel={`${translate(
                    'map.filterSheet.shelterType',
                  )}${
                    shelterTypeSummary.count
                      ? `: ${shelterTypeSummary.fullLabel}`
                      : ''
                  }`}
                  onPress={() => setTypeSheetVisible(true)}
                >
                  <FilterChipText $selected={shelterTypeSummary.count > 0}>
                    {shelterTypeSummary.count
                      ? shelterTypeSummary.label
                      : translate('map.filterSheet.shelterType')}
                  </FilterChipText>
                  <ChevronDown
                    color={
                      shelterTypeSummary.count
                        ? colors.textOnColor
                        : colors.textSecondary
                    }
                    size={15}
                    strokeWidth={2.6}
                  />
                </FilterChip>
                <RowDivider />
              </>
            ) : null}
            {visibleAccessibilityOptions.map(item => {
              const selected = selectedAccessibility.includes(item);

              return (
                <FilterChip
                  key={item}
                  $selected={selected}
                  $selectedColor={ACCESSIBILITY_SELECTED_COLOR}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => toggleAccessibility(item)}
                >
                  <FilterChipText $selected={selected}>
                    {translate(accessibilityFilterLabelKeys[item] ?? item)}
                  </FilterChipText>
                </FilterChip>
              );
            })}
          </AccessibilityFilterRow>
        </AccessibilityRow>
      </FilterGroup>

      {showShelterTypes ? (
        <MapFilterSheet
          visible={typeSheetVisible}
          onClose={() => setTypeSheetVisible(false)}
          showAccessibility={false}
        />
      ) : null}
    </FilterSection>
  );
}

const FilterSection = styled.View<{ $horizontalPadding: number }>`
  gap: 10px;
  padding: 0 ${({ $horizontalPadding }) => $horizontalPadding}px;
`;

const FilterGroup = styled.View`
  gap: 8px;
`;

const AccessibilityRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const rowContentStyle = { alignItems: 'center' as const };

// 유형은 시트를 여는 칩, 오른쪽은 바로 켜고 끄는 접근성 칩이라 둘 사이를 갈라 둔다
const RowDivider = styled.View`
  width: 1px;
  height: 20px;
  margin-right: 8px;
  background-color: ${colors.borderStrong};
`;

const AccessibilityFilterRow = styled.ScrollView`
  flex: 1;
  max-height: 46px;
`;

const FilterChip = styled.Pressable<{
  $selected: boolean;
  $selectedColor: string;
}>`
  margin-right: 8px;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border-radius: 999px;
  background-color: ${({ $selected, $selectedColor }) =>
    $selected ? $selectedColor : colors.surface};
`;

const InfoChip = styled.Pressable`
  margin-right: 8px;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border-radius: 999px;
  border-width: 1px;
  border-color: ${colors.primaryBorder};
  background-color: ${colors.primarySoft};
`;

const InfoChipText = styled.Text`
  color: ${colors.primaryPressed};
  font-size: 13px;
  font-weight: 700;
`;

const FilterChipText = styled.Text<{ $selected: boolean }>`
  color: ${({ $selected }) =>
    $selected ? colors.textOnColor : colors.textSecondary};
  font-size: 13px;
  font-weight: 600;
`;
