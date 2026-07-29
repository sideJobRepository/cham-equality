import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import Config from 'react-native-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  ImagePlus,
  Send,
  Square,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import CurrentLocationBar from '../components/CurrentLocationBar.tsx';
import MapSearchFilters from '../components/MapSearchFilters.tsx';
import { useFetchMap } from '../services/map.service.ts';
import type { ShelterImageCategory } from '../services/report.service.ts';
import { useMapStore } from '../store/map.ts';
import { useLocationStore } from '../store/location.ts';
import { useShelterReportStore } from '../store/shelterReport.ts';
import { useUserStore } from '../store/user.ts';
import { useDialogUtil } from '../utils/dialog';
import {
  ACCESSIBILITY_ALL_LABEL,
  ACCESSIBILITY_SELECTED_COLOR,
  SHELTER_ALL_LABEL,
  SHELTER_SELECTED_COLOR,
  accessibilityFilterLabelKeys,
  accessibilityValueMap,
  shelterTypeLabelMap,
  shelterTypeTranslationKeys,
  shelterTypeValueMap,
  useMapFilterStore,
} from '../store/mapFilters.ts';
import type { RootTabParamList } from '../navigation/AppNavigator.tsx';

const defaultShelterImage = require('../assets/images/shelter.png') as ImageSourcePropType;
const reportModalScrollContentStyle = { flexGrow: 1 };

function getShelterTypeLabel(type?: string) {
  if (!type) return '유형 정보 없음';
  return shelterTypeLabelMap[type] ?? type;
}

function getShelterTypeTranslationKey(type?: string) {
  if (!type) return null;
  return shelterTypeTranslationKeys[type] ?? null;
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
  etcFacilities?: string;
  images?: ShelterImage[];
}

interface ShelterImage {
  category?: string;
  url?: string;
}

interface SelectedPlace {
  placeId: number;
  name: string;
  address: string;
  description: string;
  shelterCount: number;
  accessibilityMatchStatus?: string;
  shelters: ShelterSummary[];
}

interface ShelterReportForm {
  accessibleToilet: boolean;
  ramp: boolean;
  elevator: boolean;
  brailleBlock: boolean;
  etcFacilities: string;
  images: ReportLocalImage[];
}

interface ReportLocalImage {
  id: string;
  uri: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  category: ShelterImageCategory;
  description: string;
  base64?: string;
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

function normalizeSelectedPlace(item: any): SelectedPlace {
  const shelters = Array.isArray(item?.shelters) ? item.shelters : [];

  return {
    placeId: item?.placeId,
    name: item?.name || '대피소',
    address: item?.address || item?.oldAddress || '',
    description: item?.description || '',
    shelterCount: shelters.length,
    accessibilityMatchStatus: item?.accessibilityMatchStatus,
    shelters: shelters.map((shelter: any) => ({
      shelterId: shelter.shelterId,
      name: shelter.name || item?.name || '대피소',
      shelterType: shelter.shelterType,
      capacity: shelter.capacity,
      area: shelter.area,
      managingAuthorityName: shelter.managingAuthorityName,
      managingAuthorityTelNo: shelter.managingAuthorityTelNo,
      accessibleToilet: shelter.accessibleToilet,
      ramp: shelter.ramp,
      elevator: shelter.elevator,
      brailleBlock: shelter.brailleBlock,
      images: Array.isArray(shelter.images) ? shelter.images : [],
    })),
  };
}

const reportImageCategories: Array<{
  value: ShelterImageCategory;
  labelKey: string;
}> = [
  { value: 'ENTRANCE', labelKey: 'map.report.categories.ENTRANCE' },
  { value: 'EXTERIOR', labelKey: 'map.report.categories.EXTERIOR' },
  { value: 'INTERIOR', labelKey: 'map.report.categories.INTERIOR' },
  { value: 'RAMP', labelKey: 'map.report.categories.RAMP' },
  { value: 'ELEVATOR', labelKey: 'map.report.categories.ELEVATOR' },
  { value: 'TOILET', labelKey: 'map.report.categories.TOILET' },
  { value: 'BRAILLE', labelKey: 'map.report.categories.BRAILLE' },
  { value: 'SIGNAGE', labelKey: 'map.report.categories.SIGNAGE' },
  { value: 'ETC', labelKey: 'map.report.categories.ETC' },
];

function toReportLocalImage(asset: Asset): ReportLocalImage | null {
  if (!asset.uri) return null;

  const fallbackName = `shelter-report-${Date.now()}.jpg`;
  const contentType = asset.type || 'image/jpeg';

  return {
    id: `${asset.uri}-${asset.fileSize ?? Date.now()}`,
    uri: asset.uri,
    fileName: asset.fileName || fallbackName,
    contentType,
    fileSize: asset.fileSize ?? 0,
    category: 'ETC',
    description: '',
    base64: asset.base64,
  };
}

function getShelterImageSources(shelter: ShelterSummary): ImageSourcePropType[] {
  const sources =
    shelter.images
      ?.map(image => image.url)
      .filter((url): url is string => typeof url === 'string' && !!url.trim())
      .map(url => ({ uri: url })) ?? [];

  return sources.length ? sources : [defaultShelterImage];
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
  initialSelectedPlaceIdJson: string,
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
      window.__INITIAL_SELECTED_PLACE_ID__ = ${initialSelectedPlaceIdJson};
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
        const name = path.includes(',')
          ? path.split(',')[0].trim()
          : path.split(' ').filter(Boolean).slice(-1)[0] || path;
        return name + ' ' + item.count;
      }

      function accessibilityMatchColor(status) {
        const value = String(status || '').toUpperCase();
        if (!value) return '#2563eb';

        if (value === 'ACCESSIBLE') return '#16a34a';
        if (value === 'PARTIAL') return '#f59e0b';
        if (value === 'INACCESSIBLE') return '#dc2626';
        if (value === 'NONE') return '#2563eb';

        return '#2563eb';
      }

      function normalizePlace(item) {
        const shelters = Array.isArray(item.shelters) ? item.shelters : [];
        return {
          placeId: item.placeId,
          name: item.name || '대피소',
          address: item.address || item.oldAddress || '',
          description: item.description || '',
          shelterCount: shelters.length,
          accessibilityMatchStatus: item.accessibilityMatchStatus,
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
              images: Array.isArray(shelter.images) ? shelter.images : [],
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
          zIndex: 10,
        });
      }

      function createDetailOverlay(map, item, position, selectedPlaceId, onSelect) {
        const el = document.createElement('div');
        const markerColor = accessibilityMatchColor(item.accessibilityMatchStatus);
        const isSelected = String(item.placeId) === String(selectedPlaceId);
        el.style.cssText = [
          'display:flex',
          'align-items:center',
          'justify-content:center',
          'width:' + (isSelected ? '20px' : '14px'),
          'height:' + (isSelected ? '20px' : '14px'),
          'border-radius:999px',
          'background:' + markerColor,
          'border:' + (isSelected ? '4px' : '2px') + ' solid #ffffff',
          'box-shadow:0 0 0 ' + (isSelected ? '5px' : '0') + ' ' + markerColor + '33,0 2px 10px ' + markerColor + '80',
          'cursor:pointer',
          'transition:width .12s ease,height .12s ease,box-shadow .12s ease',
        ].join(';');

        el.addEventListener('click', function() {
          onSelect(item);
        });

        return new window.kakao.maps.CustomOverlay({
          map: map,
          position: position,
          content: el,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: isSelected ? 9000 : 10,
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
        setTimeout(function() {
          map.relayout();
          map.setCenter(center);
        }, 100);
        map.addControl(
          new window.kakao.maps.ZoomControl(),
          window.kakao.maps.ControlPosition.RIGHT
        );

        let overlays = [];
        window.__selectedPlaceId = window.__INITIAL_SELECTED_PLACE_ID__ || null;

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

        window.__selectPlaceMarker = function(placeId) {
          const selected = details.find(function(item) {
            return String(item.placeId) === String(placeId);
          });
          if (!selected) return;

          const coords = toLatLng(selected);
          if (!coords) return;

          window.__selectedPlaceId = selected.placeId;
          map.setLevel(6);
          map.panTo(new window.kakao.maps.LatLng(coords.lat, coords.lng));
          draw();
        };

        window.__clearSelectedPlaceMarker = function() {
          window.__selectedPlaceId = null;
          draw();
        };

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
              ? createDetailOverlay(
                  map,
                  item,
                  position,
                  window.__selectedPlaceId,
                  function(selectedItem) {
                    window.__selectedPlaceId = selectedItem.placeId;
                    window.__notify({
                      type: 'marker',
                      payload: normalizePlace(selectedItem),
                    });
                    setTimeout(draw, 0);
                  }
                )
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
  const { t, i18n } = useTranslation();
  const { alert } = useDialogUtil();
  const { height: screenHeight } = useWindowDimensions();
  const route = useRoute<RouteProp<RootTabParamList, 'Map'>>();
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const panelAnimation = useRef(new Animated.Value(1)).current;
  const panelDragStartRef = useRef(1);
  const selectedShelterTypes = useMapFilterStore(
    state => state.selectedShelterTypes,
  );
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const userLocation = useLocationStore(state => state.location);
  const user = useUserStore(state => state.user);
  const submitReport = useShelterReportStore(state => state.submitReport);
  const isReportSubmitting = useShelterReportStore(
    state => state.isSubmitting,
  );
  const [reportShelter, setReportShelter] = useState<ShelterSummary | null>(
    null,
  );
  const [reportForm, setReportForm] = useState<ShelterReportForm>({
    accessibleToilet: false,
    ramp: false,
    elevator: false,
    brailleBlock: false,
    etcFacilities: '',
    images: [],
  });

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
  });
  const mapData = useMapStore(state => state.map);
  useEffect(() => {
    const sheltersWithImages = Object.values(mapData?.details ?? {})
      .flatMap((place: any) => place?.shelters ?? [])
      .filter(
        (shelter: any) =>
          Array.isArray(shelter?.images) && shelter.images.length > 0,
      );

    if (sheltersWithImages.length) {
      console.log('sheltersWithImages', sheltersWithImages);
    }
  }, [mapData]);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );

  const [visiblePlaces, setVisiblePlaces] = useState<SelectedPlace[]>([]);
  const [shelterImageIndexes, setShelterImageIndexes] = useState<
    Record<number, number>
  >({});
  const [imageModal, setImageModal] = useState<{
    images: ImageSourcePropType[];
    index: number;
  } | null>(null);
  const [isAccessibilityInfoVisible, setIsAccessibilityInfoVisible] =
    useState(false);
  const [mapError, setMapError] = useState('');
  const [panelReady, setPanelReady] = useState(false);
  const [mapFrameHeight, setMapFrameHeight] = useState(0);
  const mapViewRef = useRef<MapViewState | null>(null);
  const webViewRef = useRef<WebView>(null);
  const pendingFocusPlaceIdRef = useRef<number | null>(null);
  const selectedPlaceIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    setSelectedPlace(null);
    setVisiblePlaces([]);
    setPanelReady(false);
  }, [mapData]);

  useEffect(() => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    setSelectedPlace(null);
    setVisiblePlaces([]);
    setPanelReady(false);
  }, [selectedAccessibility, selectedShelterTypes]);

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
      JSON.stringify(selectedPlaceIdRef.current),
    );
  }, [mapData, userLocation]);

  const webViewSource = useMemo(() => ({ html: mapHtml }), [mapHtml]);

  const expandedPanelHeight = Math.round(
    (mapFrameHeight || screenHeight) * 0.9,
  );
  const collapsedPanelHeight = 42;
  const panelRange = expandedPanelHeight - collapsedPanelHeight;
  const panelHeight = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedPanelHeight, expandedPanelHeight],
  });

  const animatePanelTo = useCallback(
    (expanded: boolean) => {
      setIsPanelExpanded(expanded);
      Animated.timing(panelAnimation, {
        toValue: expanded ? 1 : 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [panelAnimation],
  );

  const handleMapFrameLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setMapFrameHeight(current =>
      Math.abs(current - nextHeight) > 1 ? nextHeight : current,
    );
  };

  const handleMessage = (event: MapMessageEvent) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data) as WebMessagePayload;

      if (parsed.type === 'marker' && parsed.payload) {
        pendingFocusPlaceIdRef.current = null;
        selectedPlaceIdRef.current = parsed.payload.placeId;
        setMapError('');
        setSelectedPlace(parsed.payload);
        animatePanelTo(true);
        return;
      }

      if (parsed.type === 'error') {
        setMapError(parsed.message ?? '지도 로드에 실패했습니다.');
        return;
      }

      if (parsed.type === 'ready') {
        setMapError('');
        setVisiblePlaces(parsed.visiblePlaces ?? []);
        setPanelReady(true);
        if (pendingFocusPlaceIdRef.current) {
          const pendingFocusPlaceId = pendingFocusPlaceIdRef.current;
          pendingFocusPlaceIdRef.current = null;
          webViewRef.current?.injectJavaScript(`
            if (window.__selectPlaceMarker) {
              window.__selectPlaceMarker(${JSON.stringify(
                pendingFocusPlaceId,
              )});
            }
            true;
          `);
        }
        return;
      }

      if (
        parsed.type === 'viewport' &&
        parsed.center &&
        Number.isFinite(parsed.center.lat) &&
        Number.isFinite(parsed.center.lng) &&
        Number.isFinite(parsed.level)
      ) {
        const level = parsed.level;
        if (typeof level !== 'number') return;

        mapViewRef.current = {
          center: parsed.center,
          level,
        };
        return;
      }
    } catch {
      // no-op
    }
  };

  const handleMoveToUserLocation = () => {
    webViewRef.current?.injectJavaScript(`
      if (window.__moveToUserLocation) {
        window.__moveToUserLocation();
      }
      true;
    `);
  };

  const handlePlacePress = (place: SelectedPlace) => {
    pendingFocusPlaceIdRef.current = null;
    selectedPlaceIdRef.current = place.placeId;
    setSelectedPlace(place);
    animatePanelTo(true);
    webViewRef.current?.injectJavaScript(`
      if (window.__selectPlaceMarker) {
        window.__selectPlaceMarker(${JSON.stringify(place.placeId)});
      }
      true;
    `);
  };

  useEffect(() => {
    const focusPlaceId = route.params?.focusPlaceId;
    if (!focusPlaceId || !mapData?.details) return;

    const detail = Object.values(mapData.details).find(
      (item: any) => Number(item?.placeId) === Number(focusPlaceId),
    );
    if (!detail) return;

    pendingFocusPlaceIdRef.current = focusPlaceId;
    selectedPlaceIdRef.current = focusPlaceId;
    setSelectedPlace(normalizeSelectedPlace(detail));
    animatePanelTo(true);
    webViewRef.current?.injectJavaScript(`
      if (window.__selectPlaceMarker) {
        window.__selectPlaceMarker(${JSON.stringify(focusPlaceId)});
      }
      true;
    `);
  }, [
    animatePanelTo,
    mapData,
    route.params?.focusNonce,
    route.params?.focusPlaceId,
  ]);

  const handleBackToPlaceList = () => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    setSelectedPlace(null);
    webViewRef.current?.injectJavaScript(`
      if (window.__clearSelectedPlaceMarker) {
        window.__clearSelectedPlaceMarker();
      }
      true;
    `);
  };

  const handleChangeShelterImage = (
    shelterId: number,
    imageCount: number,
    direction: 1 | -1,
  ) => {
    setShelterImageIndexes(prev => {
      const current = prev[shelterId] ?? 0;
      const next = (current + direction + imageCount) % imageCount;
      return { ...prev, [shelterId]: next };
    });
  };

  const openReportModal = (shelter: ShelterSummary) => {
    setReportShelter(shelter);
    setReportForm({
      accessibleToilet: shelter.accessibleToilet === true,
      ramp: shelter.ramp === true,
      elevator: shelter.elevator === true,
      brailleBlock: shelter.brailleBlock === true,
      etcFacilities: shelter.etcFacilities ?? '',
      images: [],
    });
  };

  const closeReportModal = () => {
    if (isReportSubmitting) return;
    setReportShelter(null);
  };

  const updateReportForm = <K extends keyof ShelterReportForm>(
    key: K,
    value: ShelterReportForm[K],
  ) => {
    setReportForm(prev => ({ ...prev, [key]: value }));
  };

  const addReportImages = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 5,
      quality: 0.8,
      includeBase64: true,
    });
    console.log('[report-images] picker result', {
      didCancel: result.didCancel,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      assetCount: result.assets?.length ?? 0,
      assets: result.assets?.map(asset => ({
        uri: asset.uri,
        fileName: asset.fileName,
        type: asset.type,
        fileSize: asset.fileSize,
        hasBase64: !!asset.base64,
      })),
    });

    if (result.didCancel) return;
    if (result.errorMessage) {
      alert(result.errorMessage);
      return;
    }

    const nextImages = (result.assets ?? [])
      .map(toReportLocalImage)
      .filter((image): image is ReportLocalImage => !!image);

    if (!nextImages.length) return;

    setReportForm(prev => ({
      ...prev,
      images: [...prev.images, ...nextImages].slice(0, 5),
    }));
    console.log('[report-images] added', nextImages);
  };

  const removeReportImage = (id: string) => {
    setReportForm(prev => ({
      ...prev,
      images: prev.images.filter(image => image.id !== id),
    }));
  };

  const updateReportImage = (
    id: string,
    patch: Partial<Pick<ReportLocalImage, 'category' | 'description'>>,
  ) => {
    setReportForm(prev => ({
      ...prev,
      images: prev.images.map(image =>
        image.id === id ? { ...image, ...patch } : image,
      ),
    }));
  };

  const submitShelterReport = async () => {
    if (!reportShelter) return;

    try {
      await submitReport({
        shelterId: reportShelter.shelterId,
        signageLanguage: i18n.language,
        accessibleToilet: reportForm.accessibleToilet,
        ramp: reportForm.ramp,
        elevator: reportForm.elevator,
        brailleBlock: reportForm.brailleBlock,
        etcFacilities: reportForm.etcFacilities.trim() || undefined,
        localImages: reportForm.images.map(image => ({
          uri: image.uri,
          fileName: image.fileName,
          contentType: image.contentType,
          fileSize: image.fileSize,
          category: image.category,
          description: image.description,
          base64: image.base64,
        })),
      });
      setReportShelter(null);
      alert(t('map.report.success'));
    } catch (error: any) {
      console.log('[report-submit] failed', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      alert(error?.response?.data?.message ?? t('map.report.failed'));
    }
  };

  const openAccessibilityInfo = () => {
    console.log('[accessibility-info] map overlay open');
    setIsAccessibilityInfoVisible(true);
  };
  const closeAccessibilityInfo = () => {
    console.log('[accessibility-info] map overlay close');
    setIsAccessibilityInfoVisible(false);
  };

  const panelPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dy) > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          panelDragStartRef.current = isPanelExpanded ? 1 : 0;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextValue =
            panelDragStartRef.current - gestureState.dy / panelRange;
          panelAnimation.setValue(Math.max(0, Math.min(1, nextValue)));
        },
        onPanResponderRelease: (_, gestureState) => {
          if (
            Math.abs(gestureState.dy) <= 6 &&
            Math.abs(gestureState.dx) <= 6
          ) {
            animatePanelTo(!isPanelExpanded);
            return;
          }

          const shouldExpand =
            gestureState.vy < -0.35 ||
            (gestureState.vy <= 0.35 &&
              panelDragStartRef.current - gestureState.dy / panelRange > 0.45);
          animatePanelTo(shouldExpand);
        },
        onPanResponderTerminate: () => {
          animatePanelTo(isPanelExpanded);
        },
        onShouldBlockNativeResponder: () => false,
      }),
    [animatePanelTo, isPanelExpanded, panelAnimation, panelRange],
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Header>
        <CurrentLocationBar
          actionLabel={t('map.labels.nearbyLocation')}
          onAction={handleMoveToUserLocation}
        />
      </Header>

      <MapSearchFilters onPressAccessibilityInfo={openAccessibilityInfo} />

      <MapFrame onLayout={handleMapFrameLayout}>
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

      <BottomPanel style={{ height: panelHeight }}>
        <PanelHandleButton {...panelPanResponder.panHandlers}>
          <PanelHandleBar />
        </PanelHandleButton>
        {selectedPlace ? (
          <>
            <PanelHeader>
              <BackButton
                accessibilityLabel="뒤로가기"
                onPress={handleBackToPlaceList}
              >
                <ChevronLeft color="#111827" size={20} strokeWidth={2.8} />
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
            <DetailMeta>
              {t('map.labels.shelter')} {selectedPlace.shelterCount}
            </DetailMeta>

            <PanelScroll showsVerticalScrollIndicator={false}>
              {selectedPlace.shelters.length ? (
                selectedPlace.shelters.map(shelter => {
                  const shelterImages = getShelterImageSources(shelter);
                  const imageIndex = Math.min(
                    shelterImageIndexes[shelter.shelterId] ?? 0,
                    shelterImages.length - 1,
                  );

                  return (
                    <ShelterItem key={String(shelter.shelterId)}>
                      <ShelterImageFrame
                        onPress={() =>
                          setImageModal({
                            images: shelterImages,
                            index: imageIndex,
                          })
                        }
                      >
                        <ShelterImage
                          source={shelterImages[imageIndex]}
                          resizeMode="cover"
                        />
                        {shelterImages.length > 1 ? (
                          <>
                            <ImageNavButton
                              $position="left"
                              onPress={() =>
                                handleChangeShelterImage(
                                  shelter.shelterId,
                                  shelterImages.length,
                                  -1,
                                )
                              }
                            >
                              <ChevronLeft
                                color="#ffffff"
                                size={18}
                                strokeWidth={2.8}
                              />
                            </ImageNavButton>
                            <ImageNavButton
                              $position="right"
                              onPress={() =>
                                handleChangeShelterImage(
                                  shelter.shelterId,
                                  shelterImages.length,
                                  1,
                                )
                              }
                            >
                              <ChevronRight
                                color="#ffffff"
                                size={18}
                                strokeWidth={2.8}
                              />
                            </ImageNavButton>
                            <ImageCounter>
                              <ImageCounterText>
                                {imageIndex + 1}/{shelterImages.length}
                              </ImageCounterText>
                            </ImageCounter>
                          </>
                        ) : null}
                      </ShelterImageFrame>
                    <ShelterTitleRow>
                      <ShelterName>{shelter.name}</ShelterName>
                      <TypeChip>
                        <TypeChipText>
                          {t(
                            getShelterTypeTranslationKey(shelter.shelterType) ??
                              getShelterTypeLabel(shelter.shelterType),
                          )}
                        </TypeChipText>
                      </TypeChip>
                    </ShelterTitleRow>
                    <ShelterMetaRow>
                      {typeof shelter.capacity === 'number' ? (
                        <ShelterMetaIconText>
                          <Users color="#4b5563" size={14} strokeWidth={2.4} />
                          <ShelterMetaText>
                            {shelter.capacity.toLocaleString()}
                          </ShelterMetaText>
                        </ShelterMetaIconText>
                      ) : null}
                      {typeof shelter.area === 'number' ? (
                        <ShelterMetaIconText>
                          <Square color="#4b5563" size={13} strokeWidth={2.4} />
                          <ShelterMetaText>
                            {shelter.area.toLocaleString()}㎡
                          </ShelterMetaText>
                        </ShelterMetaIconText>
                      ) : null}
                      {typeof shelter.capacity !== 'number' &&
                      typeof shelter.area !== 'number' ? (
                        <ShelterMetaText>규모 정보 없음</ShelterMetaText>
                      ) : null}
                    </ShelterMetaRow>
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
                            {t(
                              accessibilityFilterLabelKeys[chip.label] ??
                                chip.label,
                            )}
                          </AccessChipText>
                        </AccessChip>
                      ))}
                    </ChipRow>
                    {user ? (
                      <ReportButton onPress={() => openReportModal(shelter)}>
                        <Camera
                          color="#2563eb"
                          size={16}
                          strokeWidth={2.5}
                        />
                        <ReportButtonText>
                          {t('map.report.button')}
                        </ReportButtonText>
                      </ReportButton>
                    ) : null}
                  </ShelterItem>
                  );
                })
              ) : (
                <EmptyPanelText>연결된 대피소가 없습니다.</EmptyPanelText>
              )}
            </PanelScroll>
          </>
        ) : (
          <>
            <PanelHeader>
              <PanelCount>
                {t('map.labels.totalShelters')} {visiblePlaces.length}
              </PanelCount>
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
                    onPress={() => handlePlacePress(place)}
                  >
                    <PlaceName numberOfLines={1}>{place.name}</PlaceName>
                    <PlaceAddress numberOfLines={1}>
                      {place.address || '주소 정보 없음'}
                    </PlaceAddress>
                    <ChipRow>
                      {getShelterTypeCounts(place.shelters).map(item => (
                        <TypeCountChip key={`${place.placeId}-${item.type}`}>
                          <TypeCountText>
                            {t(
                              getShelterTypeTranslationKey(item.type) ??
                                item.label,
                            )}{' '}
                            {item.count}
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

      {isAccessibilityInfoVisible ? (
        <AccessibilityInfoOverlay onPress={closeAccessibilityInfo}>
          <AccessibilityInfoCard onPress={event => event.stopPropagation()}>
            <AccessibilityInfoHeader>
              <AccessibilityInfoTitle>
                {t('map.accessibilityInfo.title')}
              </AccessibilityInfoTitle>
              <AccessibilityInfoCloseButton onPress={closeAccessibilityInfo}>
                <X color="#6b7280" size={22} strokeWidth={2.6} />
              </AccessibilityInfoCloseButton>
            </AccessibilityInfoHeader>
            <AccessibilityInfoDescription>
              {t('map.accessibilityInfo.description')}
            </AccessibilityInfoDescription>
            <AccessibilityInfoList>
              <AccessibilityInfoText>
                {t('map.accessibilityInfo.ramp')}
              </AccessibilityInfoText>
              <AccessibilityInfoText>
                {t('map.accessibilityInfo.elevator')}
              </AccessibilityInfoText>
              <AccessibilityInfoText>
                {t('map.accessibilityInfo.brailleBlock')}
              </AccessibilityInfoText>
              <AccessibilityInfoText>
                {t('map.accessibilityInfo.accessibleToilet')}
              </AccessibilityInfoText>
            </AccessibilityInfoList>
            <AccessibilityLegendList>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color="#2563eb" />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.blue')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color="#16a34a" />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.green')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color="#f59e0b" />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.orange')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color="#dc2626" />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.red')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
            </AccessibilityLegendList>
            <AccessibilityInfoButton onPress={closeAccessibilityInfo}>
              <AccessibilityInfoButtonText>
                {t('map.accessibilityInfo.close')}
              </AccessibilityInfoButtonText>
            </AccessibilityInfoButton>
          </AccessibilityInfoCard>
        </AccessibilityInfoOverlay>
      ) : null}

      <Modal
        animationType="slide"
        transparent
        visible={!!reportShelter}
        onRequestClose={closeReportModal}
      >
        <ReportModalOverlay onPress={closeReportModal}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ReportModalCard onPress={event => event.stopPropagation()}>
              <ReportModalHeader>
                <ReportModalTitle>{t('map.report.title')}</ReportModalTitle>
                <ReportCloseButton onPress={closeReportModal}>
                  <X color="#6b7280" size={22} strokeWidth={2.6} />
                </ReportCloseButton>
              </ReportModalHeader>
              {reportShelter ? (
                <ReportShelterName numberOfLines={2}>
                  {reportShelter.name}
                </ReportShelterName>
              ) : null}

              <ReportModalScroll
                contentContainerStyle={reportModalScrollContentStyle}
                showsVerticalScrollIndicator={false}
              >
                <ReportField>
                  <ReportLabel>{t('map.report.accessibility')}</ReportLabel>
                  <ReportToggleGrid>
                    <ReportToggle
                      $active={reportForm.ramp}
                      onPress={() => updateReportForm('ramp', !reportForm.ramp)}
                    >
                      <ReportToggleText $active={reportForm.ramp}>
                        {t('map.filters.ramp')}
                      </ReportToggleText>
                    </ReportToggle>
                    <ReportToggle
                      $active={reportForm.elevator}
                      onPress={() =>
                        updateReportForm('elevator', !reportForm.elevator)
                      }
                    >
                      <ReportToggleText $active={reportForm.elevator}>
                        {t('map.filters.elevator')}
                      </ReportToggleText>
                    </ReportToggle>
                    <ReportToggle
                      $active={reportForm.brailleBlock}
                      onPress={() =>
                        updateReportForm(
                          'brailleBlock',
                          !reportForm.brailleBlock,
                        )
                      }
                    >
                      <ReportToggleText $active={reportForm.brailleBlock}>
                        {t('map.filters.brailleBlock')}
                      </ReportToggleText>
                    </ReportToggle>
                    <ReportToggle
                      $active={reportForm.accessibleToilet}
                      onPress={() =>
                        updateReportForm(
                          'accessibleToilet',
                          !reportForm.accessibleToilet,
                        )
                      }
                    >
                      <ReportToggleText $active={reportForm.accessibleToilet}>
                        {t('map.filters.accessibleToilet')}
                      </ReportToggleText>
                    </ReportToggle>
                  </ReportToggleGrid>
                </ReportField>

                <ReportField>
                  <ReportLabel>{t('map.report.images')}</ReportLabel>
                  <AddImageButton onPress={addReportImages}>
                    <ImagePlus color="#2563eb" size={16} strokeWidth={2.6} />
                    <AddImageButtonText>
                      {t('map.report.addImage')}
                    </AddImageButtonText>
                  </AddImageButton>

                  {reportForm.images.map(image => (
                    <ReportImageItem key={image.id}>
                      <ReportImagePreview source={{ uri: image.uri }} />
                      <ReportImageBody>
                        <ReportImageTopRow>
                          <ReportImageName numberOfLines={1}>
                            {image.fileName}
                          </ReportImageName>
                          <ReportImageRemoveButton
                            onPress={() => removeReportImage(image.id)}
                          >
                            <Trash2
                              color="#ef4444"
                              size={16}
                              strokeWidth={2.4}
                            />
                          </ReportImageRemoveButton>
                        </ReportImageTopRow>
                        <ReportCategoryRow>
                          {reportImageCategories.map(category => (
                            <ReportCategoryChip
                              key={`${image.id}-${category.value}`}
                              $active={image.category === category.value}
                              onPress={() =>
                                updateReportImage(image.id, {
                                  category: category.value,
                                })
                              }
                            >
                              <ReportCategoryText
                                $active={image.category === category.value}
                              >
                                {t(category.labelKey)}
                              </ReportCategoryText>
                            </ReportCategoryChip>
                          ))}
                        </ReportCategoryRow>
                        <ReportImageDescriptionInput
                          value={image.description}
                          onChangeText={value =>
                            updateReportImage(image.id, {
                              description: value,
                            })
                          }
                          placeholder={t(
                            'map.report.imageDescriptionPlaceholder',
                          )}
                          placeholderTextColor="#9ca3af"
                        />
                      </ReportImageBody>
                    </ReportImageItem>
                  ))}
                </ReportField>

                <ReportEtcField>
                  <ReportLabel>{t('map.report.etcFacilities')}</ReportLabel>
                  <ReportTextArea
                    value={reportForm.etcFacilities}
                    onChangeText={value =>
                      updateReportForm('etcFacilities', value)
                    }
                    placeholder={t('map.report.etcFacilitiesPlaceholder')}
                    placeholderTextColor="#9ca3af"
                    multiline
                    textAlignVertical="top"
                  />
                </ReportEtcField>
              </ReportModalScroll>

              <ReportSubmitButton
                disabled={isReportSubmitting}
                onPress={submitShelterReport}
              >
                {isReportSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send color="#ffffff" size={16} strokeWidth={2.6} />
                    <ReportSubmitText>
                      {t('map.report.submit')}
                    </ReportSubmitText>
                  </>
                )}
              </ReportSubmitButton>
            </ReportModalCard>
          </KeyboardAvoidingView>
        </ReportModalOverlay>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={!!imageModal}
        onRequestClose={() => setImageModal(null)}
      >
        <ImageModalOverlay onPress={() => setImageModal(null)}>
          <ImageModalContent pointerEvents="box-none">
            {imageModal ? (
              <>
                <ImageModalImage
                  source={imageModal.images[imageModal.index]}
                  resizeMode="contain"
                />
                <ImageCloseButton onPress={() => setImageModal(null)}>
                  <X color="#ffffff" size={24} strokeWidth={2.8} />
                </ImageCloseButton>
                {imageModal.images.length > 1 ? (
                  <>
                    <ModalImageNavButton
                      $position="left"
                      onPress={() =>
                        setImageModal(current =>
                          current
                            ? {
                                ...current,
                                index:
                                  (current.index - 1 + current.images.length) %
                                  current.images.length,
                              }
                            : current,
                        )
                      }
                    >
                      <ChevronLeft
                        color="#ffffff"
                        size={26}
                        strokeWidth={2.8}
                      />
                    </ModalImageNavButton>
                    <ModalImageNavButton
                      $position="right"
                      onPress={() =>
                        setImageModal(current =>
                          current
                            ? {
                                ...current,
                                index: (current.index + 1) % current.images.length,
                              }
                            : current,
                        )
                      }
                    >
                      <ChevronRight
                        color="#ffffff"
                        size={26}
                        strokeWidth={2.8}
                      />
                    </ModalImageNavButton>
                    <ModalImageCounter>
                      <ImageCounterText>
                        {imageModal.index + 1}/{imageModal.images.length}
                      </ImageCounterText>
                    </ModalImageCounter>
                  </>
                ) : null}
              </>
            ) : null}
          </ImageModalContent>
        </ImageModalOverlay>
      </Modal>
    </Screen>
  );
}

const Screen = styled(SafeAreaView)`
  flex: 1;
  position: relative;
  background-color: #f4f7fb;
`;

const Header = styled.View`
  padding: 20px 20px 12px;
`;

const MapFrame = styled.View`
  flex: 1;
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

const BottomPanel = styled(Animated.View)`
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  gap: 6px;
  padding: 0 10px 10px;
  border-radius: 16px 16px 0 0;
  background-color: #ffffff;
  min-height: 0;
  overflow: hidden;
  shadow-color: #111827;
  shadow-opacity: 0.14;
  shadow-radius: 12px;
  shadow-offset: 0 -3px;
  elevation: 10;
`;

const AccessibilityInfoOverlay = styled.Pressable`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 80;
  elevation: 80;
  padding: 92px 20px 20px;
  background-color: transparent;
`;

const AccessibilityInfoCard = styled.Pressable`
  gap: 14px;
  padding: 18px;
  border-radius: 16px;
  background-color: #ffffff;
`;

const AccessibilityInfoHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const AccessibilityInfoTitle = styled.Text`
  flex: 1;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
`;

const AccessibilityInfoCloseButton = styled.Pressable`
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
`;

const AccessibilityInfoDescription = styled.Text`
  color: #4b5563;
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
`;

const AccessibilityInfoList = styled.View`
  gap: 8px;
`;

const AccessibilityInfoText = styled.Text`
  color: #374151;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
`;

const AccessibilityLegendList = styled.View`
  gap: 8px;
  padding-top: 2px;
`;

const AccessibilityLegendRow = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

const AccessibilityLegendDot = styled.View<{ $color: string }>`
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 999px;
  background-color: ${({ $color }) => $color};
`;

const AccessibilityLegendText = styled.Text`
  flex: 1;
  color: #374151;
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
`;

const AccessibilityInfoButton = styled.Pressable`
  align-self: flex-end;
  padding: 10px 14px;
  border-radius: 10px;
  background-color: #f3f4f6;
`;

const AccessibilityInfoButtonText = styled.Text`
  color: #111827;
  font-size: 14px;
  font-weight: 700;
`;

const PanelHandleButton = styled.View`
  height: 42px;
  align-items: center;
  justify-content: center;
`;

const PanelHandleBar = styled.View`
  width: 42px;
  height: 4px;
  border-radius: 999px;
  background-color: #d1d5db;
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
  align-items: center;
  justify-content: center;
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
  text-align: right;
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

const ShelterImageFrame = styled.Pressable`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 10px;
  background-color: #e5e7eb;
`;

const ShelterImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ImageNavButton = styled.Pressable<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 8px;`}
  width: 30px;
  height: 30px;
  margin-top: -15px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.62);
`;

const ImageCounter = styled.View`
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 7px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.68);
`;

const ImageCounterText = styled.Text`
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
`;

const ImageModalOverlay = styled.Pressable`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.86);
`;

const ImageModalContent = styled.Pressable`
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
`;

const ImageModalImage = styled.Image`
  width: 100%;
  height: 100%;
`;

const ImageCloseButton = styled.Pressable`
  position: absolute;
  top: 46px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.68);
`;

const ModalImageNavButton = styled.Pressable<{ $position: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${({ $position }) => `${$position}: 16px;`}
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: rgba(17, 24, 39, 0.62);
`;

const ModalImageCounter = styled.View`
  position: absolute;
  right: 16px;
  bottom: 32px;
  padding: 5px 10px;
  border-radius: 999px;
  background-color: rgba(17, 24, 39, 0.72);
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

const ShelterMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 10px;
`;

const ShelterMetaIconText = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const ShelterMetaText = styled.Text`
  color: #4b5563;
  font-size: 12px;
  line-height: 18px;
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
  background-color: ${SHELTER_SELECTED_COLOR};
`;

const TypeChipText = styled.Text`
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
`;

const TypeCountChip = styled.View`
  padding: 5px 8px;
  border-radius: 999px;
  background-color: ${SHELTER_SELECTED_COLOR};
`;

const TypeCountText = styled.Text`
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
`;

const AccessChip = styled.View<{ $active: boolean }>`
  padding: 5px 7px;
  border-radius: 999px;
  background-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : '#f3f4f6'};
  border-width: 1px;
  border-color: ${({ $active }) =>
    $active ? ACCESSIBILITY_SELECTED_COLOR : '#e5e7eb'};
`;

const AccessChipText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#9ca3af')};
  font-size: 10px;
  font-weight: 800;
`;

const ReportButton = styled.Pressable`
  min-height: 38px;
  margin-top: 4px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: #eff6ff;
  border-width: 1px;
  border-color: #bfdbfe;
`;

const ReportButtonText = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
`;

const ReportModalOverlay = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  padding: 16px;
  background-color: rgba(17, 24, 39, 0.32);
`;

const ReportModalCard = styled.Pressable`
  height: 90%;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background-color: #ffffff;
`;

const ReportModalHeader = styled.View`
  min-height: 34px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ReportModalTitle = styled.Text`
  flex: 1;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
`;

const ReportCloseButton = styled.Pressable`
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
`;

const ReportShelterName = styled.Text`
  color: #374151;
  font-size: 14px;
  line-height: 20px;
  font-weight: 700;
`;

const ReportModalScroll = styled.ScrollView`
  flex: 1;
`;

const ReportField = styled.View`
  gap: 8px;
  margin-bottom: 14px;
`;

const ReportEtcField = styled.View`
  flex: 1;
  gap: 8px;
  margin-bottom: 14px;
`;

const ReportLabel = styled.Text`
  color: #111827;
  font-size: 13px;
  font-weight: 800;
`;

const ReportTextArea = styled.TextInput`
  flex: 1;
  min-height: 104px;
  padding: 12px;
  border-radius: 10px;
  color: #111827;
  font-size: 14px;
  line-height: 20px;
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const ReportToggleGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const ReportToggle = styled.Pressable<{ $active: boolean }>`
  min-height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) => ($active ? '#2563eb' : '#f3f4f6')};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? '#2563eb' : '#e5e7eb')};
`;

const ReportToggleText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#4b5563')};
  font-size: 12px;
  font-weight: 800;
`;

const AddImageButton = styled.Pressable`
  min-height: 40px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 6px;
  background-color: #eff6ff;
  border-width: 1px;
  border-color: #bfdbfe;
`;

const AddImageButtonText = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
`;

const ReportImageItem = styled.View`
  flex-direction: row;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background-color: #f9fafb;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const ReportImagePreview = styled.Image`
  width: 74px;
  height: 74px;
  border-radius: 10px;
  background-color: #e5e7eb;
`;

const ReportImageBody = styled.View`
  flex: 1;
  gap: 8px;
  min-width: 0;
`;

const ReportImageTopRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ReportImageName = styled.Text`
  flex: 1;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
`;

const ReportImageRemoveButton = styled.Pressable`
  width: 28px;
  height: 28px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: #fee2e2;
`;

const ReportCategoryRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

const ReportCategoryChip = styled.Pressable<{ $active: boolean }>`
  min-height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background-color: ${({ $active }) => ($active ? '#111827' : '#ffffff')};
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? '#111827' : '#e5e7eb')};
`;

const ReportCategoryText = styled.Text<{ $active: boolean }>`
  color: ${({ $active }) => ($active ? '#ffffff' : '#4b5563')};
  font-size: 11px;
  font-weight: 800;
`;

const ReportImageDescriptionInput = styled.TextInput`
  min-height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  color: #111827;
  font-size: 12px;
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e5e7eb;
`;

const ReportSubmitButton = styled.Pressable`
  min-height: 46px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 7px;
  background-color: #2563eb;
`;

const ReportSubmitText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
`;

const EmptyPanelText = styled.Text`
  padding: 18px 0;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
`;
