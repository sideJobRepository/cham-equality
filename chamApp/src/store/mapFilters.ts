import { create } from 'zustand';

export const shelterTypeOptions = [
  '전체',
  '민방위대피시설',
  '지진대피장소',
  '화학사고대피장소',
  '지진겸용 임시주거시설',
  '이재민 임시주거시설',
];

export const accessibilityOptions = [
  '접근성 전체',
  '경사로',
  '엘리베이터',
  '점자블록',
  '장애인 화장실',
];

export const SHELTER_ALL_LABEL = '전체';
export const ACCESSIBILITY_ALL_LABEL = '접근성 전체';
export const SHELTER_SELECTED_COLOR = '#4aa199';
export const ACCESSIBILITY_SELECTED_COLOR = '#5088dc';

export const shelterTypeFilterLabelKeys: Record<string, string> = {
  전체: 'map.filters.shelterAll',
  민방위대피시설: 'map.filters.civilDefense',
  지진대피장소: 'map.filters.earthquake',
  화학사고대피장소: 'map.filters.chemicalAccident',
  '지진겸용 임시주거시설': 'map.filters.earthquakeTemporaryHousing',
  '이재민 임시주거시설': 'map.filters.disasterTemporaryHousing',
};

export const accessibilityFilterLabelKeys: Record<string, string> = {
  '접근성 전체': 'map.filters.accessibilityAll',
  경사로: 'map.filters.ramp',
  엘리베이터: 'map.filters.elevator',
  점자블록: 'map.filters.brailleBlock',
  '장애인 화장실': 'map.filters.accessibleToilet',
};

export const shelterTypeValueMap: Record<string, string> = {
  민방위대피시설: 'CIVIL_DEFENSE',
  지진대피장소: 'EARTHQUAKE',
  화학사고대피장소: 'CHEMICAL_ACCIDENT',
  '지진겸용 임시주거시설': 'EARTHQUAKE_TEMPORARY_HOUSING',
  '이재민 임시주거시설': 'DISASTER_TEMPORARY_HOUSING',
};

export const accessibilityValueMap: Record<string, string> = {
  경사로: 'RAMP',
  엘리베이터: 'ELEVATOR',
  점자블록: 'BRAILLE_BLOCK',
  '장애인 화장실': 'ACCESSIBLE_TOILET',
};

export const shelterTypeLabelMap: Record<string, string> = {
  CIVIL_DEFENSE: '민방위대피시설',
  EARTHQUAKE: '지진대피장소',
  CHEMICAL_ACCIDENT: '화학사고대피장소',
  EARTHQUAKE_TEMPORARY_HOUSING: '지진겸용 임시주거시설',
  DISASTER_TEMPORARY_HOUSING: '이재민 임시주거시설',
};

export const shelterTypeTranslationKeys: Record<string, string> = {
  CIVIL_DEFENSE: 'map.filters.civilDefense',
  EARTHQUAKE: 'map.filters.earthquake',
  CHEMICAL_ACCIDENT: 'map.filters.chemicalAccident',
  EARTHQUAKE_TEMPORARY_HOUSING: 'map.filters.earthquakeTemporaryHousing',
  DISASTER_TEMPORARY_HOUSING: 'map.filters.disasterTemporaryHousing',
};

interface MapFilterStore {
  selectedShelterTypes: string[];
  selectedAccessibility: string[];
  toggleShelterType: (item: string) => void;
  toggleAccessibility: (item: string) => void;
}

export const useMapFilterStore = create<MapFilterStore>(set => ({
  selectedShelterTypes: [SHELTER_ALL_LABEL],
  selectedAccessibility: [ACCESSIBILITY_ALL_LABEL],
  toggleShelterType: item =>
    set(state => {
      if (item === SHELTER_ALL_LABEL) {
        return { selectedShelterTypes: [SHELTER_ALL_LABEL] };
      }

      const next = state.selectedShelterTypes.filter(
        value => value !== SHELTER_ALL_LABEL,
      );

      if (next.includes(item)) {
        const filtered = next.filter(value => value !== item);
        return {
          selectedShelterTypes: filtered.length
            ? filtered
            : [SHELTER_ALL_LABEL],
        };
      }

      return { selectedShelterTypes: [...next, item] };
    }),
  toggleAccessibility: item =>
    set(state => {
      if (item === ACCESSIBILITY_ALL_LABEL) {
        return { selectedAccessibility: [ACCESSIBILITY_ALL_LABEL] };
      }

      const next = state.selectedAccessibility.filter(
        value => value !== ACCESSIBILITY_ALL_LABEL,
      );

      if (next.includes(item)) {
        const filtered = next.filter(value => value !== item);
        return {
          selectedAccessibility: filtered.length
            ? filtered
            : [ACCESSIBILITY_ALL_LABEL],
        };
      }

      return { selectedAccessibility: [...next, item] };
    }),
}));
