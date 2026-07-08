import { create } from 'zustand';

export type Language = 'KO' | 'EN' | 'ZH' | 'JA' | 'VI';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>(set => ({
  language: 'KO',
  setLanguage: language => set({ language }),
}));
