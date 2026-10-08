import { useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import i18nInstance from '../i18n';
import { fetchReverseGeocoding } from '../services/geocoding.service.ts';
import {
  type UserLocation,
   useLocationStore,
} from '../store/location.ts';

const { ChamLocation } = NativeModules as {
  ChamLocation?: {
    getCurrentLocation: () => Promise<UserLocation>;
  };
};

function isKoreaLocation(location: UserLocation) {
  return (
    location.lat >= 32 &&
    location.lat <= 39.5 &&
    location.lng >= 124 &&
    location.lng <= 132.5
  );
}

function scheduleIdleTask(task: () => void) {
  const idleApi = globalThis as typeof globalThis & {
    requestIdleCallback?: (callback: () => void) => number;
    cancelIdleCallback?: (id: number) => void;
  };

  if (idleApi.requestIdleCallback) {
    const id = idleApi.requestIdleCallback(task);
    return () => idleApi.cancelIdleCallback?.(id);
  }

  const timeout = setTimeout(task, 0);
  return () => clearTimeout(timeout);
}

type PermissionResult = 'granted' | 'denied' | 'blocked' | null;

async function requestLocationPermission(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') return 'granted';

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (hasPermission) return 'granted';

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: i18nInstance.t('map.location.permissionDialogTitle'),
        message: i18nInstance.t('map.location.permissionDialogMessage'),
        buttonPositive: i18nInstance.t('map.location.allow'),
        buttonNegative: i18nInstance.t('map.location.deny'),
      },
    );

    if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
    // '다시 묻지 않음'이면 시스템 창이 안 뜨므로 설정 화면으로 안내해야 한다.
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
    return 'denied';
  } catch {
    return null;
  }
}

export type LocationLoadResult = 'granted' | 'denied' | 'blocked' | 'unavailable';

// 권한 확인부터 좌표 저장까지. 홈 탭 포커스 때만 돌던 것을 지도 '내 위치' 버튼에서도 다시 부른다.
export async function loadCurrentLocation(
  isCancelled: () => boolean = () => false,
): Promise<LocationLoadResult> {
  const { setChecking, setDenied, setUnavailable, setLocation } =
    useLocationStore.getState();
  const permission = await requestLocationPermission();
  if (isCancelled()) return 'unavailable';

  // 오류 문구는 번역 키로 저장한다. CurrentLocationBar 가 t() 로 풀어서 언어를 바꿔도 따라간다.
  if (permission === null) {
    setUnavailable('map.location.permissionRetry');
    return 'unavailable';
  }

  if (permission !== 'granted') {
    setDenied();
    return permission;
  }

  setChecking();

  if (!ChamLocation) {
    setUnavailable('');
    return 'unavailable';
  }

  try {
    const nativeLocation = await ChamLocation.getCurrentLocation();
    if (isCancelled()) return 'unavailable';

    if (!isKoreaLocation(nativeLocation)) {
      setUnavailable('map.location.outsideKorea');
      return 'unavailable';
    }

    setLocation(nativeLocation);
    return 'granted';
  } catch (error) {
    // 네이티브 모듈 메시지는 한국어 고정이라 쓰지 않고 code 로만 나눈다(빈 값이면 기본 문구).
    const code = (error as { code?: string } | null)?.code;
    if (!isCancelled()) {
      setUnavailable(
        code === 'LOCATION_PROVIDER_DISABLED' ? 'map.location.providerDisabled' : '',
      );
    }
    return 'unavailable';
  }
}

export function useCurrentLocation() {
  const { i18n } = useTranslation();
  const currentLocation = useLocationStore(state => state.location);
  const setAddress = useLocationStore(state => state.setAddress);

  useFocusEffect(
    useCallback(() => {
      if (currentLocation) return undefined;

      let cancelled = false;

      async function loadLocation() {
        await loadCurrentLocation(() => cancelled);
      }

      const cancelIdleTask = scheduleIdleTask(() => {
        loadLocation();
      });

      return () => {
        cancelled = true;
        cancelIdleTask();
      };
    }, [currentLocation]),
  );

  useEffect(() => {
    if (!currentLocation) return undefined;

    const resolvedLocation = currentLocation;
    let cancelled = false;

    async function loadAddress() {
      try {
        const address = await fetchReverseGeocoding(
          resolvedLocation,
          i18n.language,
        );
        if (!cancelled) setAddress(address);
      } catch {
        if (!cancelled) setAddress(resolvedLocation.address ?? '');
      }
    }

    loadAddress();

    return () => {
      cancelled = true;
    };
  }, [currentLocation, i18n.language, setAddress]);
}
