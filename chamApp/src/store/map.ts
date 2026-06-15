import { create } from 'zustand';

interface MapStore {
  map: any;
  setMap: (sms: any) => void;
  clearMap: () => void;
}

export const useMapStore = create<MapStore>(set => ({
  map: null,
  setMap: map => set({ map }),
  clearMap: () => set({ map: null }),
}));
