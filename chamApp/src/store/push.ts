import { create } from 'zustand';

interface PushStore {
  // 재난문자 푸시를 눌러 앱이 열렸을 때 홈에서 펼쳐 보여줄 문자 id. 홈이 상세 모달을 띄운 뒤 비운다.
  openMessageId: number | null;
  requestOpen: (messageId: number) => void;
  clearOpen: () => void;
  // 제보 결과 푸시를 눌렀을 때 더보기에서 열어 줄 제보 id. 더보기가 상세를 연 뒤 비운다.
  openReportId: number | null;
  requestOpenReport: (reportId: number) => void;
  clearOpenReport: () => void;
  // 더보기의 알림 설정 토글. 기기에 저장되고, 토큰 등록 때 서버에도 같이 보낸다.
  disasterEnabled: boolean;
  personalEnabled: boolean;
  // 저장된 설정을 읽기 전에 토큰을 올리면 기본값이 서버에 먼저 들어가 순서가 꼬일 수 있어 기다린다.
  preferencesRestored: boolean;
  markPreferencesRestored: () => void;
  setPreferences: (preferences: {
    disasterEnabled?: boolean;
    personalEnabled?: boolean;
  }) => void;
}

export const usePushStore = create<PushStore>(set => ({
  openMessageId: null,
  requestOpen: messageId => set({ openMessageId: messageId }),
  clearOpen: () => set({ openMessageId: null }),
  openReportId: null,
  requestOpenReport: reportId => set({ openReportId: reportId }),
  clearOpenReport: () => set({ openReportId: null }),
  disasterEnabled: true,
  personalEnabled: true,
  preferencesRestored: false,
  markPreferencesRestored: () => set({ preferencesRestored: true }),
  setPreferences: preferences => set(preferences),
}));
