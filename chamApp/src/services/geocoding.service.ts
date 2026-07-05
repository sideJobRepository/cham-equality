import api from '../lib/axiosInstance.ts';
import type { UserLocation } from '../store/location.ts';

export function fetchReverseGeocoding(location: UserLocation, lang: string) {
  return api
    .get('/api/geocoding/reverse', {
      params: {
        x: location.lng,
        y: location.lat,
        lang,
      },
    })
    .then(res => res.data.data as string);
}
