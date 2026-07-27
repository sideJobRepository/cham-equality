import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import { CircleHelp } from 'lucide-react-native';
import {
  ACCESSIBILITY_ALL_LABEL,
  ACCESSIBILITY_SELECTED_COLOR,
  SHELTER_SELECTED_COLOR,
  accessibilityFilterLabelKeys,
  accessibilityOptions,
  shelterTypeFilterLabelKeys,
  shelterTypeOptions,
  useMapFilterStore,
} from '../store/mapFilters.ts';

interface MapSearchFiltersProps {
  horizontalPadding?: number;
  showShelterTypes?: boolean;
  showAccessibilityAll?: boolean;
  onPressAccessibilityInfo?: () => void;
}

export default function MapSearchFilters({
  horizontalPadding = 20,
  showShelterTypes = true,
  showAccessibilityAll = true,
  onPressAccessibilityInfo,
}: MapSearchFiltersProps) {
  const { t } = useTranslation();
  const selectedShelterTypes = useMapFilterStore(
    state => state.selectedShelterTypes,
  );
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const toggleShelterType = useMapFilterStore(state => state.toggleShelterType);
  const toggleAccessibility = useMapFilterStore(
    state => state.toggleAccessibility,
  );
  const openAccessibilityInfo = () => {
    console.log('[accessibility-info] open pressed');
    onPressAccessibilityInfo?.();
  };
  const visibleAccessibilityOptions = useMemo(
    () =>
      accessibilityOptions.filter(item => item !== ACCESSIBILITY_ALL_LABEL),
    [],
  );

  return (
    <FilterSection $horizontalPadding={horizontalPadding}>
      {showShelterTypes ? (
        <FilterGroup>
          <FilterRow horizontal showsHorizontalScrollIndicator={false}>
            {shelterTypeOptions.map(item => (
              <FilterChip
                key={item}
                $selected={selectedShelterTypes.includes(item)}
                $selectedColor={SHELTER_SELECTED_COLOR}
                onPress={() => toggleShelterType(item)}
              >
                <FilterChipText $selected={selectedShelterTypes.includes(item)}>
                  {t(shelterTypeFilterLabelKeys[item] ?? item)}
                </FilterChipText>
              </FilterChip>
            ))}
          </FilterRow>
        </FilterGroup>
      ) : null}

      <FilterGroup>
        <AccessibilityRow>
          {showAccessibilityAll ? (
            <InfoChip
              onPress={openAccessibilityInfo}
              accessibilityLabel={t('map.accessibilityInfo.label')}
              hitSlop={8}
            >
              <InfoChipText>{t('map.accessibilityInfo.label')}</InfoChipText>
              <CircleHelp color="#1d4ed8" size={17} strokeWidth={2.5} />
            </InfoChip>
          ) : null}
          <AccessibilityFilterRow horizontal showsHorizontalScrollIndicator={false}>
          {visibleAccessibilityOptions.map(item => {
            const selected = selectedAccessibility.includes(item);

            return (
              <FilterChip
                key={item}
                $selected={selected}
                $selectedColor={ACCESSIBILITY_SELECTED_COLOR}
                onPress={() => toggleAccessibility(item)}
              >
                <FilterChipText $selected={selected}>
                  {t(accessibilityFilterLabelKeys[item] ?? item)}
                </FilterChipText>
              </FilterChip>
            );
          })}
          </AccessibilityFilterRow>
        </AccessibilityRow>
      </FilterGroup>
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

const FilterRow = styled.ScrollView`
  max-height: 46px;
`;

const AccessibilityRow = styled.View`
  flex-direction: row;
  align-items: center;
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
    $selected ? $selectedColor : '#ffffff'};
`;

const InfoChip = styled.Pressable`
  margin-right: 8px;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border-radius: 999px;
  border-width: 1px;
  border-color: #bfdbfe;
  background-color: #eff6ff;
`;

const InfoChipText = styled.Text`
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
`;

const FilterChipText = styled.Text<{ $selected: boolean }>`
  color: ${({ $selected }) => ($selected ? '#ffffff' : '#374151')};
  font-size: 13px;
  font-weight: 600;
`;
