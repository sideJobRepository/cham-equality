import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';
import { useRequest } from '../hooks/useRequest.ts';
import api from '../lib/axiosInstance.ts';
import { useMapStore } from '../store/map.ts';
import { useLocationStore } from '../store/location.ts';
import { useNearestShelterStore } from '../store/nearestShelter.ts';
import {
  ACCESSIBILITY_ALL_LABEL,
  accessibilityValueMap,
  useMapFilterStore,
} from '../store/mapFilters.ts';

interface UseFetchMapOptions {
  body?: {
    shelterTypes?: string[];
    accessibilityFeatures?: string[];
  };
  refreshOnFocus?: boolean;
}

export function useFetchMap(options?: UseFetchMapOptions) {
  const { request } = useRequest();
  const { i18n } = useTranslation();
  const setMap = useMapStore(state => state.setMap);

  const fetchMap = useCallback(() => {
    request(
      () =>
        api
          .post(`/api/shelters/map`, options?.body ?? {}, {
            params: { lang: i18n.language },
          })
          .then(res => res.data.data),
      setMap,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [i18n.language, options?.body, request, setMap]);

  useRefreshOnFocus(fetchMap, options?.refreshOnFocus ?? false);

  return fetchMap;
}

export function useFetchNearestShelter() {
  const { request } = useRequest();
  const { i18n } = useTranslation();
  const location = useLocationStore(state => state.location);
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const setNearestShelter = useNearestShelterStore(
    state => state.setNearestShelter,
  );
  const clearNearestShelter = useNearestShelterStore(
    state => state.clearNearestShelter,
  );

  const fetchNearestShelter = useCallback(() => {
    if (!location) {
      clearNearestShelter();
      return;
    }

    const accessibilityFeatures = selectedAccessibility
      .filter(item => item !== ACCESSIBILITY_ALL_LABEL)
      .map(item => accessibilityValueMap[item])
      .filter(Boolean);

    request(
      () =>
        api
          .post(
            '/api/shelters/map/nearest',
            {
              accessibilityFeatures,
              x: location.lng,
              y: location.lat,
            },
            {
              params: { lang: i18n.language },
            },
          )
          .then(res => res.data.data),
      setNearestShelter,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [
    clearNearestShelter,
    i18n.language,
    location,
    request,
    selectedAccessibility,
    setNearestShelter,
  ]);

  useRefreshOnFocus(fetchNearestShelter);

  return fetchNearestShelter;
}
