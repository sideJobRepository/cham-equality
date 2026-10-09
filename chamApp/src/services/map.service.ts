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
  const setFetching = useMapStore(state => state.setFetching);
  const setFetchError = useMapStore(state => state.setFetchError);
  const abortRef = useRef<AbortController | null>(null);
  const isFirstFetchRef = useRef(true);

  const fetchMap = useCallback(() => {
    // 늦게 도착한 옛 필터의 응답이 최신 결과를 덮어쓰지 않도록 이전 요청은 취소한다.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setFetching(true);
    setFetchError(false);

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
        // 필터 칩을 누를 때마다 화면 전체 로딩이 덮지 않게 한다. 지도 귀퉁이에 따로 표시한다.
        disableLoading: true,
        // 실패는 지도 패널에 오류와 다시 시도 버튼으로 보여준다. 알림까지 띄우면 중복이다.
        disableAlert: true,
      },
    )
      .catch(() => {
        // 취소된 요청은 useRequest 가 걸러 여기로 오지 않는다. 최신 요청의 실패만 표시한다.
        if (abortRef.current === controller) setFetchError(true);
      })
      .finally(() => {
        // 더 새로운 요청이 이어받았으면 그 요청이 끝날 때 끈다.
        if (abortRef.current === controller) setFetching(false);
      });
  }, [i18n.language, options?.body, request, setFetchError, setFetching, setMap]);

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

/**
 * 장소 부지 경계(GeoJSON geometry 문자열). 경계가 없으면 null.
 * 지도 목록 응답을 가볍게 두려고 선택한 장소만 따로 받는다.
 */
export async function fetchPlaceBoundary(placeId: number): Promise<string | null> {
  const res = await api.get(`/api/places/${placeId}/boundary`);
  return res.data.data?.geoJson ?? null;
}
