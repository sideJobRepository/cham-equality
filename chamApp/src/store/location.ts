import { create } from 'zustand';

export type LocationStatus = 'checking' | 'granted' | 'denied' | 'unavailable';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface LocationStore {
  status: LocationStatus;
  location: UserLocation | null;
  address: string;
  errorMessage: string;
  setChecking: () => void;
  setDenied: () => void;
  setUnavailable: (message: string) => void;
  setLocation: (location: UserLocation) => void;
  setAddress: (address: string) => void;
}

export const useLocationStore = create<LocationStore>(set => ({
  status: 'checking',
  location: null,
  address: '',
  errorMessage: '',
  setChecking: () =>
    set({
      status: 'checking',
      errorMessage: '',
    }),
  setDenied: () =>
    set({
      status: 'denied',
      location: null,
      address: '',
      errorMessage: '',
    }),
  setUnavailable: message =>
    set({
      status: 'unavailable',
      errorMessage: message,
    }),
  setLocation: location =>
    set({
      status: 'granted',
      location,
      errorMessage: '',
    }),
  setAddress: address =>
    set({
      address,
    }),
}));
