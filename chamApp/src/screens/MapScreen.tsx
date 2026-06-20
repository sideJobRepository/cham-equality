import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Config from 'react-native-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import styled from 'styled-components/native';
import { useFetchMap } from '../services/map.service.ts';
import { useMapStore } from '../store/map.ts';

const shelterTypeOptions = [
  '전체',
  '민방위대피시설',
  '지진대피장소',
  '화학사고대피장소',
  '지진겸용 임시주거시설',
  '이재민 임시주거시설',
];

const accessibilityOptions = [
  '접근성 전체',
  '경사로',
  '엘리베이터',
  '점자블록',
];

const SHELTER_ALL_LABEL = '전체';
const ACCESSIBILITY_ALL_LABEL = '접근성 전체';
const SHELTER_SELECTED_COLOR = '#4aa199';
const ACCESSIBILITY_SELECTED_COLOR = '#5088dc';

type LocationStatus = 'checking' | 'granted' | 'denied' | 'unavailable';
type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
};

const { ChamLocation } = NativeModules as {
  ChamLocation?: {
    getCurrentLocation: () => Promise<UserLocation>;
  };
};

const shelterTypeValueMap: Record<string, string> = {
  민방위대피시설: 'CIVIL_DEFENSE',
  지진대피장소: 'EARTHQUAKE',
  화학사고대피장소: 'CHEMICAL_ACCIDENT',
  '지진겸용 임시주거시설': 'EARTHQUAKE_TEMPORARY_HOUSING',
  '이재민 임시주거시설': 'DISASTER_TEMPORARY_HOUSING',
};

const accessibilityValueMap: Record<string, string> = {
  경사로: 'RAMP',
  엘리베이터: 'ELEVATOR',
  점자블록: 'BRAILLE_BLOCK',
};

const shelterTypeLabelMap: Record<string, string> = {
  CIVIL_DEFENSE: '민방위대피시설',
  EARTHQUAKE: '지진대피장소',
  CHEMICAL_ACCIDENT: '화학사고대피장소',
  EARTHQUAKE_TEMPORARY_HOUSING: '지진겸용 임시주거시설',
  DISASTER_TEMPORARY_HOUSING: '이재민 임시주거시설',
};

function getShelterTypeLabel(type?: string) {
  if (!type) return '유형 정보 없음';
  return shelterTypeLabelMap[type] ?? type;
}

function isKoreaLocation(location: UserLocation) {
  return (
    location.lat >= 32 &&
    location.lat <= 39.5 &&
    location.lng >= 124 &&
    location.lng <= 132.5
  );
}

function getAccessibilityChips(shelter: ShelterSummary) {
  return [
    { label: '경사로', active: shelter.ramp === true },
    { label: '엘리베이터', active: shelter.elevator === true },
    { label: '점자블록', active: shelter.brailleBlock === true },
    { label: '장애인 화장실', active: shelter.accessibleToilet === true },
  ];
}

function getShelterTypeCounts(shelters: ShelterSummary[]) {
  const countMap = shelters.reduce<Record<string, number>>((acc, shelter) => {
    const type = shelter.shelterType ?? 'UNKNOWN';
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(countMap)
    .map(([type, count]) => ({
      type,
      label: getShelterTypeLabel(type),
      count,
    }))
    .sort((a, b) => {
      const order = Object.keys(shelterTypeLabelMap);
      const aIndex = order.indexOf(a.type);
      const bIndex = order.indexOf(b.type);
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
}

function getShelterMetaText(shelter: ShelterSummary) {
  const parts = [
    typeof shelter.capacity === 'number'
      ? `수용 ${shelter.capacity.toLocaleString()}명`
      : null,
    typeof shelter.area === 'number'
      ? `${shelter.area.toLocaleString()}㎡`
      : null,
  ].filter(Boolean);

  return parts.join(' · ') || '규모 정보 없음';
}

async function requestLocationPermission() {
  if (Platform.OS !== 'android') return true;

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
}

interface MapMessageEvent {
  nativeEvent: {
    data: string;
  };
}

interface ShelterSummary {
  shelterId: number;
  name: string;
  shelterType?: string;
  capacity?: number;
  area?: number;
  managingAuthorityName?: string;
  managingAuthorityTelNo?: string;
  accessibleToilet?: boolean;
  ramp?: boolean;
  elevator?: boolean;
  brailleBlock?: boolean;
}

interface SelectedPlace {
  placeId: number;
  name: string;
  address: string;
  description: string;
  shelterCount: number;
  shelters: ShelterSummary[];
}

interface WebMessagePayload {
  type: 'marker' | 'ready' | 'error' | 'viewport' | 'locationAddress';
  payload?: SelectedPlace;
  message?: string;
  address?: string;
  totalCount?: number;
  visibleCount?: number;
  visiblePlaces?: SelectedPlace[];
  center?: {
    lat: number;
    lng: number;
  };
  level?: number;
}

interface MapViewState {
  center: {
    lat: number;
    lng: number;
  };
  level: number;
}

function buildMapHtml(
  mapKey: string,
  mapPayloadJson: string,
  initialViewJson: string,
  userLocationJson: string,
) {
  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #eef4ff;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      window.__MAP_DATA__ = ${mapPayloadJson};
      window.__INITIAL_VIEW__ = ${initialViewJson};
      window.__USER_LOCATION__ = ${userLocationJson};
      window.__notify = function(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };
      window.onerror = function(message) {
        window.__notify({ type: 'error', message: String(message || '지도 초기화 오류') });
      };
    </script>
    <script
      src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${mapKey}&autoload=false&libraries=services"
      onerror="window.__notify({ type: 'error', message: '카카오 지도 SDK 로드 실패' })"
    ></script>
    <script>
      function isKoreaRange(lat, lng) {
        return lat >= 32 && lat <= 39.5 && lng >= 124 && lng <= 132.5;
      }

      function toLatLng(item) {
        const x = Number(item.x);
        const y = Number(item.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

        const direct = { lat: y, lng: x };
        const swapped = { lat: x, lng: y };

        if (isKoreaRange(direct.lat, direct.lng)) return direct;
        if (isKoreaRange(swapped.lat, swapped.lng)) return swapped;
        if (Math.abs(y) <= 90 && Math.abs(x) <= 180) return direct;
        if (Math.abs(x) <= 90 && Math.abs(y) <= 180) return swapped;
        return null;
      }

      function summaryLabel(item) {
        const path = String(item.path || '');
        const last = path.split(' ').filter(Boolean).slice(-1)[0] || path;
        return last + ' ' + item.count;
      }

      function normalizePlace(item) {
        const shelters = Array.isArray(item.shelters) ? item.shelters : [];
        return {
          placeId: item.placeId,
          name: item.name || '대피소',
          address: item.address || item.oldAddress || '',
          description: item.description || '',
          shelterCount: shelters.length,
          shelters: shelters.map(function(shelter) {
            return {
              shelterId: shelter.shelterId,
              name: shelter.name || item.name || '대피소',
              shelterType: shelter.shelterType,
              capacity: shelter.capacity,
              area: shelter.area,
              managingAuthorityName: shelter.managingAuthorityName,
              managingAuthorityTelNo: shelter.managingAuthorityTelNo,
              accessibleToilet: shelter.accessibleToilet,
              ramp: shelter.ramp,
              elevator: shelter.elevator,
              brailleBlock: shelter.brailleBlock,
            };
          }),
        };
      }

      function createSummaryOverlay(map, item, position) {
        const el = document.createElement('div');
        el.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'min-width:56px',
          'height:32px',
          'padding:0 12px',
          'border-radius:999px',
          'background:#2563eb',
          'color:#ffffff',
          'font-size:12px',
          'font-weight:700',
          'box-shadow:0 4px 12px rgba(37,99,235,.28)',
          'white-space:nowrap',
        ].join(';');
        el.textContent = summaryLabel(item);

        return new window.kakao.maps.CustomOverlay({
          map: map,
          position: position,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
        });
      }

      function createDetailOverlay(map, item, position) {
        const el = document.createElement('div');
        el.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'width:14px',
          'height:14px',
          'border-radius:999px',
          'background:#2563eb',
          'border:2px solid #ffffff',
          'box-shadow:0 2px 8px rgba(37,99,235,.35)',
          'cursor:pointer',
        ].join(';');

        el.addEventListener('click', function() {
          window.__notify({
            type: 'marker',
            payload: normalizePlace(item),
          });
        });

        return new window.kakao.maps.CustomOverlay({
          map: map,
          position: position,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
        });
      }

      function renderMap() {
        if (!window.kakao || !window.kakao.maps) {
          window.__notify({ type: 'error', message: '카카오 지도 객체가 없습니다' });
          return;
        }

        const payload = window.__MAP_DATA__ || {};
        const details = Array.isArray(payload.details) ? payload.details : [];
        const summaries = payload.summaries || {};
        const container = document.getElementById('map');
        const initialView = window.__INITIAL_VIEW__ || {};
        const initialCenter = initialView.center || {};
        const centerLat = Number.isFinite(Number(initialCenter.lat))
          ? Number(initialCenter.lat)
          : 36.3504;
        const centerLng = Number.isFinite(Number(initialCenter.lng))
          ? Number(initialCenter.lng)
          : 127.3845;
        const initialLevel = Number.isFinite(Number(initialView.level))
          ? Math.max(1, Math.min(14, Number(initialView.level)))
          : 9;
        const center = new window.kakao.maps.LatLng(centerLat, centerLng);

        const map = new window.kakao.maps.Map(container, {
          center: center,
          level: initialLevel,
          mapTypeId: window.kakao.maps.MapTypeId.ROADMAP,
        });

        map.relayout();
        map.setCenter(center);
        map.setLevel(initialLevel);
        map.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);
        map.addControl(
          new window.kakao.maps.ZoomControl(),
          window.kakao.maps.ControlPosition.RIGHT
        );

        let overlays = [];

        function getUserLocationCoords() {
          const userLocation = window.__USER_LOCATION__;
          if (!userLocation) return null;

          const lat = Number(userLocation.lat);
          const lng = Number(userLocation.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          if (!isKoreaRange(lat, lng)) return null;

          return { lat: lat, lng: lng };
        }

        window.__moveToUserLocation = function() {
          const coords = getUserLocationCoords();
          if (!coords) return;

          const markerPosition = new window.kakao.maps.LatLng(coords.lat, coords.lng);
          map.setCenter(markerPosition);
          map.setLevel(6);
        };

        function drawUserLocation() {
          const coords = getUserLocationCoords();
          if (!coords) return;

          const markerPosition = new window.kakao.maps.LatLng(coords.lat, coords.lng);
          const markerEl = document.createElement('div');
          markerEl.style.cssText = [
            'transform:translate(-50%, -50%)',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'pointer-events:none',
          ].join(';');
          markerEl.innerHTML =
            '<div style="width:22px;height:22px;border-radius:999px;background:#ef4444;border:4px solid #ffffff;box-shadow:0 0 0 6px rgba(239,68,68,.18),0 3px 12px rgba(239,68,68,.45);"></div>';

          new window.kakao.maps.CustomOverlay({
            map: map,
            position: markerPosition,
            content: markerEl,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 10000,
          });
        }

        function notifyUserLocationAddress() {
          const coords = getUserLocationCoords();
          if (!coords) {
            window.__notify({
              type: 'locationAddress',
              address: '주소 확인 실패: 위치 좌표가 없습니다',
            });
            return;
          }

          if (!window.kakao.maps.services || !window.kakao.maps.services.Geocoder) {
            window.__notify({
              type: 'locationAddress',
              address: '주소 확인 실패: Kakao services Geocoder 로드 안 됨',
            });
            return;
          }

          const geocoder = new window.kakao.maps.services.Geocoder();
          const coordText = coords.lat.toFixed(6) + ', ' + coords.lng.toFixed(6);

          function notifyAddressFailure(reason) {
            window.__notify({
              type: 'locationAddress',
              address: '주소 확인 실패: ' + reason + ' (' + coordText + ')',
            });
          }

          function notifyLegalAddress(regionStatusText) {
            geocoder.coord2Address(coords.lng, coords.lat, function(result, status) {
              const resultCount = Array.isArray(result) ? result.length : 0;
              if (status !== window.kakao.maps.services.Status.OK || !result.length) {
                notifyAddressFailure(
                  'region=' + regionStatusText + ', address=' + status + ', addressCount=' + resultCount
                );
                return;
              }

              const first = result[0];
              const address =
                (first.address && first.address.address_name) ||
                (first.road_address && first.road_address.address_name);

              if (address) {
                window.__notify({ type: 'locationAddress', address: address });
              } else {
                notifyAddressFailure(
                  '주소 결과는 있으나 address_name 없음, region=' + regionStatusText + ', address=' + status
                );
              }
            });
          }

          geocoder.coord2RegionCode(coords.lng, coords.lat, function(result, status) {
            const resultCount = Array.isArray(result) ? result.length : 0;
            if (status !== window.kakao.maps.services.Status.OK || !result.length) {
              notifyLegalAddress(status + ', regionCount=' + resultCount);
              return;
            }

            const region = result.find(function(item) {
              return item.region_type === 'H';
            }) || result[0];
            const address = region.address_name || [
              region.region_1depth_name,
              region.region_2depth_name,
              region.region_3depth_name,
            ].filter(Boolean).join(' ');

            if (address) {
              window.__notify({ type: 'locationAddress', address: address });
            } else {
              notifyLegalAddress(status + ', regionCount=' + resultCount + ', region address_name 없음');
            }
          });
        }

        function clearOverlays() {
          overlays.forEach(function(overlay) {
            overlay.setMap(null);
          });
          overlays = [];
        }

        function currentItems(level) {
          if (level <= 6) return { kind: 'detail', items: details };
          if (level <= 8) return { kind: 'summary', items: summaries.depth2 || [] };
          if (level <= 10) return { kind: 'summary', items: summaries.depth1 || [] };
          return { kind: 'summary', items: summaries.depth0 || [] };
        }

        function isInBounds(coords) {
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          return (
            coords.lat >= sw.getLat() &&
            coords.lat <= ne.getLat() &&
            coords.lng >= sw.getLng() &&
            coords.lng <= ne.getLng()
          );
        }

        function currentVisiblePlaces() {
          return details.filter(function(item) {
            const coords = toLatLng(item);
            return coords && isInBounds(coords);
          }).map(normalizePlace);
        }

        function draw() {
          clearOverlays();

          const mode = currentItems(map.getLevel());
          let visibleCount = 0;

          mode.items.forEach(function(item) {
            const coords = toLatLng(item);
            if (!coords) return;
            if (!isInBounds(coords)) return;
            visibleCount += 1;

            const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
            const overlay = mode.kind === 'detail'
              ? createDetailOverlay(map, item, position)
              : createSummaryOverlay(map, item, position);

            overlays.push(overlay);
          });

          const visiblePlaces = currentVisiblePlaces();

          window.__notify({
            type: 'ready',
            totalCount: details.length,
            visibleCount: visibleCount,
            visiblePlaces: visiblePlaces,
          });

        }

        function notifyViewport() {
          const currentCenter = map.getCenter();
          window.__notify({
            type: 'viewport',
            center: {
              lat: currentCenter.getLat(),
              lng: currentCenter.getLng(),
            },
            level: map.getLevel(),
          });
        }

        drawUserLocation();
        notifyUserLocationAddress();
        draw();
        notifyViewport();
        window.kakao.maps.event.addListener(map, 'zoom_changed', draw);
        window.kakao.maps.event.addListener(map, 'idle', function() {
          draw();
          notifyViewport();
        });
      }

      function bootKakaoMap(retryCount) {
        if (
          window.kakao &&
          window.kakao.maps &&
          typeof window.kakao.maps.load === 'function'
        ) {
          window.kakao.maps.load(renderMap);
          return;
        }

        if (retryCount > 40) {
          window.__notify({ type: 'error', message: '카카오 지도 SDK 로드 실패' });
          return;
        }

        setTimeout(function() {
          bootKakaoMap(retryCount + 1);
        }, 100);
      }

      bootKakaoMap(0);
    </script>
  </body>
</html>`;
}

export default function MapScreen() {
  const [selectedShelterTypes, setSelectedShelterTypes] = useState<string[]>([
    SHELTER_ALL_LABEL,
  ]);
  const [selectedAccessibility, setSelectedAccessibility] = useState<string[]>([
    ACCESSIBILITY_ALL_LABEL,
  ]);
  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>('checking');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationErrorMessage, setLocationErrorMessage] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  useEffect(() => {
    async function loadLocation() {
      const granted = await requestLocationPermission();
      if (!granted) {
        setLocationStatus('denied');
        return;
      }

      setLocationStatus('checking');
      setLocationErrorMessage('');
      setLocationAddress('');

      if (!ChamLocation) {
        setLocationStatus('unavailable');
        setLocationErrorMessage('위치 모듈을 사용할 수 없습니다');
        return;
      }

      try {
        const location = await ChamLocation.getCurrentLocation();
        if (!isKoreaLocation(location)) {
          setUserLocation(null);
          setLocationStatus('unavailable');
          setLocationAddress('');
          setLocationErrorMessage(
            `현재 위치 좌표가 한국 범위 밖입니다 (${location.lat.toFixed(
              4,
            )}, ${location.lng.toFixed(4)})`,
          );
          return;
        }

        setUserLocation(location);
        setLocationStatus('granted');
        setLocationAddress(location.address ?? '');
        setLocationErrorMessage('');
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '현재 위치를 확인할 수 없습니다';
        setLocationStatus('unavailable');
        setLocationAddress('');
        setLocationErrorMessage(message);
      }
    }

    loadLocation();
  }, []);

  const mapRequestBody = useMemo(() => {
    const shelterTypes = selectedShelterTypes
      .filter(item => item !== SHELTER_ALL_LABEL)
      .map(item => shelterTypeValueMap[item])
      .filter(Boolean);

    const accessibilityFeatures = selectedAccessibility
      .filter(item => item !== ACCESSIBILITY_ALL_LABEL)
      .map(item => accessibilityValueMap[item])
      .filter(Boolean);

    return {
      ...(shelterTypes.length ? { shelterTypes } : {}),
      ...(accessibilityFeatures.length ? { accessibilityFeatures } : {}),
    };
  }, [selectedAccessibility, selectedShelterTypes]);

  useFetchMap({
    body: mapRequestBody,
    refreshOnFocus: true,
  });
  const mapData = useMapStore(state => state.map);
  console.log('mapData', mapData);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );

  console.log('selectedPlace', selectedPlace);

  const [visiblePlaces, setVisiblePlaces] = useState<SelectedPlace[]>([]);
  const [mapError, setMapError] = useState('');
  const [panelReady, setPanelReady] = useState(false);
  const mapViewRef = useRef<MapViewState | null>(null);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    setSelectedPlace(null);
    setVisiblePlaces([]);
    setPanelReady(false);
  }, [mapData]);

  useEffect(() => {
    if (locationStatus !== 'granted' || !userLocation || locationAddress) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setLocationAddress('주소 확인 실패: Kakao Geocoder 콜백 없음');
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [locationAddress, locationStatus, userLocation]);

  const mapHtml = useMemo(() => {
    const mapKey =
      Config.KAKAO_MAP_APP_KEY ?? Config.KAKAO_NATIVE_APP_KEY ?? '';
    if (!mapKey) return '';

    const payload = {
      details: Object.values(mapData?.details ?? {}),
      summaries: mapData?.summaries ?? {},
    };

    return buildMapHtml(
      mapKey,
      JSON.stringify(payload),
      JSON.stringify(mapViewRef.current),
      JSON.stringify(userLocation),
    );
  }, [mapData, userLocation]);

  const webViewSource = useMemo(() => ({ html: mapHtml }), [mapHtml]);

  const handleMessage = (event: MapMessageEvent) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data) as WebMessagePayload;

      if (parsed.type === 'marker' && parsed.payload) {
        setSelectedPlace(parsed.payload);
        return;
      }

      if (parsed.type === 'error') {
        setMapError(parsed.message ?? '지도 로드에 실패했습니다.');
        return;
      }

      if (parsed.type === 'locationAddress' && parsed.address) {
        console.log('locationAddress', parsed.address);
        if (locationAddress && parsed.address.startsWith('주소 확인 실패')) {
          return;
        }
        setLocationAddress(parsed.address);
        return;
      }

      if (parsed.type === 'ready') {
        setMapError('');
        setVisiblePlaces(parsed.visiblePlaces ?? []);
        setPanelReady(true);
        return;
      }

      if (
        parsed.type === 'viewport' &&
        parsed.center &&
        Number.isFinite(parsed.center.lat) &&
        Number.isFinite(parsed.center.lng) &&
        Number.isFinite(parsed.level)
      ) {
        mapViewRef.current = {
          center: parsed.center,
          level: parsed.level,
        };
        return;
      }
    } catch {
      // no-op
    }
  };

  const handleShelterTypePress = (item: string) => {
    setSelectedPlace(null);

    if (item === SHELTER_ALL_LABEL) {
      setSelectedShelterTypes([SHELTER_ALL_LABEL]);
      return;
    }

    setSelectedShelterTypes(prev => {
      const next = prev.filter(value => value !== SHELTER_ALL_LABEL);

      if (next.includes(item)) {
        const filtered = next.filter(value => value !== item);
        return filtered.length ? filtered : [SHELTER_ALL_LABEL];
      }

      return [...next, item];
    });
  };

  const handleAccessibilityPress = (item: string) => {
    setSelectedPlace(null);

    if (item === ACCESSIBILITY_ALL_LABEL) {
      setSelectedAccessibility([ACCESSIBILITY_ALL_LABEL]);
      return;
    }

    setSelectedAccessibility(prev => {
      const next = prev.filter(value => value !== ACCESSIBILITY_ALL_LABEL);

      if (next.includes(item)) {
        const filtered = next.filter(value => value !== item);
        return filtered.length ? filtered : [ACCESSIBILITY_ALL_LABEL];
      }

      return [...next, item];
    });
  };

  const handleMoveToUserLocation = () => {
    webViewRef.current?.injectJavaScript(`
      if (window.__moveToUserLocation) {
        window.__moveToUserLocation();
      }
      true;
    `);
  };

  const locationStatusText =
    locationStatus === 'checking'
      ? '현재 위치 확인 중'
      : locationStatus === 'granted'
      ? locationAddress || '현재 위치 주소 확인 중'
      : locationStatus === 'denied'
      ? '위치 권한이 필요합니다'
      : locationErrorMessage || '현재 위치를 확인할 수 없습니다';

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Header>
        <HeaderRow>
          <Description numberOfLines={1}>
            {locationStatusText}
          </Description>
          {locationStatus === 'granted' && userLocation ? (
            <LocationButton onPress={handleMoveToUserLocation}>
              <LocationButtonText>내 위치 주변 보기</LocationButtonText>
            </LocationButton>
          ) : null}
        </HeaderRow>
      </Header>

      <FilterSection>
        <FilterGroup>
          <FilterRow horizontal showsHorizontalScrollIndicator={false}>
            {shelterTypeOptions.map(item => (
              <FilterChip
                key={item}
                $selected={selectedShelterTypes.includes(item)}
                $selectedColor={SHELTER_SELECTED_COLOR}
                onPress={() => handleShelterTypePress(item)}
              >
                <FilterChipText $selected={selectedShelterTypes.includes(item)}>
                  {item}
                </FilterChipText>
              </FilterChip>
            ))}
          </FilterRow>
        </FilterGroup>

        <FilterGroup>
          <FilterRow horizontal showsHorizontalScrollIndicator={false}>
            {accessibilityOptions.map(item => (
              <FilterChip
                key={item}
                $selected={selectedAccessibility.includes(item)}
                $selectedColor={ACCESSIBILITY_SELECTED_COLOR}
                onPress={() => handleAccessibilityPress(item)}
              >
                <FilterChipText
                  $selected={selectedAccessibility.includes(item)}
                >
                  {item}
                </FilterChipText>
              </FilterChip>
            ))}
          </FilterRow>
        </FilterGroup>
      </FilterSection>

      <MapFrame>
        {mapHtml ? (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={webViewSource}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            onError={() => setMapError('로드에 실패했습니다.')}
            renderLoading={() => (
              <LoadingBox>
                <ActivityIndicator color="#2563eb" />
              </LoadingBox>
            )}
          />
        ) : (
          <EmptyText>
            카카오 지도 키가 없어 지도를 표시할 수 없습니다.
          </EmptyText>
        )}
      </MapFrame>

      {mapError ? <ErrorText>{mapError}</ErrorText> : null}

      <BottomPanel>
        {selectedPlace ? (
          <>
            <PanelHeader>
              <BackButton onPress={() => setSelectedPlace(null)}>
                <BackButtonText>뒤로</BackButtonText>
              </BackButton>
              <PanelTitle numberOfLines={1}>{selectedPlace.name}</PanelTitle>
            </PanelHeader>

            <DetailAddress numberOfLines={2}>
              {selectedPlace.address || '주소 정보 없음'}
            </DetailAddress>
            {selectedPlace.description ? (
              <DetailDescription numberOfLines={2}>
                {selectedPlace.description}
              </DetailDescription>
            ) : null}
            <DetailMeta>대피소 {selectedPlace.shelterCount}개</DetailMeta>

            <PanelScroll showsVerticalScrollIndicator={false}>
              {selectedPlace.shelters.length ? (
                selectedPlace.shelters.map(shelter => (
                  <ShelterItem key={String(shelter.shelterId)}>
                    <ShelterTitleRow>
                      <ShelterName>{shelter.name}</ShelterName>
                      <TypeChip>
                        <TypeChipText>
                          {getShelterTypeLabel(shelter.shelterType)}
                        </TypeChipText>
                      </TypeChip>
                    </ShelterTitleRow>
                    <ShelterMeta>{getShelterMetaText(shelter)}</ShelterMeta>
                    <ShelterMeta>
                      {[
                        shelter.managingAuthorityName,
                        shelter.managingAuthorityTelNo,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '관리기관 정보 없음'}
                    </ShelterMeta>
                    <ChipRow>
                      {getAccessibilityChips(shelter).map(chip => (
                        <AccessChip
                          key={`${shelter.shelterId}-${chip.label}`}
                          $active={chip.active}
                        >
                          <AccessChipText $active={chip.active}>
                            {chip.label}
                          </AccessChipText>
                        </AccessChip>
                      ))}
                    </ChipRow>
                  </ShelterItem>
                ))
              ) : (
                <EmptyPanelText>연결된 대피소가 없습니다.</EmptyPanelText>
              )}
            </PanelScroll>
          </>
        ) : (
          <>
            <PanelHeader>
              <PanelCount>총 대피소 {visiblePlaces.length}</PanelCount>
            </PanelHeader>

            <PanelScroll showsVerticalScrollIndicator={false}>
              {!mapData || !panelReady ? (
                <PanelLoading>
                  <ActivityIndicator color="#2563eb" />
                  <PanelLoadingText>대피소 정보를 불러오는 중</PanelLoadingText>
                </PanelLoading>
              ) : visiblePlaces.length ? (
                visiblePlaces.map(place => (
                  <PlaceItem
                    key={String(place.placeId)}
                    onPress={() => setSelectedPlace(place)}
                  >
                    <PlaceName numberOfLines={1}>{place.name}</PlaceName>
                    <PlaceAddress numberOfLines={1}>
                      {place.address || '주소 정보 없음'}
                    </PlaceAddress>
                    <ChipRow>
                      {getShelterTypeCounts(place.shelters).map(item => (
                        <TypeCountChip key={`${place.placeId}-${item.type}`}>
                          <TypeCountText>
                            {item.label} {item.count}개
                          </TypeCountText>
                        </TypeCountChip>
                      ))}
                    </ChipRow>
                  </PlaceItem>
                ))
              ) : (
                <EmptyPanelText>
                  현재 화면에 표시할 대피소가 없습니다.
                </EmptyPanelText>
              )}
            </PanelScroll>
          </>
        )}
      </BottomPanel>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: #f4f7fb;
`;

const Header = styled.View`
  padding: 20px 20px 12px;
`;

const HeaderRow = styled.View`
  min-height: 34px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const Description = styled.Text`
  flex: 1;
  color: #6b7280;
  font-size: 12px;
`;

const LocationButton = styled.Pressable`
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: 999px;
  background-color: #ef4444;
`;

const LocationButtonText = styled.Text`
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
`;

const FilterSection = styled.View`
  gap: 10px;
  padding: 0 20px;
`;

const FilterGroup = styled.View`
  gap: 8px;
`;

const FilterRow = styled.ScrollView`
  max-height: 46px;
`;

const FilterChip = styled.Pressable<{
  $selected: boolean;
  $selectedColor: string;
}>`
  margin-right: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background-color: ${({ $selected, $selectedColor }) =>
    $selected ? $selectedColor : '#ffffff'};
`;

const FilterChipText = styled.Text<{ $selected: boolean }>`
  color: ${({ $selected }) => ($selected ? '#ffffff' : '#374151')};
  font-size: 13px;
  font-weight: 600;
`;

const MapFrame = styled.View`
  flex: 6;
  overflow: hidden;
  margin: 10px 12px 0;
  border-radius: 18px;
  background-color: #dbeafe;
`;

const LoadingBox = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: #eef4ff;
`;

const EmptyText = styled.Text`
  padding: 24px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
`;

const ErrorText = styled.Text`
  margin: 6px 12px 0;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
`;

const BottomPanel = styled.View`
  flex: 4;
  gap: 6px;
  margin: 6px 12px 0;
  padding: 10px;
  border-radius: 16px;
  background-color: #ffffff;
  min-height: 0;
`;

const PanelHeader = styled.View`
  min-height: 26px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const PanelTitle = styled.Text`
  flex: 1;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
`;

const PanelCount = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  margin-left: auto;
`;

const BackButton = styled.Pressable`
  padding: 4px 8px;
  border-radius: 999px;
  background-color: #eff6ff;
`;

const BackButtonText = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
`;

const PanelScroll = styled.ScrollView`
  flex: 1;
`;

const PanelLoading = styled.View`
  flex: 1;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const PanelLoadingText = styled.Text`
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
`;

const PlaceItem = styled.Pressable`
  gap: 4px;
  padding: 9px 0;
  border-bottom-width: 1px;
  border-bottom-color: #eef2f7;
`;

const PlaceName = styled.Text`
  color: #111827;
  font-size: 15px;
  font-weight: 800;
`;

const PlaceAddress = styled.Text`
  color: #4b5563;
  font-size: 13px;
  line-height: 18px;
`;

const DetailAddress = styled.Text`
  color: #4b5563;
  font-size: 13px;
  line-height: 18px;
`;

const DetailDescription = styled.Text`
  color: #374151;
  font-size: 13px;
  line-height: 18px;
`;

const DetailMeta = styled.Text`
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
`;

const ShelterItem = styled.View`
  gap: 5px;
  margin-bottom: 8px;
  padding: 10px;
  border-radius: 12px;
  background-color: #f8fafc;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const ShelterTitleRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const ShelterName = styled.Text`
  width: 100%;
  color: #111827;
  font-size: 14px;
  line-height: 19px;
  font-weight: 800;
`;

const ShelterMeta = styled.Text`
  color: #4b5563;
  font-size: 12px;
  line-height: 18px;
`;

const ChipRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
`;

const TypeChip = styled.View`
  padding: 4px 7px;
  border-radius: 999px;
  background-color: #eff6ff;
`;

const TypeChipText = styled.Text`
  color: #2563eb;
  font-size: 10px;
  font-weight: 800;
`;

const TypeCountChip = styled.View`
  padding: 5px 8px;
  border-radius: 999px;
  background-color: #eefbf8;
`;

const TypeCountText = styled.Text`
  color: #15803d;
  font-size: 11px;
  font-weight: 800;
`;

const AccessChip = styled.View<{ $active: boolean }>`
  padding: 5px 7px;
  border-radius: 999px;
  background-color: ${({ $active }) => ($active ? '#fff7ed' : '#f3f4f6')};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? '#fed7aa' : '#e5e7eb')};
`;

const AccessChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#c2410c' : '#9ca3af')};
  font-size: 10px;
  font-weight: 800;
`;

const EmptyPanelText = styled.Text`
  padding: 18px 0;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
`;
