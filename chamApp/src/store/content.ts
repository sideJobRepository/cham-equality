import { create } from 'zustand';

export type ContentType =
  | 'IN_APP_POPUP'
  | 'ORGANIZATION_ACTIVITY'
  | 'CITIZEN_PARTICIPATION';

export interface Content {
  id: number;
  contentType: ContentType;
  name: string;
  imageFileId: number | null;
  imageUrl?: string | null;
  url: string | null;
  additionalInfo: string | null;
  displayStartDate: string | null;
  displayEndDate: string | null;
  createDate?: string;
  modifyDate?: string;
}

interface ContentStore {
  contents: Content[];
  setContents: (contents: Content[]) => void;
  clearContents: () => void;
}

export const useContentStore = create<ContentStore>(set => ({
  contents: [],
  setContents: contents => set({ contents }),
  clearContents: () => set({ contents: [] }),
}));
