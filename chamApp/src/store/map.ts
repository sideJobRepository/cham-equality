import { create } from 'zustand';

interface MapStore {
  map: any;
  isFetching: boolean;
  setMap: (sms: any) => void;
  setFetching: (isFetching: boolean) => void;
  clearMap: () => void;
}

export const useMapStore = create<MapStore>(set => ({
  map: null,
  isFetching: false,
  setMap: map => set({ map }),
  setFetching: isFetching => set({ isFetching }),
  clearMap: () => set({ map: null }),
}));
