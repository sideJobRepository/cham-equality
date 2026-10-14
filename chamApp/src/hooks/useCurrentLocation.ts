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

type IosGeolocation =
  typeof import('@react-native-community/geolocation').default;

let iosGeolocation: IosGeolocation | null = null;

// iOS는 안드로이드 전용 ChamLocation 대신 이 라이브러리를 쓴다. 안드로이드엔 연결하지 않아서
// (react-native.config.js) 파일 맨 위에서 import 하면 네이티브 모듈이 없어 바로 죽는다 → iOS에서만 꺼낸다.
function getIosGeolocation() {
  if (!iosGeolocation) {
    iosGeolocation = require('@react-native-community/geolocation')
      .default as IosGeolocation;
    iosGeolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  }
  return iosGeolocation;
}

// 권한 거부 코드(1). iOS는 한 번 거절하면 다시 묻지 않아서 설정 화면 안내('blocked')로 보낸다.
const IOS_PERMISSION_DENIED = 1;

function requestIosLocationPermission(): Promise<PermissionResult> {
  return new Promise(resolve => {
    try {
      getIosGeolocation().requestAuthorization(
        () => resolve('granted'),
        error =>
          resolve(error.code === IOS_PERMISSION_DENIED ? 'blocked' : null),
      );
    } catch {
      resolve(null);
    }
  });
}

// ChamLocation 과 같은 모양({lat, lng, accuracy})과 오류 code 로 맞춘다.
function getIosCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    getIosGeolocation().getCurrentPosition(
      position =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      error =>
        reject({
          code:
            error.code === error.POSITION_UNAVAILABLE
              ? 'LOCATION_PROVIDER_DISABLED'
              : 'LOCATION_UNAVAILABLE',
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2 * 60 * 1000 },
    );
  });
}

function getNativeCurrentLocation() {
  if (Platform.OS === 'ios') return getIosCurrentLocation();
  if (!ChamLocation) return null;
  return ChamLocation.getCurrentLocation();
}

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
  if (Platform.OS === 'ios') return requestIosLocationPermission();
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

  const locationRequest = getNativeCurrentLocation();
  if (!locationRequest) {
    setUnavailable('');
    return 'unavailable';
  }

  try {
    const nativeLocation = await locationRequest;
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
