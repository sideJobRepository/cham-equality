import { create } from 'zustand';
import { getDeviceLanguage, type AppLanguage } from '../utils/language';

export type Language = AppLanguage;

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>(set => ({
  language: getDeviceLanguage(),
  setLanguage: language => set({ language }),
}));
