import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  FlatList,
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
import {
  useFocusEffect,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  ImagePlus,
  LocateFixed,
  Minus,
  Plus,
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

const shelterTypeOrder = Object.keys(shelterTypeLabelMap);

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
      const aIndex = shelterTypeOrder.indexOf(a.type);
      const bIndex = shelterTypeOrder.indexOf(b.type);
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
  coords: { lat: number; lng: number } | null;
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
}

interface RegionTrailItem {
  depth: number;
  regionId: number;
  name: string;
}

interface WebMessagePayload {
  type: 'marker' | 'ready' | 'error' | 'viewport' | 'regionTrail';
  placeId?: number;
  version?: number;
  trail?: RegionTrailItem[];
  message?: string;
  totalCount?: number;
  visibleCount?: number;
  visiblePlaceIds?: number[];
  center?: {
    lat: number;
    lng: number;
  };
  level?: number;
}

function normalizeSelectedPlace(item: any): SelectedPlace {
  const shelters = Array.isArray(item?.shelters) ? item.shelters : [];
  // x 가 경도, y 가 위도. 좌표 없는 장소는 null(Number(null) 이 0 이 되지 않게 먼저 거른다).
  const lat = item?.y == null ? NaN : Number(item.y);
  const lng = item?.x == null ? NaN : Number(item.x);

  return {
    coords: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
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

// 지도 페이지에는 점을 찍는 데 필요한 값만 넘긴다. 대피소 상세·사진 URL 까지 넣으면
// 필터 칩 하나 누를 때마다 수백 KB 가 브리지를 건넜다. 상세는 RN 의 placesById 에서 찾는다.
function toMapPayload(mapData: any) {
  return {
    details: Object.values(mapData?.details ?? {}).map((item: any) => ({
      placeId: item?.placeId,
      regionId: item?.regionId,
      x: item?.x,
      y: item?.y,
      accessibilityMatchStatus: item?.accessibilityMatchStatus,
    })),
    summaries: mapData?.summaries ?? {},
  };
}

// 대전 대략 범위. 내 위치가 이 안일 때만 목록에 거리를 붙인다(밖이면 수십 km 라 의미가 없다).
const DAEJEON_BOUNDS = { south: 36.18, north: 36.51, west: 127.24, east: 127.56 };

function isInDaejeon(location: { lat: number; lng: number }) {
  return (
    location.lat >= DAEJEON_BOUNDS.south &&
    location.lat <= DAEJEON_BOUNDS.north &&
    location.lng >= DAEJEON_BOUNDS.west &&
    location.lng <= DAEJEON_BOUNDS.east
  );
}

function getDistanceMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
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
      src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${mapKey}&autoload=false"
      onerror="window.__notify({ type: 'error', message: '카카오 지도 SDK 로드 실패' })"
    ></script>
    <script>
      // 줌 레벨별로 그릴 층. 6 이하는 장소 점, 그 위는 서버가 묶어 준 지역 버블(동 → 구 → 시).
      const DETAIL_MAX_LEVEL = 6;
      const DONG_MAX_LEVEL = 8;
      const GU_MAX_LEVEL = 10;
      // 버블을 누르면 한 단계 아래 층이 보이는 레벨까지는 들어간다(depth → 최대 레벨).
      const DRILL_LEVELS = { 0: GU_MAX_LEVEL, 1: DONG_MAX_LEVEL, 2: DETAIL_MAX_LEVEL };
      const SELECT_LEVEL = 6;
      const BASE_Z_INDEX = 10;
      const SELECTED_Z_INDEX = 9000;
      const FIT_PADDING = 40;

      function isKoreaRange(lat, lng) {
        return lat >= 32 && lat <= 39.5 && lng >= 124 && lng <= 132.5;
      }

      function toLatLng(item) {
        // Number(null) 은 0 이라 좌표 없는 장소가 (0,0) 으로 잡혔다. 빈 값은 먼저 거른다.
        if (item.x == null || item.y == null || item.x === '' || item.y === '') return null;
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

      function regionName(item) {
        const path = String(item.path || '');
        return path.includes(',')
          ? path.split(',')[0].trim()
          : path.split(' ').filter(Boolean).slice(-1)[0] || path;
      }

      function summaryLabel(item) {
        return regionName(item) + ' ' + item.count;
      }

      function regionKey(depth, regionId) {
        return depth + '-' + regionId;
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

      function detailMarkerStyle(markerColor, isSelected) {
        return [
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
      }

      // 오버레이는 map 없이 만들어 두고, 보일 때만 setMap 한다.
      function createSummaryOverlay(item, position, onSelect) {
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
          'cursor:pointer',
        ].join(';');
        el.textContent = summaryLabel(item);
        el.addEventListener('click', function() {
          onSelect(item);
        });

        return {
          overlay: new window.kakao.maps.CustomOverlay({
            position: position,
            content: el,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: BASE_Z_INDEX,
          }),
          el: el,
          shown: false,
        };
      }

      function createDetailOverlay(item, position, onSelect) {
        const el = document.createElement('div');
        const markerColor = accessibilityMatchColor(item.accessibilityMatchStatus);
        el.style.cssText = detailMarkerStyle(markerColor, false);
        el.addEventListener('click', function() {
          onSelect(item);
        });

        return {
          overlay: new window.kakao.maps.CustomOverlay({
            position: position,
            content: el,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: BASE_Z_INDEX,
          }),
          el: el,
          color: markerColor,
          shown: false,
          selected: false,
        };
      }

      function renderMap() {
        if (!window.kakao || !window.kakao.maps) {
          window.__notify({ type: 'error', message: '카카오 지도 객체가 없습니다' });
          return;
        }

        // 필터가 바뀌면 RN 이 __setMapData 로 갈아끼운다. 페이지를 다시 읽지 않으려고 let 으로 둔다.
        // details 는 좌표를 미리 풀어 둔 { item, coords } 목록이다. draw 마다 항목별로 다시 풀지 않는다.
        let details = [];
        let summaryLayers = { 0: [], 1: [], 2: [] };
        let summaryByKey = {};
        // 장소가 속한 지역 키(동·구·시). 버블을 눌렀을 때 그 지역 장소만 골라 맞추는 데 쓴다.
        let placeRegionKeys = {};
        let dataVersion = 0;

        function regionChain(regionId) {
          // 장소의 지역은 보통 동(depth2)이다. 부모를 따라 올라가며 구·시 키를 모은다.
          const keys = [];
          let current = null;
          for (let depth = 2; depth >= 0 && !current; depth -= 1) {
            current = summaryByKey[regionKey(depth, regionId)] || null;
          }
          while (current) {
            keys.push(regionKey(current.depth, current.regionId));
            current = current.depth > 0 && current.parentId != null
              ? summaryByKey[regionKey(current.depth - 1, current.parentId)] || null
              : null;
          }
          return keys;
        }

        function applyMapData(payload, version) {
          const next = payload || {};
          const summaries = next.summaries || {};
          summaryLayers = { 0: [], 1: [], 2: [] };
          summaryByKey = {};
          [0, 1, 2].forEach(function(depth) {
            (summaries['depth' + depth] || []).forEach(function(item) {
              const key = regionKey(depth, item.regionId);
              summaryByKey[key] = item;
              const coords = toLatLng(item);
              if (coords) summaryLayers[depth].push({ key: key, item: item, coords: coords });
            });
          });

          details = [];
          placeRegionKeys = {};
          (Array.isArray(next.details) ? next.details : []).forEach(function(item) {
            const coords = toLatLng(item);
            if (!coords) return;
            details.push({ item: item, coords: coords });
            placeRegionKeys[item.placeId] = regionChain(item.regionId);
          });
          dataVersion = version || 0;
        }
        applyMapData(window.__MAP_DATA__, 0);
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
        // 줌 버튼은 RN 쪽에서 하단 패널을 따라 움직이게 그린다(__zoomBy).

        // placeId·지역 키별로 만들어 둔 오버레이. 데이터가 바뀔 때만 비운다.
        let detailOverlays = new Map();
        let summaryOverlays = new Map();
        let shownEntries = new Set();
        let selectedPlaceId = window.__INITIAL_SELECTED_PLACE_ID__ || null;
        // 필터 결과가 지금 화면에 하나도 없으면 결과 전체가 보이게 맞춘다(데이터 교체 직후 한 번).
        let pendingAutoFit = false;
        let lastReadyKey = null;
        // 하단 패널이 덮고 있는 높이(px). 가운데 맞춤은 패널 위 남은 영역 기준으로 한다.
        let bottomInset = 0;
        let regionTrail = [];
        let trailAnchor = null;
        let pendingTrailAnchor = false;

        function setOverlayShown(entry, shown) {
          // 같은 상태로 setMap 을 또 부르면 카카오가 DOM 을 다시 붙인다. 바뀔 때만 부른다.
          if (entry.shown === shown) return;
          entry.shown = shown;
          entry.overlay.setMap(shown ? map : null);
        }

        function clearOverlayCache() {
          shownEntries.forEach(function(entry) {
            entry.overlay.setMap(null);
          });
          shownEntries = new Set();
          detailOverlays = new Map();
          summaryOverlays = new Map();
        }

        function setDetailSelected(entry, selected) {
          if (!entry || entry.selected === selected) return;
          entry.selected = selected;
          entry.el.style.cssText = detailMarkerStyle(entry.color, selected);
          entry.overlay.setZIndex(selected ? SELECTED_Z_INDEX : BASE_Z_INDEX);
        }

        // 선택이 바뀌면 이전·새 점 두 개만 고친다. 전체를 다시 그리면 탭할 때마다 깜빡였다.
        function paintSelected(nextPlaceId) {
          const prevPlaceId = selectedPlaceId;
          selectedPlaceId = nextPlaceId;
          if (prevPlaceId != null) {
            setDetailSelected(detailOverlays.get(String(prevPlaceId)), false);
          }
          if (nextPlaceId != null) {
            setDetailSelected(detailOverlays.get(String(nextPlaceId)), true);
          }
        }

        // 처음 화면에 들어올 때 만든다. 첫 화면에 수백 개를 한꺼번에 만들지 않으려는 것.
        function ensureDetailOverlay(entry) {
          const key = String(entry.item.placeId);
          let overlayEntry = detailOverlays.get(key);
          if (overlayEntry) return overlayEntry;

          overlayEntry = createDetailOverlay(
            entry.item,
            new window.kakao.maps.LatLng(entry.coords.lat, entry.coords.lng),
            function(item) {
              paintSelected(item.placeId);
              window.__notify({ type: 'marker', placeId: item.placeId });
            }
          );
          detailOverlays.set(key, overlayEntry);
          if (String(selectedPlaceId) === key) setDetailSelected(overlayEntry, true);
          return overlayEntry;
        }

        function ensureSummaryOverlay(entry) {
          let overlayEntry = summaryOverlays.get(entry.key);
          if (overlayEntry) return overlayEntry;

          overlayEntry = createSummaryOverlay(
            entry.item,
            new window.kakao.maps.LatLng(entry.coords.lat, entry.coords.lng),
            function(item) {
              fitRegion(item.depth, item.regionId);
            }
          );
          summaryOverlays.set(entry.key, overlayEntry);
          return overlayEntry;
        }

        function getUserLocationCoords() {
          const userLocation = window.__USER_LOCATION__;
          if (!userLocation) return null;

          const lat = Number(userLocation.lat);
          const lng = Number(userLocation.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          if (!isKoreaRange(lat, lng)) return null;

          return { lat: lat, lng: lng };
        }

        let userLocationOverlay = null;

        function drawUserLocation() {
          if (userLocationOverlay) {
            userLocationOverlay.setMap(null);
            userLocationOverlay = null;
          }
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

          userLocationOverlay = new window.kakao.maps.CustomOverlay({
            map: map,
            position: markerPosition,
            content: markerEl,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 10000,
          });
        }

        // 패널 위로 보이는 영역의 가운데(px). 패널이 화면 대부분을 덮어도 위쪽 틈은 남겨 둔다.
        function visibleCenterPoint() {
          const width = container.clientWidth;
          const height = container.clientHeight;
          const inset = Math.min(bottomInset, height * 0.85);
          return { x: width / 2, y: (height - inset) / 2 };
        }

        function visibleCenterCoords() {
          const point = visibleCenterPoint();
          const latLng = map.getProjection().coordsFromContainerPoint(
            new window.kakao.maps.Point(point.x, point.y)
          );
          return { lat: latLng.getLat(), lng: latLng.getLng() };
        }

        // 줌과 이동을 한 번에 한다. setLevel 뒤에 panTo 를 하면 두 번 튀었다.
        // anchor 는 줌하는 동안 화면에서 제자리인 점이라, 목표 점이 패널 위 가운데에 떨어지도록 거꾸로 구한다.
        function moveView(coords, level) {
          const projection = map.getProjection();
          const target = projection.containerPointFromCoords(
            new window.kakao.maps.LatLng(coords.lat, coords.lng)
          );
          const dest = visibleCenterPoint();
          const currentLevel = map.getLevel();

          if (level === currentLevel) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            map.panTo(projection.coordsFromContainerPoint(
              new window.kakao.maps.Point(
                width / 2 + target.x - dest.x,
                height / 2 + target.y - dest.y
              )
            ));
            return;
          }

          const scale = Math.pow(2, currentLevel - level);
          const anchor = new window.kakao.maps.Point(
            (dest.x - scale * target.x) / (1 - scale),
            (dest.y - scale * target.y) / (1 - scale)
          );
          map.setLevel(level, {
            animate: { duration: 300 },
            anchor: projection.coordsFromContainerPoint(anchor),
          });
        }

        function fitPoints(points, maxLevel) {
          if (!points.length) return;
          if (points.length === 1) {
            moveView(points[0], Math.min(map.getLevel(), maxLevel || SELECT_LEVEL));
            return;
          }

          const bounds = new window.kakao.maps.LatLngBounds();
          points.forEach(function(point) {
            bounds.extend(new window.kakao.maps.LatLng(point.lat, point.lng));
          });
          const inset = Math.min(bottomInset, container.clientHeight * 0.85);
          map.setBounds(bounds, FIT_PADDING, FIT_PADDING, FIT_PADDING + inset, FIT_PADDING);

          // 지역이 넓어 한 층 아래가 안 보이는 레벨에 멈췄으면 그 층이 보일 때까지 들어간다.
          if (maxLevel && map.getLevel() > maxLevel) {
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();
            moveView(
              { lat: (sw.getLat() + ne.getLat()) / 2, lng: (sw.getLng() + ne.getLng()) / 2 },
              maxLevel
            );
          }
        }

        function buildRegionTrail(depth, regionId) {
          const trail = [];
          let current = summaryByKey[regionKey(depth, regionId)] || null;
          while (current) {
            trail.unshift({
              depth: current.depth,
              regionId: current.regionId,
              name: regionName(current),
            });
            current = current.depth > 0 && current.parentId != null
              ? summaryByKey[regionKey(current.depth - 1, current.parentId)] || null
              : null;
          }
          return trail;
        }

        function notifyRegionTrail(trail) {
          regionTrail = trail;
          window.__notify({ type: 'regionTrail', trail: trail });
        }

        function fitRegion(depth, regionId) {
          const key = regionKey(depth, regionId);
          const points = [];
          details.forEach(function(entry) {
            if ((placeRegionKeys[entry.item.placeId] || []).indexOf(key) !== -1) {
              points.push(entry.coords);
            }
          });

          const maxLevel = DRILL_LEVELS[depth];
          if (points.length) {
            fitPoints(points, maxLevel);
          } else {
            const summary = summaryByKey[key];
            const coords = summary ? toLatLng(summary) : null;
            if (coords) moveView(coords, Math.min(map.getLevel(), maxLevel));
          }

          // 이동이 끝난 idle 에서 기준점을 잡는다. 거기서 멀어지면 경로 칩을 걷는다.
          trailAnchor = null;
          pendingTrailAnchor = true;
          notifyRegionTrail(buildRegionTrail(depth, regionId));
        }

        // 버블로 들어간 뒤 줌 아웃하거나 화면 절반 넘게 옮기면 경로가 더는 맞지 않으므로 지운다.
        function updateRegionTrailOnIdle() {
          if (!regionTrail.length) return;
          if (pendingTrailAnchor) {
            pendingTrailAnchor = false;
            trailAnchor = { center: map.getCenter(), level: map.getLevel() };
            return;
          }
          if (!trailAnchor) return;

          const point = map.getProjection().containerPointFromCoords(trailAnchor.center);
          const movedFar =
            Math.abs(point.x - container.clientWidth / 2) > container.clientWidth / 2 ||
            Math.abs(point.y - container.clientHeight / 2) > container.clientHeight / 2;
          if (map.getLevel() > trailAnchor.level || movedFar) {
            trailAnchor = null;
            notifyRegionTrail([]);
          }
        }

        function currentSummaryLayer(level) {
          if (level <= DONG_MAX_LEVEL) return summaryLayers[2];
          if (level <= GU_MAX_LEVEL) return summaryLayers[1];
          return summaryLayers[0];
        }

        // getBounds 는 draw 한 번에 한 번만 읽는다. 항목마다 부르면 수천 번이 된다.
        function currentBoundsBox() {
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          return {
            south: sw.getLat(),
            west: sw.getLng(),
            north: ne.getLat(),
            east: ne.getLng(),
          };
        }

        function isInBounds(box, coords) {
          return (
            coords.lat >= box.south &&
            coords.lat <= box.north &&
            coords.lng >= box.west &&
            coords.lng <= box.east
          );
        }

        // 한 프레임 안에 여러 번 요청돼도(선택 + 이동 + idle) 한 번만 그린다.
        let drawScheduled = false;
        function scheduleDraw() {
          if (drawScheduled) return;
          drawScheduled = true;
          window.requestAnimationFrame(function() {
            drawScheduled = false;
            draw();
          });
        }

        window.__setMapData = function(payload, version) {
          applyMapData(payload, version);
          clearOverlayCache();
          selectedPlaceId = null;
          lastReadyKey = null;
          pendingAutoFit = true;
          scheduleDraw();
        };

        window.__setUserLocation = function(location) {
          window.__USER_LOCATION__ = location;
          drawUserLocation();
        };

        window.__setBottomInset = function(inset) {
          bottomInset = Math.max(0, Number(inset) || 0);
        };

        window.__selectPlaceMarker = function(placeId) {
          const selected = details.find(function(entry) {
            return String(entry.item.placeId) === String(placeId);
          });
          if (!selected) return;

          // 홈에서 넘어온 장소로 가는 중이면 결과 전체 맞춤이 그 이동을 덮지 않게 한다.
          pendingAutoFit = false;
          paintSelected(selected.item.placeId);
          moveView(selected.coords, Math.min(map.getLevel(), SELECT_LEVEL));
          scheduleDraw();
        };

        window.__clearSelectedPlaceMarker = function() {
          paintSelected(null);
        };

        window.__moveToUserLocation = function() {
          const coords = getUserLocationCoords();
          if (!coords) return;
          moveView(coords, Math.min(map.getLevel(), SELECT_LEVEL));
        };

        window.__zoomBy = function(delta) {
          const currentLevel = map.getLevel();
          const nextLevel = Math.max(1, Math.min(14, currentLevel + delta));
          if (nextLevel === currentLevel) return;
          const point = visibleCenterPoint();
          map.setLevel(nextLevel, {
            animate: { duration: 200 },
            anchor: map.getProjection().coordsFromContainerPoint(
              new window.kakao.maps.Point(point.x, point.y)
            ),
          });
        };

        window.__fitRegion = function(depth, regionId) {
          fitRegion(depth, regionId);
        };

        function draw() {
          const box = currentBoundsBox();
          const level = map.getLevel();
          const showDetails = level <= DETAIL_MAX_LEVEL;
          const center = visibleCenterCoords();
          const lngScale = Math.cos(center.lat * Math.PI / 180);
          const nextShown = new Set();
          const visible = [];

          // 목록은 줌 층과 상관없이 화면 안의 장소를 보여 준다. 패널 위 가운데에서 가까운 순.
          details.forEach(function(entry) {
            if (!isInBounds(box, entry.coords)) return;
            const dLat = entry.coords.lat - center.lat;
            const dLng = (entry.coords.lng - center.lng) * lngScale;
            visible.push({ placeId: entry.item.placeId, distance: dLat * dLat + dLng * dLng });
            if (showDetails) nextShown.add(ensureDetailOverlay(entry));
          });

          if (!showDetails) {
            currentSummaryLayer(level).forEach(function(entry) {
              if (isInBounds(box, entry.coords)) nextShown.add(ensureSummaryOverlay(entry));
            });
          }

          // 화면 밖이나 다른 층으로 넘어간 것만 내리고, 새로 보이는 것만 올린다.
          shownEntries.forEach(function(entry) {
            if (!nextShown.has(entry)) setOverlayShown(entry, false);
          });
          nextShown.forEach(function(entry) {
            setOverlayShown(entry, true);
          });
          shownEntries = nextShown;

          if (pendingAutoFit) {
            pendingAutoFit = false;
            if (!visible.length && details.length) {
              // 맞춘 뒤 idle 이 다시 와서 그린다.
              fitPoints(details.map(function(entry) {
                return entry.coords;
              }));
              return;
            }
          }

          visible.sort(function(a, b) {
            return a.distance - b.distance;
          });
          const visiblePlaceIds = visible.map(function(item) {
            return item.placeId;
          });
          // 보이는 장소와 순서가 그대로면 RN 에 다시 보내지 않는다.
          const readyKey = visiblePlaceIds.join(',');
          if (readyKey === lastReadyKey) return;
          lastReadyKey = readyKey;

          window.__notify({
            type: 'ready',
            version: dataVersion,
            totalCount: details.length,
            visibleCount: visiblePlaceIds.length,
            visiblePlaceIds: visiblePlaceIds,
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
        draw();
        notifyViewport();
        // 줌이 끝나도 idle 이 오므로 zoom_changed 에는 따로 걸지 않는다(한 번 줌에 두 번 그리던 것).
        window.kakao.maps.event.addListener(map, 'idle', function() {
          scheduleDraw();
          notifyViewport();
          updateRegionTrailOnIdle();
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

const placeListStyle = { flex: 1 };
const placeKeyExtractor = (place: SelectedPlace) => String(place.placeId);

// 신고 폼 입력 등으로 MapScreen 이 다시 그려져도 목록 행은 그대로 두려고 memo 로 뺐다.
const PlaceListItem = memo(function PlaceListItem({
  place,
  distanceText,
  onPress,
}: {
  place: SelectedPlace;
  distanceText: string | null;
  onPress: (place: SelectedPlace) => void;
}) {
  const { t } = useTranslation();
  const typeCounts = useMemo(
    () => getShelterTypeCounts(place.shelters),
    [place.shelters],
  );

  return (
    <PlaceItem onPress={() => onPress(place)}>
      <PlaceTitleRow>
        <PlaceName numberOfLines={1}>{place.name}</PlaceName>
        {distanceText ? <PlaceDistance>{distanceText}</PlaceDistance> : null}
      </PlaceTitleRow>
      <PlaceAddress numberOfLines={1}>
        {place.address || '주소 정보 없음'}
      </PlaceAddress>
      <ChipRow>
        {typeCounts.map(item => (
          <TypeCountChip key={`${place.placeId}-${item.type}`}>
            <TypeCountText>
              {t(getShelterTypeTranslationKey(item.type) ?? item.label)}{' '}
              {item.count}
            </TypeCountText>
          </TypeCountChip>
        ))}
      </ChipRow>
    </PlaceItem>
  );
});

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
  const isMapFetching = useMapStore(state => state.isFetching);
  // 지도는 보이는 장소의 id 만 보내므로, 목록에 그릴 정보는 여기서 찾는다.
  const placesById = useMemo(() => {
    const places = new Map<number, SelectedPlace>();
    Object.values(mapData?.details ?? {}).forEach((item: any) => {
      places.set(Number(item?.placeId), normalizeSelectedPlace(item));
    });
    return places;
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
  const [regionTrail, setRegionTrail] = useState<RegionTrailItem[]>([]);
  const mapViewRef = useRef<MapViewState | null>(null);
  const webViewRef = useRef<WebView>(null);
  const pendingFocusPlaceIdRef = useRef<number | null>(null);
  const selectedPlaceIdRef = useRef<number | null>(null);
  // 같은 id 목록이 반복해서 오면(이동만 하고 보이는 장소는 그대로) 목록을 다시 그리지 않는다.
  const visiblePlaceKeyRef = useRef('');
  // 홈에서 넘긴 포커스를 한 번만 쓴다. 안 그러면 필터를 바꿀 때마다 그 장소로 다시 튀었다.
  const consumedFocusKeyRef = useRef('');

  // 새 데이터가 도착하면 선택·목록을 비운다. 필터를 누른 순간에는 비우지 않는다.
  // 그 사이 지도는 옛 데이터를 그대로 그리고 있으므로, 목록도 그것과 맞춰 둔다.
  useEffect(() => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    visiblePlaceKeyRef.current = '';
    setSelectedPlace(null);
    setVisiblePlaces([]);
    setPanelReady(false);
  }, [mapData]);

  const expandedPanelHeight = Math.round(
    (mapFrameHeight || screenHeight) * 0.9,
  );
  const collapsedPanelHeight = 42;
  const panelRange = expandedPanelHeight - collapsedPanelHeight;
  // 패널은 높이를 바꾸지 않고 아래로 밀어 숨긴다. 높이 애니메이션은 매 프레임 레이아웃을 다시 계산해 끊겼다.
  const panelTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [panelRange, 0],
  });
  const bottomInset = isPanelExpanded ? expandedPanelHeight : collapsedPanelHeight;

  // 지도 페이지는 한 번만 읽는다. 데이터·현재 위치가 바뀌면 HTML 을 새로 만드는 대신
  // __setMapData / __setUserLocation 으로 주입한다. HTML 을 바꾸면 WebView 가 카카오 SDK 부터
  // 다시 받아 지도를 새로 만들기 때문에(필터 칩 하나 누를 때마다) 체감이 크게 나빴다.
  const latestMapDataRef = useRef(mapData);
  latestMapDataRef.current = mapData;
  const latestUserLocationRef = useRef(userLocation);
  latestUserLocationRef.current = userLocation;
  const latestBottomInsetRef = useRef(bottomInset);
  latestBottomInsetRef.current = bottomInset;
  // HTML 에 구워 넣은 값. WebView 가 스스로 다시 로드되면 페이지는 이 값으로 돌아간다.
  const bakedRef = useRef({ mapData, userLocation, bottomInset: 0, version: 0 });
  // 지금 페이지가 갖고 있는 값. 이것과 최신 값이 다르면 주입한다.
  const sentRef = useRef({ ...bakedRef.current });
  // 데이터를 넣을 때마다 올린다. ready 의 version 이 다르면 옛 데이터 기준 목록이라 버린다.
  const mapDataVersionRef = useRef(0);
  const mapPageReadyRef = useRef(false);

  const mapHtml = useMemo(() => {
    const mapKey =
      Config.KAKAO_MAP_APP_KEY ?? Config.KAKAO_NATIVE_APP_KEY ?? '';
    if (!mapKey) return '';

    const baked = bakedRef.current;
    return buildMapHtml(
      mapKey,
      JSON.stringify(toMapPayload(baked.mapData)),
      JSON.stringify(mapViewRef.current),
      JSON.stringify(baked.userLocation),
      JSON.stringify(selectedPlaceIdRef.current),
    );
  }, []);

  const webViewSource = useMemo(() => ({ html: mapHtml }), [mapHtml]);

  const injectMapScript = useCallback((script: string) => {
    webViewRef.current?.injectJavaScript(`${script}\ntrue;`);
  }, []);

  const syncMapPage = useCallback(() => {
    if (!mapPageReadyRef.current) return;

    const scripts: string[] = [];
    const next = { ...sentRef.current };

    if (sentRef.current.mapData !== latestMapDataRef.current) {
      mapDataVersionRef.current += 1;
      next.mapData = latestMapDataRef.current;
      next.version = mapDataVersionRef.current;
      scripts.push(
        `if (window.__setMapData) window.__setMapData(${JSON.stringify(
          toMapPayload(next.mapData),
        )}, ${next.version});`,
      );
    }
    if (sentRef.current.userLocation !== latestUserLocationRef.current) {
      next.userLocation = latestUserLocationRef.current;
      scripts.push(
        `if (window.__setUserLocation) window.__setUserLocation(${JSON.stringify(
          next.userLocation ?? null,
        )});`,
      );
    }
    if (sentRef.current.bottomInset !== latestBottomInsetRef.current) {
      next.bottomInset = latestBottomInsetRef.current;
      scripts.push(
        `if (window.__setBottomInset) window.__setBottomInset(${next.bottomInset});`,
      );
    }
    if (!scripts.length) return;

    sentRef.current = next;
    injectMapScript(scripts.join('\n'));
  }, [injectMapScript]);

  // 아래 포커스 effect 의 __selectPlaceMarker 보다 먼저 돌아야 새 데이터에서 찾는다.
  useEffect(() => {
    syncMapPage();
  }, [mapData, userLocation, bottomInset, syncMapPage]);

  const handleMapLoadStart = useCallback(() => {
    mapPageReadyRef.current = false;
    sentRef.current = { ...bakedRef.current };
    setRegionTrail([]);
  }, []);

  const isPanelExpandedRef = useRef(isPanelExpanded);
  isPanelExpandedRef.current = isPanelExpanded;
  const panelRangeRef = useRef(panelRange);
  panelRangeRef.current = panelRange;

  const animatePanelTo = useCallback(
    (expanded: boolean) => {
      setIsPanelExpanded(expanded);
      Animated.timing(panelAnimation, {
        toValue: expanded ? 1 : 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
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

  const selectPlaceMarker = useCallback(
    (placeId: number) => {
      injectMapScript(
        `if (window.__selectPlaceMarker) window.__selectPlaceMarker(${JSON.stringify(
          placeId,
        )});`,
      );
    },
    [injectMapScript],
  );

  const handleMessage = (event: MapMessageEvent) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data) as WebMessagePayload;

      if (parsed.type === 'marker' && parsed.placeId != null) {
        const place = placesById.get(Number(parsed.placeId));
        if (!place) return;
        pendingFocusPlaceIdRef.current = null;
        selectedPlaceIdRef.current = place.placeId;
        setMapError('');
        setSelectedPlace(place);
        animatePanelTo(true);
        return;
      }

      if (parsed.type === 'error') {
        setMapError(parsed.message ?? '지도 로드에 실패했습니다.');
        return;
      }

      if (parsed.type === 'regionTrail') {
        setRegionTrail(parsed.trail ?? []);
        return;
      }

      if (parsed.type === 'ready') {
        setMapError('');
        // 페이지가 막 뜬 경우, 로딩 중에 바뀐 데이터·위치를 지금 넣는다.
        if (!mapPageReadyRef.current) {
          mapPageReadyRef.current = true;
          syncMapPage();
        }
        // 새 데이터를 넣었다면 이 메시지의 목록은 옛 데이터 기준이니 다음 ready 를 기다린다.
        if (parsed.version === sentRef.current.version) {
          const ids = parsed.visiblePlaceIds ?? [];
          const key = ids.join(',');
          if (key !== visiblePlaceKeyRef.current) {
            visiblePlaceKeyRef.current = key;
            setVisiblePlaces(
              ids
                .map(id => placesById.get(Number(id)))
                .filter((place): place is SelectedPlace => !!place),
            );
          }
          setPanelReady(true);
        }
        if (pendingFocusPlaceIdRef.current) {
          const pendingFocusPlaceId = pendingFocusPlaceIdRef.current;
          pendingFocusPlaceIdRef.current = null;
          selectPlaceMarker(pendingFocusPlaceId);
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
    injectMapScript('if (window.__moveToUserLocation) window.__moveToUserLocation();');
  };

  const handleZoom = (delta: 1 | -1) => {
    injectMapScript(`if (window.__zoomBy) window.__zoomBy(${delta});`);
  };

  const handleRegionTrailPress = (item: RegionTrailItem) => {
    injectMapScript(
      `if (window.__fitRegion) window.__fitRegion(${item.depth}, ${JSON.stringify(
        item.regionId,
      )});`,
    );
  };

  const handlePlacePress = useCallback(
    (place: SelectedPlace) => {
      pendingFocusPlaceIdRef.current = null;
      selectedPlaceIdRef.current = place.placeId;
      setSelectedPlace(place);
      animatePanelTo(true);
      selectPlaceMarker(place.placeId);
    },
    [animatePanelTo, selectPlaceMarker],
  );

  useEffect(() => {
    const focusPlaceId = route.params?.focusPlaceId;
    if (!focusPlaceId) return;

    const focusKey = `${focusPlaceId}-${route.params?.focusNonce ?? ''}`;
    if (consumedFocusKeyRef.current === focusKey) return;

    // 데이터가 아직 없으면 도착했을 때 다시 시도한다.
    const place = placesById.get(Number(focusPlaceId));
    if (!place) return;
    consumedFocusKeyRef.current = focusKey;

    pendingFocusPlaceIdRef.current = focusPlaceId;
    selectedPlaceIdRef.current = focusPlaceId;
    setSelectedPlace(place);
    animatePanelTo(true);
    selectPlaceMarker(focusPlaceId);
  }, [
    animatePanelTo,
    placesById,
    route.params?.focusNonce,
    route.params?.focusPlaceId,
    selectPlaceMarker,
  ]);

  const handleBackToPlaceList = useCallback(() => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    setSelectedPlace(null);
    injectMapScript(
      'if (window.__clearSelectedPlaceMarker) window.__clearSelectedPlaceMarker();',
    );
  }, [injectMapScript]);

  // 안드로이드 뒤로가기는 상세 → 목록, 접근성 안내 닫기 순으로 먼저 소비한다.
  // 모달(신고·사진)은 각 Modal 의 onRequestClose 가 처리한다.
  const backStateRef = useRef({ selectedPlace, isAccessibilityInfoVisible });
  backStateRef.current = { selectedPlace, isAccessibilityInfoVisible };
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (backStateRef.current.isAccessibilityInfoVisible) {
            setIsAccessibilityInfoVisible(false);
            return true;
          }
          if (backStateRef.current.selectedPlace) {
            handleBackToPlaceList();
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [handleBackToPlaceList]),
  );

  // 내 위치가 대전 안일 때만 목록에 거리를 붙인다.
  const distanceOrigin = useMemo(
    () => (userLocation && isInDaejeon(userLocation) ? userLocation : null),
    [userLocation],
  );
  const renderPlaceItem = useCallback(
    ({ item }: { item: SelectedPlace }) => (
      <PlaceListItem
        place={item}
        distanceText={
          distanceOrigin && item.coords
            ? formatDistance(getDistanceMeters(distanceOrigin, item.coords))
            : null
        }
        onPress={handlePlacePress}
      />
    ),
    [distanceOrigin, handlePlacePress],
  );

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
      // 업로드는 파일 경로(uri)로 하므로 base64 는 받지 않는다. 받으면 수 MB 문자열이 상태에 남는다.
      quality: 0.8,
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
        })),
      });
      setReportShelter(null);
      alert(t('map.report.success'));
    } catch (error: any) {
      if (__DEV__) {
        console.log('[report-submit] failed', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
      }
      alert(error?.response?.data?.message ?? t('map.report.failed'));
    }
  };

  const openAccessibilityInfo = () => {
    setIsAccessibilityInfoVisible(true);
  };
  const closeAccessibilityInfo = () => {
    setIsAccessibilityInfoVisible(false);
  };

  // 펼침 상태·이동 범위는 ref 로 읽어서, 펼칠 때마다 PanResponder 를 새로 만들지 않는다.
  const panelPanResponder = useRef(
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
        panelDragStartRef.current = isPanelExpandedRef.current ? 1 : 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const nextValue =
          panelDragStartRef.current - gestureState.dy / panelRangeRef.current;
        panelAnimation.setValue(Math.max(0, Math.min(1, nextValue)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          Math.abs(gestureState.dy) <= 6 &&
          Math.abs(gestureState.dx) <= 6
        ) {
          animatePanelTo(!isPanelExpandedRef.current);
          return;
        }

        const shouldExpand =
          gestureState.vy < -0.35 ||
          (gestureState.vy <= 0.35 &&
            panelDragStartRef.current -
              gestureState.dy / panelRangeRef.current >
              0.45);
        animatePanelTo(shouldExpand);
      },
      onPanResponderTerminate: () => {
        animatePanelTo(isPanelExpandedRef.current);
      },
      onShouldBlockNativeResponder: () => false,
    }),
  ).current;

  // 줌·내 위치 버튼은 패널 윗변을 따라 올라가고, 패널 위에 남은 자리가 모자라면 숨긴다.
  const mapControlCount = userLocation ? 3 : 2;
  const mapControlsHeight =
    mapControlCount * MAP_CONTROL_SIZE + (mapControlCount - 1) * MAP_CONTROL_GAP;
  const mapControlsTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -panelRange],
  });
  const mapControlsHideAt = Math.min(
    1,
    Math.max(
      0,
      ((mapFrameHeight || screenHeight) -
        collapsedPanelHeight -
        mapControlsHeight -
        MAP_CONTROL_MARGIN * 2) /
        Math.max(1, panelRange),
    ),
  );
  const mapControlsOpacity = panelAnimation.interpolate({
    inputRange:
      mapControlsHideAt > 0.05
        ? [0, mapControlsHideAt - 0.05, mapControlsHideAt]
        : [0, 1],
    outputRange: mapControlsHideAt > 0.05 ? [1, 1, 0] : [0, 0],
    extrapolate: 'clamp',
  });
  const areMapControlsVisible = !isPanelExpanded && mapControlsHideAt > 0.05;

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
            onLoadStart={handleMapLoadStart}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            // 지도 팬·줌을 GPU 레이어에서 합성한다. 기기에서 깜빡임이 보이면 이 줄을 뺀다.
            androidLayerType="hardware"
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

        {regionTrail.length ? (
          <RegionTrailRow>
            {regionTrail.map((item, index) => (
              <RegionTrailItemView key={`${item.depth}-${item.regionId}`}>
                {index > 0 ? (
                  <ChevronRight color="#6b7280" size={14} strokeWidth={2.6} />
                ) : null}
                <RegionTrailChip
                  $current={index === regionTrail.length - 1}
                  onPress={() => handleRegionTrailPress(item)}
                >
                  <RegionTrailText $current={index === regionTrail.length - 1}>
                    {item.name}
                  </RegionTrailText>
                </RegionTrailChip>
              </RegionTrailItemView>
            ))}
          </RegionTrailRow>
        ) : null}

        {/* 필터를 바꾸는 동안 화면 전체를 덮지 않고 지도 귀퉁이에만 표시한다. */}
        {isMapFetching ? (
          <MapFetchingBadge>
            <ActivityIndicator color="#2563eb" size="small" />
          </MapFetchingBadge>
        ) : null}
      </MapFrame>

      {mapError ? <ErrorText>{mapError}</ErrorText> : null}

      {mapHtml ? (
        <MapControls
          pointerEvents={areMapControlsVisible ? 'box-none' : 'none'}
          style={{
            bottom: collapsedPanelHeight + MAP_CONTROL_MARGIN,
            opacity: mapControlsOpacity,
            transform: [{ translateY: mapControlsTranslateY }],
          }}
        >
          <MapControlButton
            accessibilityLabel="확대"
            onPress={() => handleZoom(-1)}
          >
            <Plus color="#111827" size={20} strokeWidth={2.6} />
          </MapControlButton>
          <MapControlButton
            accessibilityLabel="축소"
            onPress={() => handleZoom(1)}
          >
            <Minus color="#111827" size={20} strokeWidth={2.6} />
          </MapControlButton>
          {userLocation ? (
            <MapControlButton
              accessibilityLabel={t('map.labels.nearbyLocation')}
              onPress={handleMoveToUserLocation}
            >
              <LocateFixed color="#2563eb" size={20} strokeWidth={2.6} />
            </MapControlButton>
          ) : null}
        </MapControls>
      ) : null}

      <BottomPanel
        style={{
          height: expandedPanelHeight,
          transform: [{ translateY: panelTranslateY }],
        }}
      >
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

            {!mapData || !panelReady ? (
              <PanelLoading>
                <ActivityIndicator color="#2563eb" />
                <PanelLoadingText>
                  {t('map.labels.loadingShelters')}
                </PanelLoadingText>
              </PanelLoading>
            ) : (
              // 광역 줌에서는 수백 곳이 한꺼번에 들어오므로 화면에 보이는 행만 만든다.
              <FlatList
                style={placeListStyle}
                data={visiblePlaces}
                keyExtractor={placeKeyExtractor}
                renderItem={renderPlaceItem}
                initialNumToRender={12}
                windowSize={7}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <EmptyPanelText>
                    현재 화면에 표시할 대피소가 없습니다.
                  </EmptyPanelText>
                }
              />
            )}
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
  overflow: hidden;
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

const RegionTrailRow = styled.View`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 56px;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
`;

const RegionTrailItemView = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

const RegionTrailChip = styled.TouchableOpacity<{ $current: boolean }>`
  padding: 6px 10px;
  border-radius: 999px;
  background-color: ${({ $current }) => ($current ? '#2563eb' : '#ffffff')};
  shadow-color: #111827;
  shadow-opacity: 0.12;
  shadow-radius: 6px;
  shadow-offset: 0 2px;
  elevation: 3;
`;

const RegionTrailText = styled.Text<{ $current: boolean }>`
  color: ${({ $current }) => ($current ? '#ffffff' : '#111827')};
  font-size: 12px;
  font-weight: 700;
`;

const MapFetchingBadge = styled.View`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: #ffffff;
  elevation: 3;
`;

const MAP_CONTROL_SIZE = 40;
const MAP_CONTROL_GAP = 8;
const MAP_CONTROL_MARGIN = 12;

const MapControls = styled(Animated.View)`
  position: absolute;
  right: 24px;
  gap: ${MAP_CONTROL_GAP}px;
`;

const MapControlButton = styled.TouchableOpacity.attrs({ activeOpacity: 0.6 })`
  width: ${MAP_CONTROL_SIZE}px;
  height: ${MAP_CONTROL_SIZE}px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background-color: #ffffff;
  shadow-color: #111827;
  shadow-opacity: 0.14;
  shadow-radius: 6px;
  shadow-offset: 0 2px;
  elevation: 4;
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

const PlaceTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const PlaceName = styled.Text`
  flex-shrink: 1;
  color: #111827;
  font-size: 15px;
  font-weight: 800;
`;

const PlaceDistance = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
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
