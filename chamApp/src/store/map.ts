import { create } from 'zustand';

interface MapStore {
  map: any;
  isFetching: boolean;
  // 마지막 목록 요청이 실패했는지. 패널에 오류와 다시 시도 버튼을 띄우는 데 쓴다.
  fetchError: boolean;
  setMap: (sms: any) => void;
  setFetching: (isFetching: boolean) => void;
  setFetchError: (fetchError: boolean) => void;
  clearMap: () => void;
}

export const useMapStore = create<MapStore>(set => ({
  map: null,
  isFetching: false,
  fetchError: false,
  setMap: map => set({ map }),
  setFetching: isFetching => set({ isFetching }),
  setFetchError: fetchError => set({ fetchError }),
  clearMap: () => set({ map: null }),
}));
