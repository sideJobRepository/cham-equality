import { useCallback, useEffect, useRef } from 'react';
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

// 필터 칩을 연달아 누를 때 마지막 조합만 요청하려고 기다리는 시간.
const MAP_FETCH_DEBOUNCE_MS = 300;

export function useFetchMap(options?: UseFetchMapOptions) {
  const { request } = useRequest();
  const { i18n } = useTranslation();
  const setMap = useMapStore(state => state.setMap);
  const abortRef = useRef<AbortController | null>(null);
  const isFirstFetchRef = useRef(true);

  const fetchMap = useCallback(() => {
    // 늦게 도착한 옛 필터의 응답이 최신 결과를 덮어쓰지 않도록 이전 요청은 취소한다.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    request(
      () =>
        api
          .post(`/api/shelters/map`, options?.body ?? {}, {
            params: { lang: i18n.language },
            signal: controller.signal,
          })
          .then(res => res.data.data),
      setMap,
      {
        ignoreErrorRedirect: true,
      },
    ).catch(() => {
      // 알림은 useRequest 가 띄운다.
    });
  }, [i18n.language, options?.body, request, setMap]);

  useEffect(() => {
    // 첫 진입은 바로, 이후 필터 변경은 잠깐 모아서 요청한다.
    const delay = isFirstFetchRef.current ? 0 : MAP_FETCH_DEBOUNCE_MS;
    isFirstFetchRef.current = false;
    const timer = setTimeout(fetchMap, delay);
    return () => clearTimeout(timer);
  }, [fetchMap]);

  useEffect(() => () => abortRef.current?.abort(), []);

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
