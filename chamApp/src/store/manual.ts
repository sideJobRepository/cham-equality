import { create } from 'zustand';

export interface Manual {
  id: number;
  language: string;
  title: string;
  createDate: string;
  modifyDate: string;
}

interface ManualStore {
  manuals: Manual[];
  setManuals: (manuals: Manual[]) => void;
  clearManuals: () => void;
}

export const useManualStore = create<ManualStore>(set => ({
  manuals: [],
  setManuals: manuals => set({ manuals }),
  clearManuals: () => set({ manuals: [] }),
}));
