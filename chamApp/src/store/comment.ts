import { create } from 'zustand';

interface CommentOpenStore {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCommentStore = create<CommentOpenStore>(set => ({
  open: false,
  setOpen: open => set({ open }),
}));

export interface CommentReply {
  replyId: number;
  content: string;
  memberId: number;
  memberName: string;
  isOwner: boolean;
  registDate: string;
  children: CommentReply[];
}

export interface CommentData {
  articleId: number;
  replies: CommentReply[];
}

interface CommentDataStore {
  comment: CommentData | null;
  setComment: (comment: CommentData | null) => void;
}

export const useCommentDataStore = create<CommentDataStore>(set => ({
  comment: null,
  setComment: comment => set({ comment }),
}));
