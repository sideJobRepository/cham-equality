import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';
import {
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
}

export default function MapSearchFilters({
  horizontalPadding = 20,
  showShelterTypes = true,
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
        <FilterRow horizontal showsHorizontalScrollIndicator={false}>
          {accessibilityOptions.map(item => (
            <FilterChip
              key={item}
              $selected={selectedAccessibility.includes(item)}
              $selectedColor={ACCESSIBILITY_SELECTED_COLOR}
              onPress={() => toggleAccessibility(item)}
            >
              <FilterChipText $selected={selectedAccessibility.includes(item)}>
                {t(accessibilityFilterLabelKeys[item] ?? item)}
              </FilterChipText>
            </FilterChip>
          ))}
        </FilterRow>
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

const FilterChip = styled.Pressable<{
  $selected: boolean;
  $selectedColor: string;
}>`
  margin-right: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background-color: ${({ $selected, $selectedColor }) =>
    $selected ? $selectedColor : '#ffffff'};
`;

const FilterChipText = styled.Text<{ $selected: boolean }>`
  color: ${({ $selected }) => ($selected ? '#ffffff' : '#374151')};
  font-size: 13px;
  font-weight: 600;
`;
