import { create } from 'zustand';

interface Disaster {
  createDate: string;
  originTitle: string;
  originUrl: string;
  summary: string[];
}

interface DisasterStore {
  disaster: Disaster | null;
  setDisaster: (disaster: Disaster) => void;
  clearDisaster: () => void;
}

export const useDisasterStore = create<DisasterStore>(set => ({
  disaster: null,
  setDisaster: disaster => set({ disaster }),
  clearDisaster: () => set({ disaster: null }),
}));
