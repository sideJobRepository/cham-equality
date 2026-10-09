import { create } from 'zustand';

export interface NearestShelterImage {
  category?: string;
  url?: string;
}

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
  images: NearestShelterImage[];
}

// 카드가 비어 있을 때 로딩·주변 없음·오류를 구분해 보여주려고 둔다.
// 'empty' 는 조건(접근성 필터)에 맞는 대피소가 없다는 서버 응답(400)이다.
export type NearestShelterStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty'
  | 'error';

interface NearestShelterStore {
  nearestShelter: NearestShelter | null;
  status: NearestShelterStatus;
  setNearestShelter: (nearestShelter: NearestShelter) => void;
  setStatus: (status: NearestShelterStatus) => void;
  clearNearestShelter: (status?: NearestShelterStatus) => void;
}

export const useNearestShelterStore = create<NearestShelterStore>(set => ({
  nearestShelter: null,
  status: 'idle',
  setNearestShelter: nearestShelter => set({ nearestShelter, status: 'ready' }),
  setStatus: status => set({ status }),
  clearNearestShelter: (status = 'idle') =>
    set({ nearestShelter: null, status }),
}));
