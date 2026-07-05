import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  InteractionManager,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
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

async function requestLocationPermission() {
  if (Platform.OS !== 'android') return true;

  try {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (hasPermission) return true;

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: '위치 권한 필요',
        message: '현재 위치 주변 대피소를 보여주기 위해 위치 권한이 필요합니다.',
        buttonPositive: '허용',
        buttonNegative: '거부',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return null;
  }
}

export function useCurrentLocation() {
  const { i18n } = useTranslation();
  const currentLocation = useLocationStore(state => state.location);
  const setChecking = useLocationStore(state => state.setChecking);
  const setDenied = useLocationStore(state => state.setDenied);
  const setUnavailable = useLocationStore(state => state.setUnavailable);
  const setLocation = useLocationStore(state => state.setLocation);
  const setAddress = useLocationStore(state => state.setAddress);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadLocation() {
        const granted = await requestLocationPermission();
        if (cancelled) return;

        if (granted === null) {
          setUnavailable('위치 권한 요청을 다시 시도해 주세요');
          return;
        }

        if (!granted) {
          setDenied();
          return;
        }

        setChecking();

        if (!ChamLocation) {
          setUnavailable('위치 모듈을 사용할 수 없습니다');
          return;
        }

        try {
          const nativeLocation = await ChamLocation.getCurrentLocation();
          if (cancelled) return;

          if (!isKoreaLocation(nativeLocation)) {
            setUnavailable(
              `현재 위치 좌표가 한국 범위 밖입니다 (${nativeLocation.lat.toFixed(
                4,
              )}, ${nativeLocation.lng.toFixed(4)})`,
            );
            return;
          }

          setLocation(nativeLocation);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : '현재 위치를 확인할 수 없습니다';
          if (!cancelled) setUnavailable(message);
        }
      }

      const interaction = InteractionManager.runAfterInteractions(loadLocation);

      return () => {
        cancelled = true;
        interaction.cancel();
      };
    }, [setChecking, setDenied, setLocation, setUnavailable]),
  );

  useFocusEffect(
    useCallback(() => {
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
    }, [currentLocation, i18n.language, setAddress]),
  );
}
