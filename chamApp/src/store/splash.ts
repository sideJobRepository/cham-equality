import { create } from 'zustand';

// 스플래시가 완전히 걷혔는지. 홈의 안내 팝업처럼 앱 시작 직후 뜨는 모달이
// 스플래시 위로 먼저 튀어나오지 않도록 이 값을 보고 기다린다.
interface SplashStore {
  done: boolean;
  setDone: () => void;
}

export const useSplashStore = create<SplashStore>(set => ({
  done: false,
  setDone: () => set({ done: true }),
}));
