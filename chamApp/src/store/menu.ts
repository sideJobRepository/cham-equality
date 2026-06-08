import { create } from 'zustand';

export interface Article {
  articleId: number;
  articleNo: string;
  articleTitle: string;
  content: string;
  categoryMain: string;
  categorySub: string;
}

export interface Section {
  section: string | null;
  articles: Article[];
}

export interface Chapter {
  chapter: string | null;
  sections: Section[];
}

export interface Part {
  part: string;
  chapters: Chapter[];
}

export interface Legislation {
  id: number;
  title: string;
  billVersion: string;
  parts: Part[];
}

export interface MenuData {
  legislations: Legislation[];
}

interface MenuStore {
  menu: MenuData | null;
  setMenu: (menu: MenuData) => void;
  clearMenu: () => void;
}

export const useMenuStore = create<MenuStore>(set => ({
  menu: null,
  setMenu: menu => set({ menu }),
  clearMenu: () => set({ menu: null }),
}));
