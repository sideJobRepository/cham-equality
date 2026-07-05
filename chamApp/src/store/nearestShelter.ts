import { create } from 'zustand';

export interface NearestShelter {
  shelterId: number;
  placeId: number | null;
  name: string;
  x: number;
  y: number;
  area: number | null;
  capacity: number | null;
  shelterType: string;
  builtYear: number | null;
  safetyGrade: number | null;
  description: string | null;
  managingAuthorityName: string | null;
  managingAuthorityTelNo: string | null;
  signageLanguage: string | null;
  accessibleToilet: boolean | null;
  ramp: boolean | null;
  elevator: boolean | null;
  brailleBlock: boolean | null;
  etcFacilities: string | null;
  surveyStatus: string | null;
  accessibilityMatchStatus: string | null;
  images: unknown[];
}

interface NearestShelterStore {
  nearestShelter: NearestShelter | null;
  setNearestShelter: (nearestShelter: NearestShelter) => void;
  clearNearestShelter: () => void;
}

export const useNearestShelterStore = create<NearestShelterStore>(set => ({
  nearestShelter: null,
  setNearestShelter: nearestShelter => set({ nearestShelter }),
  clearNearestShelter: () => set({ nearestShelter: null }),
}));
