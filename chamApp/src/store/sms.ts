import { create } from 'zustand';

interface SMSStore {
  sms: any;
  setSMS: (sms: any) => void;
  clearSMS: () => void;
}

export const useSMSStore = create<SMSStore>(set => ({
  sms: null,
  setSMS: sms => set({ sms }),
  clearSMS: () => set({ sms: null }),
}));
