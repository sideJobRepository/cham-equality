import { create } from 'zustand';
import type { Article } from './menu';

interface ArticleState {
  articles: Article[];
  setArticles: (list: Article[]) => void;
  clearArticles: () => void;
}

export const useArticleStore = create<ArticleState>(set => ({
  articles: [],
  setArticles: list => set({ articles: list }),
  clearArticles: () => set({ articles: [] }),
}));
