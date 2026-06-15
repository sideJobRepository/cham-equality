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

interface SMS {
  active: boolean;
  message: SMSMessage | null;
  referenceTime: string;
}

interface SMSStore {
  sms: SMS | null;
  setSMS: (sms: SMS) => void;
  clearSMS: () => void;
}

export const useSMSStore = create<SMSStore>(set => ({
  sms: null,
  setSMS: sms => set({ sms }),
  clearSMS: () => set({ sms: null }),
}));
