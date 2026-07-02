import { create } from 'zustand';

interface SMSMessage {
  category: string;
  content: string;
  emergencyStep: string;
  emergencyStepLabel: string;
  id: number;
  issuedAt: string;
  regionName: string;
  sn: number;
}

interface SMSStore {
  sms: SMSMessage[];
  setSMS: (sms: SMSMessage[]) => void;
  clearSMS: () => void;
}

export const useSMSStore = create<SMSStore>(set => ({
  sms: [],
  setSMS: sms => set({ sms }),
  clearSMS: () => set({ sms: [] }),
}));
