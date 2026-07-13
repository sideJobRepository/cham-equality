import { create } from 'zustand';

export interface Manual {
  id: number;
  language: string;
  title: string;
  createDate: string;
  modifyDate: string;
}

export interface ManualDetail extends Manual {
  content: string;
}

interface ManualStore {
  manuals: Manual[];
  manualDetail: ManualDetail | null;
  setManuals: (manuals: Manual[]) => void;
  setManualDetail: (manualDetail: ManualDetail) => void;
  clearManuals: () => void;
  clearManualDetail: () => void;
}

export const useManualStore = create<ManualStore>(set => ({
  manuals: [],
  manualDetail: null,
  setManuals: manuals => set({ manuals }),
  setManualDetail: manualDetail => set({ manualDetail }),
  clearManuals: () => set({ manuals: [] }),
  clearManualDetail: () => set({ manualDetail: null }),
}));
