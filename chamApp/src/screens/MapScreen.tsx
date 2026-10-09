import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Share,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import Config from 'react-native-config';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { WebView } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewOpenWindowEvent,
} from 'react-native-webview/lib/WebViewTypes';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Camera,
  LocateFixed,
  Minus,
  Navigation,
  Phone,
  Plus,
  Share2,
  Square,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import i18nInstance from '../i18n';
import CurrentLocationBar from '../components/CurrentLocationBar.tsx';
import MapSearchFilters from '../components/MapSearchFilters.tsx';
import FullscreenImageViewer from '../components/ui/FullscreenImageViewer.tsx';
import ImageAttachButton from '../components/ui/ImageAttachButton.tsx';
import SubmitButton from '../components/ui/SubmitButton.tsx';
import { loadCurrentLocation } from '../hooks/useCurrentLocation.ts';
import { fetchPlaceBoundary, useFetchMap } from '../services/map.service.ts';
import type { ShelterImageCategory } from '../services/report.service.ts';
import { useMapStore } from '../store/map.ts';
import { useLocationStore } from '../store/location.ts';
import { useShelterReportStore } from '../store/shelterReport.ts';
import { useUserStore } from '../store/user.ts';
import { useDialogUtil } from '../utils/dialog';
import {
  evaluatePlaceMatch,
  isAccessibilityFeature,
  type AccessibilityFeature,
  type AccessibilityMatchStatus,
} from '../utils/accessibilityMatch';
import { getAccessibilityChips } from '../utils/shelterLabels.ts';
import {
  ACCESSIBILITY_ALL_LABEL,
  SHELTER_ALL_LABEL,
  accessibilityValueMap,
  shelterTypeLabelMap,
  shelterTypeTranslationKeys,
  shelterTypeValueMap,
  useMapFilterStore,
} from '../store/mapFilters.ts';
import type { RootTabParamList } from '../navigation/AppNavigator.tsx';
import { colors } from '../theme/index.ts';
import {
  MAP_CONTROL_SIZE,
  MAP_CONTROL_GAP,
  MAP_CONTROL_MARGIN,
  PREVIEW_STRIP_GAP,
  PREVIEW_STRIP_SPACE,
} from './MapScreen.constants.ts';
import {
  Screen,
  Header,
  MapFrame,
  LoadingBox,
  EmptyText,
  ErrorText,
  MapErrorOverlay,
  MapErrorCard,
  RetryButton,
  RetryButtonText,
  PanelErrorRow,
  PanelErrorText,
  RegionTrailRow,
  RegionTrailItemView,
  RegionTrailChip,
  RegionTrailText,
  MapFetchingBadge,
  MapControls,
  MapControlButton,
  BottomPanel,
  AccessibilityInfoOverlay,
  AccessibilityInfoCard,
  AccessibilityInfoHeader,
  AccessibilityInfoTitle,
  AccessibilityInfoCloseButton,
  AccessibilityInfoDescription,
  AccessibilityInfoList,
  AccessibilityInfoText,
  AccessibilityLegendList,
  AccessibilityLegendRow,
  AccessibilityLegendDot,
  AccessibilityLegendText,
  AccessibilityInfoButton,
  AccessibilityInfoButtonText,
  PanelHandleButton,
  PanelHandleBar,
  PanelHeader,
  PanelTitle,
  PanelCount,
  BackButton,
  PanelScroll,
  PanelBody,
  PanelLayer,
  DetailLayer,
  UnlocatedToggle,
  UnlocatedToggleText,
  PanelLoading,
  PanelLoadingText,
  PlaceItem,
  PlaceTitleRow,
  PlaceName,
  MatchBadge,
  MatchBadgeText,
  PlaceDistance,
  PlaceAddress,
  DetailAddress,
  DetailDescription,
  DetailMeta,
  ShelterItem,
  ShelterImageFrame,
  ShelterImage,
  ImageNavButton,
  ImageCounter,
  ImageCounterText,
  ShelterTitleRow,
  ShelterName,
  ShelterMetaRow,
  ShelterMetaIconText,
  ShelterMetaText,
  ShelterMeta,
  ChipRow,
  TypeChip,
  TypeChipText,
  TypeCountChip,
  TypeCountText,
  AccessChip,
  AccessChipText,
  ReportButton,
  ReportButtonText,
  ReportDoneBadge,
  ReportDoneBadgeText,
  ReportLoginButton,
  ReportLoginButtonText,
  DirectionsButton,
  DirectionsButtonText,
  DetailActionRow,
  SecondaryActionButton,
  SecondaryActionButtonText,
  PreviewStrip,
  PreviewCard,
  PreviewOpenButton,
  PreviewBody,
  PreviewMeta,
  PreviewMore,
  PreviewMoreText,
  PreviewCloseButton,
  ShelterContactRow,
  PhoneButton,
  PhoneButtonText,
  ReportModalOverlay,
  ReportModalCard,
  ReportModalHeader,
  ReportModalTitle,
  ReportCloseButton,
  ReportShelterName,
  ReportModalScroll,
  ReportField,
  ReportEtcField,
  ReportLabel,
  ReportTextArea,
  ReportToggleGrid,
  ReportToggle,
  ReportToggleText,
  ReportImageItem,
  ReportImagePreview,
  ReportImageBody,
  ReportImageTopRow,
  ReportImageName,
  ReportImageRemoveButton,
  ReportCategoryRow,
  ReportCategoryChip,
  ReportCategoryText,
  ReportImageDescriptionInput,
  EmptyList,
  EmptyPanelText,
} from './MapScreen.styles.ts';

const defaultShelterImage = require('../assets/images/shelter.png') as ImageSourcePropType;
const reportModalScrollContentStyle = { flexGrow: 1 };

function getShelterTypeLabel(type?: string) {
  if (!type) return 'map.labels.unknownType';
  return shelterTypeLabelMap[type] ?? type;
}

// 결과는 t() 에 넘긴다. 유형이 비면(목록 집계에선 'UNKNOWN') 번역된 '유형 정보 없음'.
function getShelterTypeTranslationKey(type?: string) {
  if (!type || type === 'UNKNOWN') return 'map.labels.unknownType';
  return shelterTypeTranslationKeys[type] ?? null;
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
  surveyStatus?: string;
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
  type: 'marker' | 'ready' | 'error' | 'regionTrail' | 'mapTap';
  placeId?: number;
  version?: number;
  trail?: RegionTrailItem[];
  // 지도 페이지는 문구 대신 오류 종류(code)와 원본 메시지만 보낸다. 화면 문구는 RN 이 번역한다.
  code?: string;
  message?: string;
  totalCount?: number;
  visibleCount?: number;
  visiblePlaceIds?: number[];
}

function normalizeSelectedPlace(item: any, fallbackName: string): SelectedPlace {
  const shelters = Array.isArray(item?.shelters) ? item.shelters : [];
  // x 가 경도, y 가 위도. 좌표 없는 장소는 null(Number(null) 이 0 이 되지 않게 먼저 거른다).
  const lat = item?.y == null ? NaN : Number(item.y);
  const lng = item?.x == null ? NaN : Number(item.x);

  return {
    coords: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    placeId: item?.placeId,
    name: item?.name || fallbackName,
    address: item?.address || item?.oldAddress || '',
    description: item?.description || '',
    shelterCount: shelters.length,
    accessibilityMatchStatus: item?.accessibilityMatchStatus,
    shelters: shelters.map((shelter: any) => ({
      shelterId: shelter.shelterId,
      name: shelter.name || item?.name || fallbackName,
      shelterType: shelter.shelterType,
      capacity: shelter.capacity,
      area: shelter.area,
      managingAuthorityName: shelter.managingAuthorityName,
      managingAuthorityTelNo: shelter.managingAuthorityTelNo,
      accessibleToilet: shelter.accessibleToilet,
      ramp: shelter.ramp,
      elevator: shelter.elevator,
      brailleBlock: shelter.brailleBlock,
      etcFacilities: shelter.etcFacilities ?? undefined,
      surveyStatus: shelter.surveyStatus ?? undefined,
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

// 지도 페이지에는 점을 찍는 데 필요한 값만 넘긴다. 대피소 상세·사진 URL 까지 넣으면
// 필터 칩 하나 누를 때마다 수백 KB 가 브리지를 건넜다. 상세는 RN 의 placesById 에서 찾는다.
// 매칭 색은 서버 값 대신 RN 이 계산한 matchStatus 로 넣는다(접근성 칩을 눌러도 다시 받지 않음).
function toMapPayload(
  mapData: any,
  matchStatus: Record<string, AccessibilityMatchStatus>,
) {
  return {
    details: Object.values(mapData?.details ?? {}).map((item: any) => ({
      placeId: item?.placeId,
      regionId: item?.regionId,
      x: item?.x,
      y: item?.y,
      accessibilityMatchStatus: matchStatus[String(item?.placeId)] ?? 'NONE',
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

// 카카오맵 웹 링크(앱이 있으면 OS 가 넘겨줄 수 있음). 이름의 콤마는 좌표 구분자와 겹쳐 뺀다.
function getDirectionsUrl(place: SelectedPlace) {
  if (!place.coords) return null;
  const name = encodeURIComponent(place.name.replace(/,/g, ' '));
  return `https://map.kakao.com/link/to/${name},${place.coords.lat},${place.coords.lng}`;
}

// 앱 길찾기는 도보 기준. 출발지를 비우면 각 앱이 현재 위치에서 시작한다.
// 앱이 없으면 openURL 이 실패하고, 그때 웹 주소로 넘어간다(Android 11+ 는 매니페스트 <queries> 필요).
const NAVER_APP_NAME = 'kr.or.cham.equality';

function getKakaoMapAppUrl(place: SelectedPlace) {
  if (!place.coords) return null;
  return `kakaomap://route?ep=${place.coords.lat},${place.coords.lng}&by=FOOT`;
}

function getNaverMapAppUrl(place: SelectedPlace) {
  if (!place.coords) return null;
  return `nmap://route/walk?dlat=${place.coords.lat}&dlng=${
    place.coords.lng
  }&dname=${encodeURIComponent(place.name)}&appname=${NAVER_APP_NAME}`;
}

// 네이버 웹 길찾기 주소 형식은 자주 바뀌어, 앱이 없으면 주소(없으면 이름) 검색으로 연다.
function getNaverMapWebUrl(place: SelectedPlace) {
  return `https://map.naver.com/p/search/${encodeURIComponent(
    place.address || place.name,
  )}`;
}

// 다이얼러에는 숫자만 넘긴다(공백·하이픈·괄호가 섞인 원본 표기 대비).
function getTelUrl(telNo?: string) {
  const digits = (telNo ?? '').replace(/\D/g, '');
  return digits ? `tel:${digits}` : null;
}

function buildMapHtml(
  mapKey: string,
  mapPayloadJson: string,
  userLocationJson: string,
  initialSelectedPlaceIdJson: string,
  htmlLang: string,
) {
  return `<!DOCTYPE html>
<html lang="${htmlLang}">
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
      window.__USER_LOCATION__ = ${userLocationJson};
      window.__INITIAL_SELECTED_PLACE_ID__ = ${initialSelectedPlaceIdJson};
      window.__notify = function(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      };
      window.onerror = function(message) {
        window.__notify({ type: 'error', code: 'script', message: String(message || '') });
      };
    </script>
    <script
      src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${mapKey}&autoload=false"
      onerror="window.__notify({ type: 'error', code: 'sdkLoad' })"
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
      // 핀은 clickable 이 아니라 핀 탭도 지도 click 으로 내려온다(Android 는 둘 다 온다).
      // 핀을 누른 직후 이 시간 안의 지도 click 은 빈 곳 탭으로 치지 않는다.
      var PIN_TAP_GUARD_MS = 350;
      // 핀을 고른 직후 이 시간 안에 패널·미리보기로 가려지면 그 핀을 보이는 곳으로 옮긴다.
      var RECENTER_WINDOW_MS = 800;
      var lastOverlayTapAt = 0;

      // 매칭이 좋은 점이 위로 오게 한다(겹쳐도 접근 가능한 곳이 가려지지 않게).
      function matchZIndex(status) {
        var value = String(status || '').toUpperCase();
        if (value === 'ACCESSIBLE') return BASE_Z_INDEX + 3;
        if (value === 'PARTIAL') return BASE_Z_INDEX + 2;
        if (value === 'INACCESSIBLE') return BASE_Z_INDEX;
        return BASE_Z_INDEX + 1;
      }

      // 누르는 순간 살짝 줄여 눌렸다는 걸 보여 주고, 탭 시각을 적어 지도 click 과 구분한다.
      function attachPressFeedback(el) {
        function release() {
          el.style.transform = '';
        }
        el.addEventListener('pointerdown', function() {
          lastOverlayTapAt = Date.now();
          el.style.transform = 'scale(.94)';
        });
        el.addEventListener('pointerup', release);
        el.addEventListener('pointercancel', release);
        el.addEventListener('pointerleave', release);
      }

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
          'transition:width .12s ease,height .12s ease,box-shadow .12s ease,transform .08s ease',
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
          'transition:transform .08s ease',
        ].join(';');
        el.textContent = summaryLabel(item);
        attachPressFeedback(el);
        el.addEventListener('click', function() {
          lastOverlayTapAt = Date.now();
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
        attachPressFeedback(el);
        el.addEventListener('click', function() {
          lastOverlayTapAt = Date.now();
          onSelect(item);
        });

        return {
          overlay: new window.kakao.maps.CustomOverlay({
            position: position,
            content: el,
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: matchZIndex(item.accessibilityMatchStatus),
          }),
          el: el,
          // 매칭 상태는 __setMatchStatus 가 item 에 고쳐 쓴다. 선택 해제 때 zIndex 를 여기서 다시 읽는다.
          item: item,
          color: markerColor,
          shown: false,
          selected: false,
        };
      }

      function renderMap() {
        if (!window.kakao || !window.kakao.maps) {
          window.__notify({ type: 'error', code: 'kakaoMissing' });
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
        // 처음 시점은 대전 시청 고정. 시점을 RN 에 보내던 viewport 메시지는 읽는 곳이 없어 뺐다.
        const initialLevel = 9;
        const center = new window.kakao.maps.LatLng(36.3504, 127.3845);

        const map = new window.kakao.maps.Map(container, {
          center: center,
          level: initialLevel,
          mapTypeId: window.kakao.maps.MapTypeId.ROADMAP,
        });

        map.relayout();
        map.setCenter(center);
        map.setLevel(initialLevel);
        map.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);
        // 첫 시점은 하단 패널(반 정지점)이 덮지 않은 영역 가운데에 시청이 오게 한다.
        // 사용자가 지도를 만지거나 코드가 다른 곳으로 옮기기 전까지만 inset 변화에 맞춰 다시 잡는다.
        var initialViewPending = true;
        function centerInitialView() {
          if (!initialViewPending) return;
          map.setCenter(center);
          var height = container.clientHeight;
          if (!height) return;
          var shift = Math.min(bottomInset, height * 0.85) / 2;
          if (shift <= 0) return;
          var projection = map.getProjection();
          var point = projection.containerPointFromCoords(center);
          map.setCenter(
            projection.coordsFromContainerPoint(
              new window.kakao.maps.Point(point.x, point.y + shift)
            )
          );
        }
        setTimeout(function() {
          map.relayout();
          centerInitialView();
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
        // 기기의 '애니메이션 줄이기' 설정. 켜져 있으면 이동·줌을 애니메이션 없이 바로 한다.
        var reduceMotion = false;
        let regionTrail = [];
        let trailAnchor = null;
        let pendingTrailAnchor = false;
        // 핀을 막 고른 경우에만 잠깐 켜진다. 그 사이 inset 이 커져 핀이 가려지면 옮긴다.
        var recenterUntil = 0;

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
          entry.overlay.setZIndex(
            selected ? SELECTED_Z_INDEX : matchZIndex(entry.item.accessibilityMatchStatus)
          );
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
              recenterUntil = Date.now() + RECENTER_WINDOW_MS;
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
          // 빨강은 접근성 '불가' 마커·위급 표시와 겹쳐 오인되므로 내 위치는 파란 점으로 그린다
          markerEl.innerHTML =
            '<div style="width:22px;height:22px;border-radius:999px;background:${colors.primary};border:4px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,.18),0 3px 12px rgba(37,99,235,.45);"></div>';

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
          initialViewPending = false;
          const projection = map.getProjection();
          const target = projection.containerPointFromCoords(
            new window.kakao.maps.LatLng(coords.lat, coords.lng)
          );
          const dest = visibleCenterPoint();
          const currentLevel = map.getLevel();

          if (level === currentLevel) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            var nextCenter = projection.coordsFromContainerPoint(
              new window.kakao.maps.Point(
                width / 2 + target.x - dest.x,
                height / 2 + target.y - dest.y
              )
            );
            if (reduceMotion) {
              map.setCenter(nextCenter);
            } else {
              map.panTo(nextCenter);
            }
            return;
          }

          const scale = Math.pow(2, currentLevel - level);
          const anchor = new window.kakao.maps.Point(
            (dest.x - scale * target.x) / (1 - scale),
            (dest.y - scale * target.y) / (1 - scale)
          );
          var levelOptions = { anchor: projection.coordsFromContainerPoint(anchor) };
          if (!reduceMotion) levelOptions.animate = { duration: 300 };
          map.setLevel(level, levelOptions);
        }

        function fitPoints(points, maxLevel) {
          initialViewPending = false;
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

        // 고른 핀이 패널·미리보기 띠 아래로 들어갔으면 레벨은 두고 보이는 곳 가운데로 옮긴다.
        // 고른 지 오래됐거나 그 뒤 손으로 끌었으면(둘러보는 중) 옮기지 않는다.
        function recenterSelectedIfHidden() {
          if (!recenterUntil || Date.now() > recenterUntil) return;
          recenterUntil = 0;
          if (selectedPlaceId == null) return;
          var selected = null;
          for (var i = 0; i < details.length; i += 1) {
            if (String(details[i].item.placeId) === String(selectedPlaceId)) {
              selected = details[i];
              break;
            }
          }
          if (!selected) return;
          var point = map.getProjection().containerPointFromCoords(
            new window.kakao.maps.LatLng(selected.coords.lat, selected.coords.lng)
          );
          var width = container.clientWidth;
          var height = container.clientHeight;
          var visibleBottom = height - Math.min(bottomInset, height * 0.85);
          var margin = 16;
          if (
            point.x < margin ||
            point.x > width - margin ||
            point.y < margin ||
            point.y > visibleBottom - margin
          ) {
            moveView(selected.coords, map.getLevel());
          }
        }

        window.__setBottomInset = function(inset) {
          bottomInset = Math.max(0, Number(inset) || 0);
          centerInitialView();
          recenterSelectedIfHidden();
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

        // 고른 장소의 부지 경계(필지)를 파란 면으로 칠한다. RN 이 GeoJSON geometry 문자열을 넘기고, null 이면 지운다.
        // 클릭은 받지 않아(기본값) 면 위를 눌러도 지도 탭(선택 해제)이 그대로 동작한다.
        let boundaryPolygons = [];
        window.__setBoundary = function(geoJsonText) {
          for (let i = 0; i < boundaryPolygons.length; i += 1) boundaryPolygons[i].setMap(null);
          boundaryPolygons = [];
          if (!geoJsonText) return;
          let geometry = null;
          try {
            geometry = JSON.parse(geoJsonText);
          } catch (e) {
            return;
          }
          const shapes =
            geometry.type === 'Polygon' ? [geometry.coordinates]
            : geometry.type === 'MultiPolygon' ? geometry.coordinates
            : [];
          shapes.forEach(function(rings) {
            const path = rings.map(function(ring) {
              return ring.map(function(point) {
                return new window.kakao.maps.LatLng(point[1], point[0]);
              });
            });
            boundaryPolygons.push(new window.kakao.maps.Polygon({
              map: map,
              path: path,
              strokeWeight: 2,
              strokeColor: '#2563eb',
              strokeOpacity: 0.9,
              fillColor: '#2563eb',
              fillOpacity: 0.18,
              zIndex: 1,
            }));
          });
        };

        window.__clearSelectedPlaceMarker = function() {
          paintSelected(null);
        };

        // 상세를 보는 동안 RN 은 ready 를 버린다. 돌아온 뒤 같은 목록이라도 다시 보내게 기억을 지운다.
        window.__resetReadyKey = function() {
          lastReadyKey = null;
        };

        window.__moveToUserLocation = function() {
          const coords = getUserLocationCoords();
          if (!coords) return;
          moveView(coords, Math.min(map.getLevel(), SELECT_LEVEL));
        };

        window.__zoomBy = function(delta) {
          initialViewPending = false;
          const currentLevel = map.getLevel();
          const nextLevel = Math.max(1, Math.min(14, currentLevel + delta));
          if (nextLevel === currentLevel) return;
          const point = visibleCenterPoint();
          var zoomOptions = {
            anchor: map.getProjection().coordsFromContainerPoint(
              new window.kakao.maps.Point(point.x, point.y)
            ),
          };
          if (!reduceMotion) zoomOptions.animate = { duration: 200 };
          map.setLevel(nextLevel, zoomOptions);
        };

        window.__setReduceMotion = function(enabled) {
          reduceMotion = !!enabled;
        };

        // 접근성 칩은 RN 이 다시 판정해 { placeId: status } 로 넘긴다. 오버레이는 그대로 두고 색만 바꾼다.
        window.__setMatchStatus = function(statusByPlaceId) {
          var next = statusByPlaceId || {};
          details.forEach(function(entry) {
            var status = next[entry.item.placeId] || 'NONE';
            if (entry.item.accessibilityMatchStatus === status) return;
            entry.item.accessibilityMatchStatus = status;
            var overlayEntry = detailOverlays.get(String(entry.item.placeId));
            if (!overlayEntry) return;
            overlayEntry.color = accessibilityMatchColor(status);
            overlayEntry.el.style.cssText = detailMarkerStyle(overlayEntry.color, overlayEntry.selected);
            if (!overlayEntry.selected) overlayEntry.overlay.setZIndex(matchZIndex(status));
          });
        };

        window.__fitRegion = function(depth, regionId) {
          fitRegion(depth, regionId);
        };

        // 목록이 비었을 때 '결과 모두 보기'. 맞춘 뒤 idle 에서 draw 가 목록을 다시 보낸다.
        window.__fitAll = function() {
          if (!details.length) return;
          var points = details.map(function(entry) {
            return entry.coords;
          });
          if (regionTrail.length) {
            trailAnchor = null;
            notifyRegionTrail([]);
          }
          fitPoints(points);
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

        drawUserLocation();
        draw();
        // 줌이 끝나도 idle 이 오므로 zoom_changed 에는 따로 걸지 않는다(한 번 줌에 두 번 그리던 것).
        window.kakao.maps.event.addListener(map, 'idle', function() {
          scheduleDraw();
          updateRegionTrailOnIdle();
        });

        // 빈 곳 탭 → 선택을 풀고 RN 에 알린다(미리보기·상세를 닫고 목록으로).
        // 핀 click 뒤에 오는 지도 click 을 거르려고 한 박자 미뤄서 탭 시각을 본다.
        window.kakao.maps.event.addListener(map, 'click', function() {
          setTimeout(function() {
            if (Date.now() - lastOverlayTapAt < PIN_TAP_GUARD_MS) return;
            recenterUntil = 0;
            if (selectedPlaceId != null) paintSelected(null);
            window.__notify({ type: 'mapTap' });
          }, 0);
        });
        // 손으로 끌었으면 패널이 커져도 고른 핀으로 되돌리지 않는다.
        window.kakao.maps.event.addListener(map, 'dragstart', function() {
          recenterUntil = 0;
          initialViewPending = false;
        });
        window.kakao.maps.event.addListener(map, 'zoom_start', function() {
          initialViewPending = false;
        });

        // 화면 회전·분할 화면·키보드 등으로 지도 크기가 바뀌면 카카오는 스스로 다시 맞추지 않는다.
        // 한 프레임에 한 번만 relayout 하고, 바뀌기 전 가운데를 그대로 둔다.
        if (typeof window.ResizeObserver === 'function') {
          var lastSize = { w: container.clientWidth, h: container.clientHeight };
          var resizeFrame = 0;
          var resizeObserver = new window.ResizeObserver(function() {
            if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
            resizeFrame = window.requestAnimationFrame(function() {
              resizeFrame = 0;
              var w = container.clientWidth;
              var h = container.clientHeight;
              if (!w || !h || (w === lastSize.w && h === lastSize.h)) return;
              lastSize = { w: w, h: h };
              var prevCenter = map.getCenter();
              map.relayout();
              map.setCenter(prevCenter);
              scheduleDraw();
            });
          });
          resizeObserver.observe(container);
        }
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
          window.__notify({ type: 'error', code: 'sdkTimeout' });
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
const panelHandleActions = [{ name: 'activate' as const }];
// 보이는 크기는 그대로 두고 누르는 영역만 44dp 로 맞춘다. 가로로 붙은 버튼끼리 겹치지 않게 위아래만 넓힌다.
const actionRowHitSlop = { top: 6, bottom: 6 };
const phoneHitSlop = { top: 8, bottom: 8 };

// 하단 패널 정지점. 값은 panelAnimation 의 0~1(접힘~전체) 위치다.
type PanelStop = 'collapsed' | 'half' | 'full';
const PANEL_STOP_ORDER: PanelStop[] = ['collapsed', 'half', 'full'];
// 반 정지점에서 패널이 덮는 높이(지도 영역 대비). 지도와 목록을 같이 보는 기본 상태다.
const PANEL_HALF_RATIO = 0.45;
// px/ms. 이보다 빠르게 튕기면 거리와 상관없이 튕긴 방향의 다음 정지점으로.
const PANEL_FLICK_SPEED = 0.4;
// 이만큼 안 움직이면 끌기가 아니라 누르기.
const PANEL_DRAG_SLOP = 6;
// 렌더러가 이 시간 안에 이 횟수보다 많이 죽으면 재마운트를 멈추고 실패 카드를 띄운다.
const RENDER_CRASH_WINDOW_MS = 30000;
const RENDER_CRASH_MAX_REMOUNTS = 2;

// 핸들 누르기·스크린리더 activate: 접힘 → 반 → 전체 → 접힘.
function getNextPanelStopOnTap(stop: PanelStop): PanelStop {
  if (stop === 'collapsed') return 'half';
  if (stop === 'half') return 'full';
  return 'collapsed';
}

// 손을 뗀 위치·속도로 정지점을 고른다. 튕겼으면 그 방향으로 지금 위치 너머의 첫 정지점.
function pickPanelStop(
  position: number,
  velocityY: number,
  values: Record<PanelStop, number>,
): PanelStop {
  if (Math.abs(velocityY) > PANEL_FLICK_SPEED) {
    if (velocityY < 0) {
      return PANEL_STOP_ORDER.find(stop => values[stop] > position + 0.01) ?? 'full';
    }
    return (
      [...PANEL_STOP_ORDER].reverse().find(stop => values[stop] < position - 0.01) ??
      'collapsed'
    );
  }
  return PANEL_STOP_ORDER.reduce((nearest, stop) =>
    Math.abs(values[stop] - position) < Math.abs(values[nearest] - position)
      ? stop
      : nearest,
  );
}

// 접근성 필터를 골랐을 때만 서버가 ACCESSIBLE/PARTIAL/INACCESSIBLE 을 준다(안 고르면 NONE).
const matchBadges: Record<
  string,
  { labelKey: string; color: string; Icon: typeof Check }
> = {
  ACCESSIBLE: { labelKey: 'map.detail.matchAccessible', color: colors.a11yMatch.accessible, Icon: Check },
  PARTIAL: { labelKey: 'map.detail.matchPartial', color: colors.a11yMatch.partial, Icon: Minus },
  INACCESSIBLE: { labelKey: 'map.detail.matchInaccessible', color: colors.a11yMatch.inaccessible, Icon: X },
};

function getMatchBadge(status?: string) {
  return matchBadges[String(status ?? '').toUpperCase()] ?? null;
}
// 패널 목록 행. 화면 안 장소 뒤에 '지도에 위치 없는 대피소' 접힘 섹션이 붙는다.
type PanelListRow =
  | { kind: 'place'; place: SelectedPlace }
  | { kind: 'empty' }
  | { kind: 'unlocatedToggle' };
const panelRowKeyExtractor = (row: PanelListRow) =>
  row.kind === 'place' ? `place-${row.place.placeId}` : row.kind;

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
  const match = getMatchBadge(place.accessibilityMatchStatus);
  const MatchIcon = match?.Icon;

  return (
    <PlaceItem accessibilityRole="button" onPress={() => onPress(place)}>
      <PlaceTitleRow>
        <PlaceName numberOfLines={1}>{place.name}</PlaceName>
        {/* 색약·스크린리더 사용자도 알 수 있게 마커 색과 같은 판정을 글자와 아이콘으로 붙인다. */}
        {match && MatchIcon ? (
          <MatchBadge $color={match.color}>
            <MatchIcon color={match.color} size={12} strokeWidth={3} />
            <MatchBadgeText $color={match.color}>{t(match.labelKey)}</MatchBadgeText>
          </MatchBadge>
        ) : null}
        {distanceText ? <PlaceDistance>{distanceText}</PlaceDistance> : null}
      </PlaceTitleRow>
      <PlaceAddress numberOfLines={1}>
        {place.address || t('map.labels.noAddress')}
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
  const { t } = useTranslation();
  const { alert, confirm } = useDialogUtil();
  const { height: screenHeight } = useWindowDimensions();
  const route = useRoute<RouteProp<RootTabParamList, 'Map'>>();
  const navigation =
    useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  // 기본은 반: 지도와 목록을 같이 본다. 실제 반 위치 값은 레이아웃을 잰 뒤 아래 effect 가 맞춘다.
  const [panelStop, setPanelStop] = useState<PanelStop>('half');
  const panelAnimation = useRef(new Animated.Value(0.5)).current;
  const panelDragStartRef = useRef(1);
  const selectedShelterTypes = useMapFilterStore(
    state => state.selectedShelterTypes,
  );
  const selectedAccessibility = useMapFilterStore(
    state => state.selectedAccessibility,
  );
  const userLocation = useLocationStore(state => state.location);
  const locationStatus = useLocationStore(state => state.status);
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

  // 서버는 유형으로만 거르고 접근성은 색만 정한다. 그래서 접근성 칩은 요청에 넣지 않고
  // 받은 데이터를 RN 에서 다시 판정한다(칩마다 ~1100건·사진 URL 을 다시 받던 것).
  const mapRequestBody = useMemo(() => {
    const shelterTypes = selectedShelterTypes
      .filter(item => item !== SHELTER_ALL_LABEL)
      .map(item => shelterTypeValueMap[item])
      .filter(Boolean);

    return {
      ...(shelterTypes.length ? { shelterTypes } : {}),
    };
  }, [selectedShelterTypes]);

  const accessibilityFeatures = useMemo<AccessibilityFeature[]>(
    () =>
      selectedAccessibility
        .filter(item => item !== ACCESSIBILITY_ALL_LABEL)
        .map(item => accessibilityValueMap[item])
        .filter(isAccessibilityFeature),
    [selectedAccessibility],
  );

  const fetchMap = useFetchMap({
    body: mapRequestBody,
  });
  const mapData = useMapStore(state => state.map);
  const isMapFetching = useMapStore(state => state.isFetching);
  const mapFetchError = useMapStore(state => state.fetchError);
  // 장소별 접근성 매칭(chamApi 판정과 동일). 지도 점 색과 목록 배지가 같이 쓴다.
  const matchStatusByPlaceId = useMemo(() => {
    const result: Record<string, AccessibilityMatchStatus> = {};
    Object.values(mapData?.details ?? {}).forEach((item: any) => {
      result[String(item?.placeId)] = evaluatePlaceMatch(
        Array.isArray(item?.shelters) ? item.shelters : [],
        accessibilityFeatures,
      );
    });
    return result;
  }, [accessibilityFeatures, mapData]);
  // 지도는 보이는 장소의 id 만 보내므로, 목록에 그릴 정보는 여기서 찾는다.
  const placesById = useMemo(() => {
    const places = new Map<number, SelectedPlace>();
    const fallbackName = t('map.labels.shelter');
    Object.values(mapData?.details ?? {}).forEach((item: any) => {
      const place = normalizeSelectedPlace(item, fallbackName);
      place.accessibilityMatchStatus =
        matchStatusByPlaceId[String(item?.placeId)] ?? 'NONE';
      places.set(Number(item?.placeId), place);
    });
    return places;
  }, [mapData, matchStatusByPlaceId, t]);
  // 좌표가 없어 지도에 못 찍는 장소. 목록 맨 아래 접힘 섹션으로 따로 보여 준다.
  const unlocatedPlaces = useMemo(
    () =>
      Array.from(placesById.values())
        .filter(place => !place.coords)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [placesById],
  );
  const unlocatedShelterCount = useMemo(
    () => unlocatedPlaces.reduce((sum, place) => sum + place.shelterCount, 0),
    [unlocatedPlaces],
  );
  const [isUnlocatedExpanded, setIsUnlocatedExpanded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );
  // 지도에서 핀을 누르면 상세 대신 패널 위에 미리보기 띠를 먼저 띄운다(지도를 덮지 않게).
  const [previewPlace, setPreviewPlace] = useState<SelectedPlace | null>(null);

  // 목록은 id 로 들고 placesById 에서 찾는다. 접근성 칩·언어가 바뀌어도 배지·이름이 바로 따라온다.
  const [visiblePlaceIds, setVisiblePlaceIds] = useState<number[]>([]);
  const visiblePlaces = useMemo(
    () =>
      visiblePlaceIds
        .map(id => placesById.get(id))
        .filter((place): place is SelectedPlace => !!place),
    [placesById, visiblePlaceIds],
  );
  // 목록 행은 장소 단위라, 장소 수와 그 안의 대피소 수를 따로 보여준다.
  const visibleShelterCount = useMemo(
    () => visiblePlaces.reduce((sum, place) => sum + place.shelterCount, 0),
    [visiblePlaces],
  );
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
  // 렌더러가 죽은 Android WebView 는 다시 쓸 수 없어 key 를 바꿔 새로 마운트한다.
  const [webViewKey, setWebViewKey] = useState(0);
  // 만료된 presigned URL 등으로 못 읽은 사진. 기본 이미지로 바꿔 빈 프레임을 막는다.
  const [failedImageUris, setFailedImageUris] = useState<Set<string>>(
    () => new Set(),
  );
  const [panelReady, setPanelReady] = useState(false);
  const [mapFrameHeight, setMapFrameHeight] = useState(0);
  const [regionTrail, setRegionTrail] = useState<RegionTrailItem[]>([]);
  const webViewRef = useRef<WebView>(null);
  const pendingFocusPlaceIdRef = useRef<number | null>(null);
  const selectedPlaceIdRef = useRef<number | null>(null);
  // 같은 id 목록이 반복해서 오면(이동만 하고 보이는 장소는 그대로) 목록을 다시 그리지 않는다.
  const visiblePlaceKeyRef = useRef('');
  // 상세를 보는 동안 지도가 보낸 목록. 바로 반영하지 않고 맡아 둔다.
  const frozenPlaceIdsRef = useRef<number[] | null>(null);
  // 홈에서 넘긴 포커스를 한 번만 쓴다. 안 그러면 필터를 바꿀 때마다 그 장소로 다시 튀었다.
  const consumedFocusKeyRef = useRef('');

  // 새 데이터가 도착하면 선택·목록을 비운다. 필터를 누른 순간에는 비우지 않는다.
  // 그 사이 지도는 옛 데이터를 그대로 그리고 있으므로, 목록도 그것과 맞춰 둔다.
  useEffect(() => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    visiblePlaceKeyRef.current = '';
    frozenPlaceIdsRef.current = null;
    setSelectedPlace(null);
    setPreviewPlace(null);
    setVisiblePlaceIds([]);
    setPanelReady(false);
  }, [mapData]);

  const mapAreaHeight = mapFrameHeight || screenHeight;
  const expandedPanelHeight = Math.round(mapAreaHeight * 0.9);
  const collapsedPanelHeight = 42;
  const panelRange = expandedPanelHeight - collapsedPanelHeight;
  const halfPanelValue = Math.min(
    0.9,
    Math.max(
      0.1,
      (mapAreaHeight * PANEL_HALF_RATIO - collapsedPanelHeight) /
        Math.max(1, panelRange),
    ),
  );
  const panelStopValues = useMemo<Record<PanelStop, number>>(
    () => ({ collapsed: 0, half: halfPanelValue, full: 1 }),
    [halfPanelValue],
  );
  const currentPanelValue = panelStopValues[panelStop];
  // 패널은 높이를 바꾸지 않고 아래로 밀어 숨긴다. 높이 애니메이션은 매 프레임 레이아웃을 다시 계산해 끊겼다.
  const panelTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [panelRange, 0],
  });
  // 패널은 늘 전체 높이라 반·접힘에선 아랫부분이 화면 밖이다. 그만큼 아래 여백을 줘야
  // 목록 끝·로딩·재시도 버튼이 보이는 영역 안에 들어온다.
  const hiddenPanelHeight = Math.round(panelRange * (1 - currentPanelValue));
  const panelHiddenPadStyle = useMemo(
    () => ({ paddingBottom: hiddenPanelHeight }),
    [hiddenPanelHeight],
  );
  // 전체 정지점에선 띠가 화면 위로 밀려나므로 숨긴다. 상세가 열려 있으면 상세가 대신한다.
  const isPreviewStripShown =
    !!previewPlace && !selectedPlace && panelStop !== 'full';
  // 지도에 넘기는 가림 높이 = 정지점의 패널 높이 + 미리보기 띠. 가운데 맞춤·재중앙이 이 값을 쓴다.
  const bottomInset = Math.round(
    collapsedPanelHeight +
      currentPanelValue * panelRange +
      (isPreviewStripShown ? PREVIEW_STRIP_SPACE : 0),
  );

  // 지도 페이지는 한 번만 읽는다. 데이터·현재 위치가 바뀌면 HTML 을 새로 만드는 대신
  // __setMapData / __setUserLocation 으로 주입한다. HTML 을 바꾸면 WebView 가 카카오 SDK 부터
  // 다시 받아 지도를 새로 만들기 때문에(필터 칩 하나 누를 때마다) 체감이 크게 나빴다.
  const latestMapDataRef = useRef(mapData);
  latestMapDataRef.current = mapData;
  const latestUserLocationRef = useRef(userLocation);
  latestUserLocationRef.current = userLocation;
  const latestBottomInsetRef = useRef(bottomInset);
  latestBottomInsetRef.current = bottomInset;
  const latestMatchStatusRef = useRef(matchStatusByPlaceId);
  latestMatchStatusRef.current = matchStatusByPlaceId;
  // 기기의 '애니메이션 줄이기' 설정. 지도 이동·줌과 패널 애니메이션이 같이 따른다.
  const [reduceMotion, setReduceMotion] = useState(false);
  const reduceMotionRef = useRef(reduceMotion);
  reduceMotionRef.current = reduceMotion;
  // HTML 에 구워 넣은 값. WebView 가 스스로 다시 로드되면 페이지는 이 값으로 돌아간다.
  const bakedRef = useRef({
    mapData,
    matchStatus: matchStatusByPlaceId,
    userLocation,
    bottomInset: 0,
    reduceMotion: false,
    version: 0,
  });
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
      JSON.stringify(toMapPayload(baked.mapData, baked.matchStatus)),
      JSON.stringify(baked.userLocation),
      JSON.stringify(selectedPlaceIdRef.current),
      // 리소스 키가 'KO' 처럼 대문자라 html lang 에 맞춰 소문자로.
      String(i18nInstance.language || 'ko').toLowerCase(),
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
      next.matchStatus = latestMatchStatusRef.current;
      next.version = mapDataVersionRef.current;
      scripts.push(
        `if (window.__setMapData) window.__setMapData(${JSON.stringify(
          toMapPayload(next.mapData, next.matchStatus),
        )}, ${next.version});`,
      );
    } else if (sentRef.current.matchStatus !== latestMatchStatusRef.current) {
      // 접근성 칩만 바뀌었으면 데이터는 그대로 두고 점 색만 다시 칠한다.
      next.matchStatus = latestMatchStatusRef.current;
      scripts.push(
        `if (window.__setMatchStatus) window.__setMatchStatus(${JSON.stringify(
          next.matchStatus,
        )});`,
      );
    }
    if (sentRef.current.reduceMotion !== reduceMotionRef.current) {
      next.reduceMotion = reduceMotionRef.current;
      scripts.push(
        `if (window.__setReduceMotion) window.__setReduceMotion(${next.reduceMotion});`,
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
  }, [
    mapData,
    matchStatusByPlaceId,
    userLocation,
    bottomInset,
    reduceMotion,
    syncMapPage,
  ]);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleMapLoadStart = useCallback(() => {
    mapPageReadyRef.current = false;
    sentRef.current = { ...bakedRef.current };
    setRegionTrail([]);
  }, []);

  // SDK 로드 실패 후 다시 시도. ref 초기화는 reload 가 부르는 handleMapLoadStart 가 맡는다.
  const handleRetryMapLoad = useCallback(() => {
    const crashed = mapError === 'crash';
    setMapError('');
    // 렌더러가 죽은 WebView 는 reload 가 안 먹으니 새로 마운트한다.
    if (crashed) {
      setWebViewKey(key => key + 1);
      return;
    }
    webViewRef.current?.reload();
  }, [mapError]);

  // Android: 렌더러가 죽으면 그 WebView 는 못 쓴다. 새로 마운트하고, 데이터·inset 은
  // ready 이후 syncMapPage 가 다시 넣는다(시점은 처음 위치로 돌아감).
  // 짧은 시간에 계속 죽으면(저사양 기기 메모리 부족 등) 무한 재마운트가 되므로 실패 카드로 넘긴다.
  const renderCrashTimesRef = useRef<number[]>([]);
  const handleRenderProcessGone = useCallback(() => {
    handleMapLoadStart();
    const now = Date.now();
    const recent = renderCrashTimesRef.current.filter(
      time => now - time < RENDER_CRASH_WINDOW_MS,
    );
    if (recent.length >= RENDER_CRASH_MAX_REMOUNTS) {
      renderCrashTimesRef.current = [];
      setMapError('crash');
      return;
    }
    renderCrashTimesRef.current = [...recent, now];
    setMapError('');
    setWebViewKey(key => key + 1);
  }, [handleMapLoadStart]);

  // iOS: 콘텐츠 프로세스가 종료돼도 WebView 자체는 살아 있어 reload 로 충분하다.
  const handleContentProcessDidTerminate = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  // 카카오 로고 등 링크를 누르면 앱 지도 자리가 외부 페이지로 바뀌었다. 지도 페이지(about:blank·data:)
  // 외의 이동은 막고 브라우저로 넘긴다. 타일·스크립트 요청은 이 콜백을 타지 않는다.
  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest) => {
    const url = request.url ?? '';
    if (!url || url.startsWith('about:') || url.startsWith('data:')) return true;
    // iOS 는 iframe 로드도 여기로 온다. 최상위 이동만 막는다(Android 는 늘 true).
    if (request.isTopFrame === false) return true;
    Linking.openURL(url).catch(() => undefined);
    return false;
  }, []);

  // target=_blank 새 창도 같은 방식으로 브라우저에 넘긴다.
  const handleOpenWindow = useCallback((event: WebViewOpenWindowEvent) => {
    const url = event.nativeEvent.targetUrl;
    if (url) Linking.openURL(url).catch(() => undefined);
  }, []);

  const resolveImageSource = (source: ImageSourcePropType) => {
    const uri = (source as { uri?: string } | null)?.uri;
    return uri && failedImageUris.has(uri) ? defaultShelterImage : source;
  };

  const handleImageError = (source: ImageSourcePropType) => {
    const uri = (source as { uri?: string } | null)?.uri;
    if (!uri) return;
    setFailedImageUris(prev => (prev.has(uri) ? prev : new Set(prev).add(uri)));
  };

  const panelStopRef = useRef(panelStop);
  panelStopRef.current = panelStop;
  const panelStopValuesRef = useRef(panelStopValues);
  panelStopValuesRef.current = panelStopValues;
  const panelRangeRef = useRef(panelRange);
  panelRangeRef.current = panelRange;

  const animatePanelTo = useCallback(
    (stop: PanelStop) => {
      // 연달아 누를 때 다음 렌더 전에도 바뀐 정지점을 읽도록 ref 도 바로 고친다.
      panelStopRef.current = stop;
      setPanelStop(stop);
      Animated.timing(panelAnimation, {
        toValue: panelStopValuesRef.current[stop],
        // '애니메이션 줄이기'가 켜져 있으면 바로 붙인다.
        duration: reduceMotionRef.current ? 0 : 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [panelAnimation],
  );

  // 상세를 열 때 접혀 있으면 반까지만 올린다. 반에서는 고른 핀이 지도에 보인다.
  const openPanelAtLeastHalf = useCallback(() => {
    if (panelStopRef.current === 'collapsed') animatePanelTo('half');
  }, [animatePanelTo]);

  // 반 위치는 지도 영역 높이로 정해진다. 레이아웃을 재고 나면(첫 렌더·회전) 반에 있는 패널을 새 위치로 붙인다.
  // 접힘(0)·전체(1)는 범위가 바뀌어도 값이 같아 그대로 둔다.
  useEffect(() => {
    if (panelStopRef.current === 'half') panelAnimation.setValue(halfPanelValue);
  }, [halfPanelValue, panelAnimation]);

  const handleMapFrameLayout = (event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setMapFrameHeight(current =>
      Math.abs(current - nextHeight) > 1 ? nextHeight : current,
    );
  };

  // 미리보기·상세로 고른 장소의 부지 경계를 지도에 칠한다. 한 번 받은 경계는 화면이 살아 있는 동안 재사용한다.
  const boundaryPlaceId = selectedPlace?.placeId ?? previewPlace?.placeId ?? null;
  const boundaryCacheRef = useRef(new Map<number, string | null>());
  useEffect(() => {
    const apply = (geoJson: string | null) =>
      injectMapScript(
        `if (window.__setBoundary) window.__setBoundary(${JSON.stringify(geoJson)});`,
      );
    if (boundaryPlaceId == null) {
      apply(null);
      return;
    }
    const cache = boundaryCacheRef.current;
    if (cache.has(boundaryPlaceId)) {
      apply(cache.get(boundaryPlaceId) ?? null);
      return;
    }
    // 다른 장소의 경계가 남아 있지 않게 먼저 지우고 받는다.
    apply(null);
    let cancelled = false;
    fetchPlaceBoundary(boundaryPlaceId)
      .then(geoJson => {
        cache.set(boundaryPlaceId, geoJson);
        if (!cancelled) apply(geoJson);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [boundaryPlaceId, injectMapScript]);

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
        setMapError('');
        // 상세를 보고 있으면 그 자리에서 다른 장소 상세로 바꾼다.
        // 패널이 접혀 있으면 바뀐 상세가 안 보이므로 반까지 올린다(올라가며 가려진 핀은 재중앙 창이 옮긴다).
        if (selectedPlaceIdRef.current != null) {
          selectedPlaceIdRef.current = place.placeId;
          setSelectedPlace(place);
          openPanelAtLeastHalf();
          return;
        }
        // 아니면 미리보기 띠만 띄운다. 전체로 펼쳐져 있으면 띠가 보이게 반으로 내린다.
        setPreviewPlace(place);
        if (panelStopRef.current === 'full') animatePanelTo('half');
        return;
      }

      if (parsed.type === 'mapTap') {
        // 빈 지도 탭 = 고른 것 풀기. 상세면 목록으로, 미리보기면 띠만 닫는다.
        if (selectedPlaceIdRef.current != null) {
          handleBackToPlaceList();
        } else {
          setPreviewPlace(null);
        }
        return;
      }

      if (parsed.type === 'error') {
        if (__DEV__) {
          console.log('[map] webview error', parsed.code, parsed.message);
        }
        // 지도가 이미 뜬 뒤의 스크립트 오류(카카오 SDK 'Script error.' 등)는 지도를 못 쓰게 하지 않는다.
        // 그걸로 실패 카드를 덮으면 멀쩡한 지도를 가리고 재시도가 시점까지 초기화했다.
        if (parsed.code === 'script' && mapPageReadyRef.current) return;
        setMapError(parsed.code || 'unknown');
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
          renderCrashTimesRef.current = [];
          syncMapPage();
          // 재마운트·reload 뒤 페이지는 처음 구운 선택값으로 뜬다. 지금 고른 장소로 다시 맞춘다.
          // 홈 포커스 대기 중이면 아래에서 그걸 고르므로 건너뛴다.
          if (!pendingFocusPlaceIdRef.current) {
            const currentPlaceId =
              selectedPlaceIdRef.current ?? previewPlace?.placeId ?? null;
            if (currentPlaceId != null) {
              selectPlaceMarker(currentPlaceId);
            } else {
              injectMapScript(
                'if (window.__clearSelectedPlaceMarker) window.__clearSelectedPlaceMarker();',
              );
            }
          }
        }
        // 새 데이터를 넣었다면 이 메시지의 목록은 옛 데이터 기준이니 다음 ready 를 기다린다.
        if (parsed.version === sentRef.current.version) {
          const ids = parsed.visiblePlaceIds ?? [];
          const key = ids.join(',');
          // 상세를 보는 동안에는 목록을 바꾸지 않는다. 장소를 고르면 지도가 그쪽으로 움직여
          // 목록 순서가 바뀌었고, 돌아오면 보던 자리를 잃었다. 다음 이동 때 새 목록이 온다.
          if (selectedPlaceIdRef.current != null) {
            frozenPlaceIdsRef.current = ids.map(id => Number(id));
          } else if (key !== visiblePlaceKeyRef.current) {
            frozenPlaceIdsRef.current = null;
            visiblePlaceKeyRef.current = key;
            setVisiblePlaceIds(ids.map(id => Number(id)));
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
    } catch {
      // no-op
    }
  };

  // 위치를 새로 받은 직후 그 자리로 옮기려고 표시해 둔다(__setUserLocation 주입 다음에 이동).
  const pendingMoveToUserRef = useRef(false);

  // 위치가 없을 때 아무 반응이 없던 것 → 권한을 다시 묻거나, 막혀 있으면 설정으로 안내한다.
  const handleMoveToUserLocation = async () => {
    if (userLocation) {
      injectMapScript('if (window.__moveToUserLocation) window.__moveToUserLocation();');
      return;
    }
    if (locationStatus === 'checking') {
      alert(t('map.location.checking'), undefined, { tone: 'info' });
      return;
    }

    pendingMoveToUserRef.current = true;
    const result = await loadCurrentLocation();
    if (result === 'granted') return;
    pendingMoveToUserRef.current = false;

    if (result === 'blocked') {
      const shouldOpen = await confirm(
        t('map.location.permissionRequired'),
        t('map.location.openSettingsDescription'),
        { tone: 'warning', confirmLabel: t('map.location.openSettings') },
      );
      if (shouldOpen) Linking.openSettings().catch(() => undefined);
      return;
    }
    if (result === 'denied') {
      alert(
        t('map.location.permissionRequired'),
        t('map.location.permissionDescription'),
        { tone: 'warning' },
      );
      return;
    }
    alert(t('map.location.unavailable'), undefined, { tone: 'warning' });
  };

  // syncMapPage effect 다음에 선언해야 위치가 먼저 주입된 뒤 이동한다.
  useEffect(() => {
    if (!userLocation || !pendingMoveToUserRef.current) return;
    pendingMoveToUserRef.current = false;
    injectMapScript('if (window.__moveToUserLocation) window.__moveToUserLocation();');
  }, [injectMapScript, userLocation]);

  const handleShowAllResults = useCallback(() => {
    injectMapScript('if (window.__fitAll) window.__fitAll();');
  }, [injectMapScript]);

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
      setPreviewPlace(null);
      setSelectedPlace(place);
      openPanelAtLeastHalf();
      // 좌표 없는 장소는 지도에 점이 없으니 이동은 생략하고 상세만 연다.
      // 대신 앞서 고른 핀 강조는 풀어 둔다(다른 장소 상세 아래 엉뚱한 핀이 남지 않게).
      if (place.coords) {
        selectPlaceMarker(place.placeId);
      } else {
        injectMapScript(
          'if (window.__clearSelectedPlaceMarker) window.__clearSelectedPlaceMarker();',
        );
      }
    },
    [injectMapScript, openPanelAtLeastHalf, selectPlaceMarker],
  );

  // 미리보기 띠를 누르면 그 장소 상세를 연다. 핀은 이미 골라져 있고 보이는 곳에 있어 지도는 움직이지 않는다.
  const handleOpenPreviewDetail = useCallback(() => {
    if (!previewPlace) return;
    pendingFocusPlaceIdRef.current = null;
    selectedPlaceIdRef.current = previewPlace.placeId;
    setSelectedPlace(previewPlace);
    setPreviewPlace(null);
    openPanelAtLeastHalf();
  }, [openPanelAtLeastHalf, previewPlace]);

  const handleClosePreview = useCallback(() => {
    setPreviewPlace(null);
    injectMapScript(
      'if (window.__clearSelectedPlaceMarker) window.__clearSelectedPlaceMarker();',
    );
  }, [injectMapScript]);

  useEffect(() => {
    const focusPlaceIdParam = route.params?.focusPlaceId;
    const focusShelterId = route.params?.focusShelterId;
    if (!focusPlaceIdParam && !focusShelterId) return;

    const focusKey = `${focusPlaceIdParam ?? ''}-${focusShelterId ?? ''}-${
      route.params?.focusNonce ?? ''
    }`;
    if (consumedFocusKeyRef.current === focusKey) return;

    // 데이터가 아직 없거나 받는 중이면 도착했을 때 다시 시도한다.
    if (!mapData || isMapFetching) return;

    // 홈의 '가장 가까운 대피소'는 placeId 가 비어 올 수 있어 대피소 id 로도 찾는다.
    let place = focusPlaceIdParam
      ? placesById.get(Number(focusPlaceIdParam))
      : undefined;
    if (!place && focusShelterId) {
      place = Array.from(placesById.values()).find(item =>
        item.shelters.some(
          shelter => Number(shelter.shelterId) === Number(focusShelterId),
        ),
      );
    }
    consumedFocusKeyRef.current = focusKey;

    if (!place) {
      // 유형 필터로 빠졌는지, 애초에 지도에 위치가 없는 대피소인지 나눠 안내한다(한 번만).
      if (mapRequestBody.shelterTypes?.length) {
        alert(
          t('map.labels.focusHidden'),
          t('map.labels.focusHiddenDescription'),
          { tone: 'warning' },
        );
      } else {
        alert(t('map.labels.focusNoLocation'), undefined, { tone: 'warning' });
      }
      return;
    }

    const focusPlaceId = place.placeId;
    pendingFocusPlaceIdRef.current = focusPlaceId;
    selectedPlaceIdRef.current = focusPlaceId;
    setPreviewPlace(null);
    setSelectedPlace(place);
    openPanelAtLeastHalf();
    selectPlaceMarker(focusPlaceId);
  }, [
    alert,
    isMapFetching,
    mapData,
    mapRequestBody.shelterTypes,
    openPanelAtLeastHalf,
    placesById,
    route.params?.focusNonce,
    route.params?.focusPlaceId,
    route.params?.focusShelterId,
    selectPlaceMarker,
    t,
  ]);

  const handleBackToPlaceList = useCallback(() => {
    selectedPlaceIdRef.current = null;
    pendingFocusPlaceIdRef.current = null;
    // 지킬 목록 자리가 없으면(홈에서 바로 상세로 온 경우 등) 상세 중 받아 둔 목록을 쓴다.
    const frozenIds = frozenPlaceIdsRef.current;
    frozenPlaceIdsRef.current = null;
    if (frozenIds && !visiblePlaceKeyRef.current) {
      visiblePlaceKeyRef.current = frozenIds.join(',');
      setVisiblePlaceIds(frozenIds);
    }
    setSelectedPlace(null);
    setPreviewPlace(null);
    // 목록 자리는 지키되, 다음 이동(작은 팬이라도) 때는 지금 화면 목록이 꼭 오게 한다.
    injectMapScript(
      'if (window.__clearSelectedPlaceMarker) window.__clearSelectedPlaceMarker();\nif (window.__resetReadyKey) window.__resetReadyKey();',
    );
  }, [injectMapScript]);

  // 안드로이드 뒤로가기는 상세 → 목록, 미리보기 띠 닫기를 먼저 소비한다.
  // 모달(접근성 안내·신고·사진)은 각 Modal 의 onRequestClose 가 처리한다.
  const backStateRef = useRef({ selectedPlace, previewPlace });
  backStateRef.current = { selectedPlace, previewPlace };
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (backStateRef.current.selectedPlace) {
            handleBackToPlaceList();
            return true;
          }
          if (backStateRef.current.previewPlace) {
            handleClosePreview();
            return true;
          }
          return false;
        },
      );
      return () => subscription.remove();
    }, [handleBackToPlaceList, handleClosePreview]),
  );

  // 내 위치가 대전 안일 때만 목록에 거리를 붙인다.
  const distanceOrigin = useMemo(
    () => (userLocation && isInDaejeon(userLocation) ? userLocation : null),
    [userLocation],
  );
  // 좌표 있는 장소가 하나라도 있어야 '결과 모두 보기'로 맞출 수 있다.
  const hasLocatedPlaces = placesById.size > unlocatedPlaces.length;
  const listRows = useMemo<PanelListRow[]>(() => {
    const rows: PanelListRow[] = visiblePlaces.length
      ? visiblePlaces.map(place => ({ kind: 'place' as const, place }))
      : [{ kind: 'empty' }];
    if (unlocatedPlaces.length) {
      rows.push({ kind: 'unlocatedToggle' });
      if (isUnlocatedExpanded) {
        unlocatedPlaces.forEach(place => rows.push({ kind: 'place', place }));
      }
    }
    return rows;
  }, [isUnlocatedExpanded, unlocatedPlaces, visiblePlaces]);

  const renderPanelRow = useCallback(
    ({ item }: { item: PanelListRow }) => {
      if (item.kind === 'empty') {
        return (
          <EmptyList>
            <EmptyPanelText>{t('map.labels.noVisiblePlaces')}</EmptyPanelText>
            {/* 필터 결과가 있는데 화면 밖에만 있을 때 한 번에 데려온다. */}
            {hasLocatedPlaces ? (
              <RetryButton onPress={handleShowAllResults}>
                <RetryButtonText>{t('map.labels.showAllResults')}</RetryButtonText>
              </RetryButton>
            ) : null}
          </EmptyList>
        );
      }
      if (item.kind === 'unlocatedToggle') {
        return (
          <UnlocatedToggle
            accessibilityRole="button"
            accessibilityState={{ expanded: isUnlocatedExpanded }}
            onPress={() => setIsUnlocatedExpanded(expanded => !expanded)}
          >
            <UnlocatedToggleText>
              {t('map.labels.unlocatedShelters', {
                count: unlocatedShelterCount,
              })}
            </UnlocatedToggleText>
            {isUnlocatedExpanded ? (
              <ChevronUp color={colors.textTertiary} size={18} strokeWidth={2.6} />
            ) : (
              <ChevronDown color={colors.textTertiary} size={18} strokeWidth={2.6} />
            )}
          </UnlocatedToggle>
        );
      }
      return (
        <PlaceListItem
          place={item.place}
          distanceText={
            distanceOrigin && item.place.coords
              ? formatDistance(
                  getDistanceMeters(distanceOrigin, item.place.coords),
                )
              : null
          }
          onPress={handlePlacePress}
        />
      );
    },
    [
      distanceOrigin,
      handlePlacePress,
      handleShowAllResults,
      hasLocatedPlaces,
      isUnlocatedExpanded,
      t,
      unlocatedShelterCount,
    ],
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

  // 앱을 먼저 열어 보고, 없으면(openURL 실패) 웹 주소로 연다. 둘 다 안 되면 알린다.
  const openMapApp = async (appUrl: string | null, webUrl: string | null) => {
    if (appUrl) {
      try {
        await Linking.openURL(appUrl);
        return;
      } catch {
        // 앱이 없다 → 웹으로
      }
    }
    if (!webUrl) return;
    try {
      await Linking.openURL(webUrl);
    } catch {
      alert(t('map.detail.directionsFailed'), undefined, { tone: 'error' });
    }
  };

  const handleOpenKakaoMap = (place: SelectedPlace) => {
    openMapApp(getKakaoMapAppUrl(place), getDirectionsUrl(place));
  };

  const handleOpenNaverMap = (place: SelectedPlace) => {
    openMapApp(getNaverMapAppUrl(place), getNaverMapWebUrl(place));
  };

  // 이름·주소와 카카오맵 웹 링크(좌표 있을 때)를 보낸다. 받는 사람은 앱이 없어도 열 수 있다.
  const handleSharePlace = async (place: SelectedPlace) => {
    const message = [place.name, place.address, getDirectionsUrl(place)]
      .filter(Boolean)
      .join('\n');
    try {
      await Share.share({ message });
    } catch {
      alert(t('map.detail.shareFailed'), undefined, { tone: 'error' });
    }
  };

  const handleCall = (telNo?: string) => {
    const url = getTelUrl(telNo);
    if (!url) return;
    Linking.openURL(url).catch(() => {
      alert(t('map.detail.callFailed'), undefined, { tone: 'error' });
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
      alert(result.errorMessage, undefined, { tone: 'warning' });
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
        // 앱 UI 언어는 안내판 언어가 아니다. 비워 보내면 승인 때 기존 값이 유지된다.
        signageLanguage: undefined,
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
      alert(t('map.report.success'), undefined, { tone: 'success' });
    } catch (error: any) {
      if (__DEV__) {
        console.log('[report-submit] failed', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
        });
      }
      alert(error?.response?.data?.message ?? t('map.report.failed'), undefined, {
        tone: 'error',
      });
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
        Math.abs(gestureState.dy) > PANEL_DRAG_SLOP &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dy) > PANEL_DRAG_SLOP &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        panelDragStartRef.current =
          panelStopValuesRef.current[panelStopRef.current];
      },
      onPanResponderMove: (_, gestureState) => {
        const nextValue =
          panelDragStartRef.current - gestureState.dy / panelRangeRef.current;
        panelAnimation.setValue(Math.max(0, Math.min(1, nextValue)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          Math.abs(gestureState.dy) <= PANEL_DRAG_SLOP &&
          Math.abs(gestureState.dx) <= PANEL_DRAG_SLOP
        ) {
          animatePanelTo(getNextPanelStopOnTap(panelStopRef.current));
          return;
        }

        const position = Math.max(
          0,
          Math.min(
            1,
            panelDragStartRef.current - gestureState.dy / panelRangeRef.current,
          ),
        );
        animatePanelTo(
          pickPanelStop(position, gestureState.vy, panelStopValuesRef.current),
        );
      },
      onPanResponderTerminate: () => {
        animatePanelTo(panelStopRef.current);
      },
      onShouldBlockNativeResponder: () => false,
    }),
  ).current;

  // 줌·내 위치 버튼은 패널 윗변을 따라 올라가고, 패널 위에 남은 자리가 모자라면 숨긴다.
  const mapControlCount = 3;
  const mapControlsHeight =
    mapControlCount * MAP_CONTROL_SIZE + (mapControlCount - 1) * MAP_CONTROL_GAP;
  const mapControlsTranslateY = panelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -panelRange],
  });
  // 미리보기 띠가 떠 있으면 버튼은 그 위로 올린다.
  const mapControlsLift = isPreviewStripShown ? PREVIEW_STRIP_SPACE : 0;
  const mapControlsHideAt = Math.min(
    1,
    Math.max(
      0,
      (mapAreaHeight -
        collapsedPanelHeight -
        mapControlsLift -
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
  // 반 정지점에서도 위에 자리가 남으면 버튼을 쓴다.
  const areMapControlsVisible =
    mapControlsHideAt > 0.05 && currentPanelValue < mapControlsHideAt - 0.05;
  // 미리보기 띠도 패널 윗변을 따라가다 지도 위쪽에 닿으면 흐려진다(전체로 끄는 중).
  const previewHideAt = Math.min(
    1,
    Math.max(
      0,
      (mapAreaHeight - collapsedPanelHeight - PREVIEW_STRIP_SPACE) /
        Math.max(1, panelRange),
    ),
  );
  const previewStripOpacity = panelAnimation.interpolate({
    inputRange:
      previewHideAt > 0.05 ? [0, previewHideAt - 0.05, previewHideAt] : [0, 1],
    outputRange: previewHideAt > 0.05 ? [1, 1, 0] : [0, 0],
    extrapolate: 'clamp',
  });
  const previewMatch = previewPlace
    ? getMatchBadge(previewPlace.accessibilityMatchStatus)
    : null;
  const PreviewMatchIcon = previewMatch?.Icon;
  const previewDistanceText =
    previewPlace?.coords && distanceOrigin
      ? formatDistance(getDistanceMeters(distanceOrigin, previewPlace.coords))
      : null;

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
            key={webViewKey}
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
            onError={() => setMapError('load')}
            onRenderProcessGone={handleRenderProcessGone}
            onContentProcessDidTerminate={handleContentProcessDidTerminate}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onOpenWindow={handleOpenWindow}
            renderLoading={() => (
              <LoadingBox>
                <ActivityIndicator color={colors.primary} />
              </LoadingBox>
            )}
          />
        ) : (
          <EmptyText>{t('map.labels.noMapKey')}</EmptyText>
        )}

        {regionTrail.length ? (
          <RegionTrailRow>
            {regionTrail.map((item, index) => (
              <RegionTrailItemView key={`${item.depth}-${item.regionId}`}>
                {index > 0 ? (
                  <ChevronRight color={colors.textMuted} size={14} strokeWidth={2.6} />
                ) : null}
                <RegionTrailChip
                  $current={index === regionTrail.length - 1}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: index === regionTrail.length - 1,
                  }}
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
            <ActivityIndicator color={colors.primary} size="small" />
          </MapFetchingBadge>
        ) : null}

        {/* 패널에 가려지지 않게 지도 위에 띄운다. */}
        {mapError ? (
          <MapErrorOverlay>
            <MapErrorCard>
              <ErrorText>{t('map.labels.mapLoadFailed')}</ErrorText>
              <RetryButton onPress={handleRetryMapLoad}>
                <RetryButtonText>{t('map.labels.retry')}</RetryButtonText>
              </RetryButton>
            </MapErrorCard>
          </MapErrorOverlay>
        ) : null}
      </MapFrame>

      {mapHtml ? (
        <MapControls
          pointerEvents={areMapControlsVisible ? 'box-none' : 'none'}
          style={{
            bottom: collapsedPanelHeight + mapControlsLift + MAP_CONTROL_MARGIN,
            opacity: mapControlsOpacity,
            transform: [{ translateY: mapControlsTranslateY }],
          }}
        >
          <MapControlButton
            accessibilityRole="button"
            accessibilityLabel={t('map.a11y.zoomIn')}
            onPress={() => handleZoom(-1)}
          >
            <Plus color={colors.text} size={20} strokeWidth={2.6} />
          </MapControlButton>
          <MapControlButton
            accessibilityRole="button"
            accessibilityLabel={t('map.a11y.zoomOut')}
            onPress={() => handleZoom(1)}
          >
            <Minus color={colors.text} size={20} strokeWidth={2.6} />
          </MapControlButton>
          {/* 위치가 없어도 보여 준다. 누르면 권한 재요청·안내로 이어진다. */}
          <MapControlButton
            accessibilityRole="button"
            accessibilityLabel={t('map.labels.nearbyLocation')}
            onPress={handleMoveToUserLocation}
          >
            <LocateFixed
              color={userLocation ? colors.primary : colors.textDisabled}
              size={20}
              strokeWidth={2.6}
            />
          </MapControlButton>
        </MapControls>
      ) : null}

      {/* 핀 미리보기 띠: 패널 윗변 바로 위에 붙어 같이 움직인다. 누르면 상세, X 로 닫는다. */}
      {isPreviewStripShown && previewPlace ? (
        <PreviewStrip
          pointerEvents="box-none"
          style={{
            bottom: collapsedPanelHeight + PREVIEW_STRIP_GAP,
            opacity: previewStripOpacity,
            transform: [{ translateY: mapControlsTranslateY }],
          }}
        >
          <PreviewCard>
            {/* 상세 열기와 닫기는 나란한 버튼 둘. 버튼 안에 버튼을 넣으면 스크린리더가 안쪽을 놓친다. */}
            <PreviewOpenButton
              accessibilityRole="button"
              accessibilityLabel={t('map.a11y.openPreview', {
                name: previewPlace.name,
              })}
              onPress={handleOpenPreviewDetail}
            >
              <PreviewBody>
                <PlaceTitleRow>
                  <PlaceName numberOfLines={1}>{previewPlace.name}</PlaceName>
                  {previewMatch && PreviewMatchIcon ? (
                    <MatchBadge $color={previewMatch.color}>
                      <PreviewMatchIcon
                        color={previewMatch.color}
                        size={12}
                        strokeWidth={3}
                      />
                      <MatchBadgeText $color={previewMatch.color}>
                        {t(previewMatch.labelKey)}
                      </MatchBadgeText>
                    </MatchBadge>
                  ) : null}
                </PlaceTitleRow>
                <PlaceAddress numberOfLines={1}>
                  {previewPlace.address || t('map.labels.noAddress')}
                </PlaceAddress>
                <PreviewMeta numberOfLines={1}>
                  {t('map.labels.shelter')} {previewPlace.shelterCount}
                  {previewDistanceText ? ` · ${previewDistanceText}` : ''}
                </PreviewMeta>
              </PreviewBody>
              <PreviewMore>
                <PreviewMoreText>{t('map.detail.more')}</PreviewMoreText>
                <ChevronRight color={colors.textOnColor} size={14} strokeWidth={2.8} />
              </PreviewMore>
            </PreviewOpenButton>
            <PreviewCloseButton
              accessibilityRole="button"
              accessibilityLabel={t('map.a11y.closePreview')}
              onPress={handleClosePreview}
            >
              <X color={colors.textMuted} size={20} strokeWidth={2.6} />
            </PreviewCloseButton>
          </PreviewCard>
        </PreviewStrip>
      ) : null}

      <BottomPanel
        style={{
          height: expandedPanelHeight,
          transform: [{ translateY: panelTranslateY }],
        }}
      >
        {/* 드래그 전용이던 핸들을 스크린리더에서는 버튼으로 읽게 한다(두 번 탭 = 접힘 → 반 → 전체 → 접힘). */}
        <PanelHandleButton
          {...panelPanResponder.panHandlers}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t(
            panelStop === 'full' ? 'map.a11y.collapseList' : 'map.a11y.expandList',
          )}
          // 라벨이 '펼치기'인 반 정지점에서 '펼쳐짐'이라 읽히지 않게 전체일 때만 펼쳐진 것으로 둔다.
          accessibilityState={{ expanded: panelStop === 'full' }}
          accessibilityActions={panelHandleActions}
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'activate') {
              animatePanelTo(getNextPanelStopOnTap(panelStop));
            }
          }}
        >
          <PanelHandleBar />
        </PanelHandleButton>
        {/* 상세를 여는 동안에도 목록은 언마운트하지 않고 아래에 숨겨 둔다. 돌아오면 스크롤 자리가 그대로다. */}
        <PanelBody>
          <PanelLayer
            pointerEvents={selectedPlace ? 'none' : 'auto'}
            accessibilityElementsHidden={!!selectedPlace}
            importantForAccessibility={selectedPlace ? 'no-hide-descendants' : 'auto'}
          >
            <PanelHeader>
              <PanelCount>
                {t('map.labels.visibleSummary', {
                  places: visiblePlaces.length,
                  shelters: visibleShelterCount,
                })}
              </PanelCount>
            </PanelHeader>

            {/* 옛 데이터가 있으면 목록은 그대로 두고 위에 오류 줄만, 없으면 스피너 대신 오류 상태. */}
            {mapFetchError && mapData ? (
              <PanelErrorRow>
                <PanelErrorText>{t('map.labels.loadFailed')}</PanelErrorText>
                <RetryButton onPress={fetchMap}>
                  <RetryButtonText>{t('map.labels.retry')}</RetryButtonText>
                </RetryButton>
              </PanelErrorRow>
            ) : null}

            {mapFetchError && !mapData ? (
              <PanelLoading style={panelHiddenPadStyle}>
                <PanelErrorText>{t('map.labels.loadFailed')}</PanelErrorText>
                <RetryButton onPress={fetchMap}>
                  <RetryButtonText>{t('map.labels.retry')}</RetryButtonText>
                </RetryButton>
              </PanelLoading>
            ) : !mapData || !panelReady ? (
              <PanelLoading style={panelHiddenPadStyle}>
                <ActivityIndicator color={colors.primary} />
                <PanelLoadingText>
                  {t('map.labels.loadingShelters')}
                </PanelLoadingText>
              </PanelLoading>
            ) : (
              // 광역 줌에서는 수백 곳이 한꺼번에 들어오므로 화면에 보이는 행만 만든다.
              <FlatList
                style={placeListStyle}
                contentContainerStyle={panelHiddenPadStyle}
                data={listRows}
                keyExtractor={panelRowKeyExtractor}
                renderItem={renderPanelRow}
                initialNumToRender={12}
                windowSize={7}
                showsVerticalScrollIndicator={false}
              />
            )}
          </PanelLayer>
          {selectedPlace ? (
            <DetailLayer>
              <PanelHeader>
                <BackButton
                  accessibilityRole="button"
                  accessibilityLabel={t('map.a11y.back')}
                  hitSlop={12}
                  onPress={handleBackToPlaceList}
                >
                  <ChevronLeft color={colors.text} size={20} strokeWidth={2.8} />
                </BackButton>
                <PanelTitle numberOfLines={1}>{selectedPlace.name}</PanelTitle>
              </PanelHeader>

              <DetailAddress numberOfLines={2}>
                {selectedPlace.address || t('map.labels.noAddress')}
              </DetailAddress>
              {/* 길찾기는 설치된 앱을 먼저 연다(없으면 웹). 좌표 없는 장소는 공유만. */}
              <DetailActionRow>
                {selectedPlace.coords ? (
                  <>
                    <DirectionsButton
                      hitSlop={actionRowHitSlop}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('map.detail.directions')} ${t(
                        'map.detail.kakaoMap',
                      )}`}
                      onPress={() => handleOpenKakaoMap(selectedPlace)}
                    >
                      <Navigation color={colors.textOnColor} size={14} strokeWidth={2.6} />
                      <DirectionsButtonText>
                        {t('map.detail.kakaoMap')}
                      </DirectionsButtonText>
                    </DirectionsButton>
                    <SecondaryActionButton
                      hitSlop={actionRowHitSlop}
                      accessibilityRole="button"
                      accessibilityLabel={`${t('map.detail.directions')} ${t(
                        'map.detail.naverMap',
                      )}`}
                      onPress={() => handleOpenNaverMap(selectedPlace)}
                    >
                      <Navigation color={colors.brand} size={14} strokeWidth={2.6} />
                      <SecondaryActionButtonText>
                        {t('map.detail.naverMap')}
                      </SecondaryActionButtonText>
                    </SecondaryActionButton>
                  </>
                ) : null}
                <SecondaryActionButton
                  hitSlop={actionRowHitSlop}
                  accessibilityRole="button"
                  onPress={() => handleSharePlace(selectedPlace)}
                >
                  <Share2 color={colors.brand} size={14} strokeWidth={2.6} />
                  <SecondaryActionButtonText>
                    {t('map.detail.share')}
                  </SecondaryActionButtonText>
                </SecondaryActionButton>
              </DetailActionRow>
              {selectedPlace.description ? (
                <DetailDescription numberOfLines={2}>
                  {selectedPlace.description}
                </DetailDescription>
              ) : null}
              <DetailMeta>
                {t('map.labels.shelter')} {selectedPlace.shelterCount}
              </DetailMeta>

              <PanelScroll
                showsVerticalScrollIndicator={false}
                contentContainerStyle={panelHiddenPadStyle}
              >
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
                          accessibilityRole="imagebutton"
                          accessibilityLabel={t('map.a11y.viewImage')}
                          onPress={() =>
                            setImageModal({
                              images: shelterImages,
                              index: imageIndex,
                            })
                          }
                        >
                          <ShelterImage
                            source={resolveImageSource(shelterImages[imageIndex])}
                            onError={() =>
                              handleImageError(shelterImages[imageIndex])
                            }
                            resizeMode="cover"
                          />
                          {shelterImages.length > 1 ? (
                            <>
                              <ImageNavButton
                                $position="left"
                                accessibilityRole="button"
                                accessibilityLabel={t('map.a11y.previousImage')}
                                hitSlop={7}
                                onPress={() =>
                                  handleChangeShelterImage(
                                    shelter.shelterId,
                                    shelterImages.length,
                                    -1,
                                  )
                                }
                              >
                                <ChevronLeft
                                  color={colors.textOnColor}
                                  size={18}
                                  strokeWidth={2.8}
                                />
                              </ImageNavButton>
                              <ImageNavButton
                                $position="right"
                                accessibilityRole="button"
                                accessibilityLabel={t('map.a11y.nextImage')}
                                hitSlop={7}
                                onPress={() =>
                                  handleChangeShelterImage(
                                    shelter.shelterId,
                                    shelterImages.length,
                                    1,
                                  )
                                }
                              >
                                <ChevronRight
                                  color={colors.textOnColor}
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
                            <Users color={colors.textTertiary} size={14} strokeWidth={2.4} />
                            <ShelterMetaText>
                              {shelter.capacity.toLocaleString()}
                            </ShelterMetaText>
                          </ShelterMetaIconText>
                        ) : null}
                        {typeof shelter.area === 'number' ? (
                          <ShelterMetaIconText>
                            <Square color={colors.textTertiary} size={13} strokeWidth={2.4} />
                            <ShelterMetaText>
                              {shelter.area.toLocaleString()}㎡
                            </ShelterMetaText>
                          </ShelterMetaIconText>
                        ) : null}
                        {typeof shelter.capacity !== 'number' &&
                        typeof shelter.area !== 'number' ? (
                          <ShelterMetaText>
                            {t('map.labels.noScaleInfo')}
                          </ShelterMetaText>
                        ) : null}
                      </ShelterMetaRow>
                      {/* 기관명과 전화번호를 나눠 번호만 눌러서 걸 수 있게 한다. */}
                      <ShelterContactRow>
                        {shelter.managingAuthorityName ||
                        !shelter.managingAuthorityTelNo ? (
                          <ShelterMeta>
                            {shelter.managingAuthorityName ||
                              t('map.labels.noManagingAuthority')}
                          </ShelterMeta>
                        ) : null}
                        {shelter.managingAuthorityTelNo ? (
                          getTelUrl(shelter.managingAuthorityTelNo) ? (
                            <PhoneButton
                              hitSlop={phoneHitSlop}
                              accessibilityRole="button"
                              accessibilityLabel={`${t('map.detail.call')} ${
                                shelter.managingAuthorityTelNo
                              }`}
                              onPress={() =>
                                handleCall(shelter.managingAuthorityTelNo)
                              }
                            >
                              <Phone color={colors.primary} size={12} strokeWidth={2.6} />
                              <PhoneButtonText>
                                {shelter.managingAuthorityTelNo}
                              </PhoneButtonText>
                            </PhoneButton>
                          ) : (
                            <ShelterMeta>{shelter.managingAuthorityTelNo}</ShelterMeta>
                          )
                        ) : null}
                      </ShelterContactRow>
                      <ChipRow>
                        {getAccessibilityChips(shelter).map(chip => {
                          const chipLabel = t(chip.labelKey);
                          // 색만으로 있음/없음을 가르지 않게 아이콘과 읽기 라벨을 같이 둔다.
                          return (
                            <AccessChip
                              key={`${shelter.shelterId}-${chip.key}`}
                              $active={chip.active}
                              accessible
                              accessibilityLabel={t(
                                chip.active
                                  ? 'map.a11y.facilityAvailable'
                                  : 'map.a11y.facilityUnavailable',
                                { name: chipLabel },
                              )}
                            >
                              {chip.active ? (
                                <Check color={colors.textOnColor} size={11} strokeWidth={3} />
                              ) : (
                                <X color={colors.textDisabled} size={11} strokeWidth={3} />
                              )}
                              <AccessChipText $active={chip.active}>
                                {chipLabel}
                              </AccessChipText>
                            </AccessChip>
                          );
                        })}
                      </ChipRow>
                      {shelter.etcFacilities?.trim() ? (
                        <ShelterMeta>
                          {t('map.report.etcFacilities')}:{' '}
                          {shelter.etcFacilities.trim()}
                        </ShelterMeta>
                      ) : null}
                      {/* 조사 완료면 서버가 400 으로 거절하므로 미리 막고, 비로그인이면 로그인으로 안내한다. */}
                      {shelter.surveyStatus === 'INVESTIGATED' ? (
                        <ReportDoneBadge>
                          <ReportDoneBadgeText>
                            {t('map.detail.investigated')}
                          </ReportDoneBadgeText>
                        </ReportDoneBadge>
                      ) : user ? (
                        <ReportButton onPress={() => openReportModal(shelter)}>
                          <Camera
                            color={colors.primary}
                            size={16}
                            strokeWidth={2.5}
                          />
                          <ReportButtonText>
                            {t('map.report.button')}
                          </ReportButtonText>
                        </ReportButton>
                      ) : (
                        <ReportLoginButton onPress={() => navigation.navigate('More')}>
                          <ReportLoginButtonText>
                            {t('map.detail.loginToReport')}
                          </ReportLoginButtonText>
                        </ReportLoginButton>
                      )}
                    </ShelterItem>
                    );
                  })
                ) : (
                  <EmptyPanelText>{t('map.labels.noShelters')}</EmptyPanelText>
                )}
              </PanelScroll>
            </DetailLayer>
          ) : null}
        </PanelBody>
      </BottomPanel>

      {/* Modal 이라 뒤로가기(onRequestClose)와 스크린리더 포커스 가두기를 기본으로 받는다. */}
      <Modal
        animationType="fade"
        transparent
        visible={isAccessibilityInfoVisible}
        onRequestClose={closeAccessibilityInfo}
      >
        <AccessibilityInfoOverlay
          accessible={false}
          importantForAccessibility="no"
          onPress={closeAccessibilityInfo}
        >
          <AccessibilityInfoCard
            accessibilityViewIsModal
            importantForAccessibility="yes"
            onPress={event => event.stopPropagation()}
          >
            <AccessibilityInfoHeader>
              <AccessibilityInfoTitle accessibilityRole="header">
                {t('map.accessibilityInfo.title')}
              </AccessibilityInfoTitle>
              <AccessibilityInfoCloseButton
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={closeAccessibilityInfo}
              >
                <X color={colors.textMuted} size={22} strokeWidth={2.6} />
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
                <AccessibilityLegendDot $color={colors.primary} />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.blue')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color={colors.a11yLegend.accessible} />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.green')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color={colors.a11yLegend.partial} />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.orange')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
              <AccessibilityLegendRow>
                <AccessibilityLegendDot $color={colors.a11yLegend.inaccessible} />
                <AccessibilityLegendText>
                  {t('map.accessibilityInfo.red')}
                </AccessibilityLegendText>
              </AccessibilityLegendRow>
            </AccessibilityLegendList>
            <AccessibilityInfoButton
              accessibilityRole="button"
              onPress={closeAccessibilityInfo}
            >
              <AccessibilityInfoButtonText>
                {t('map.accessibilityInfo.close')}
              </AccessibilityInfoButtonText>
            </AccessibilityInfoButton>
          </AccessibilityInfoCard>
        </AccessibilityInfoOverlay>
      </Modal>

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
                <ReportCloseButton
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                  hitSlop={5}
                  onPress={closeReportModal}
                >
                  <X color={colors.textMuted} size={22} strokeWidth={2.6} />
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
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: reportForm.ramp }}
                      onPress={() => updateReportForm('ramp', !reportForm.ramp)}
                    >
                      <ReportToggleText $active={reportForm.ramp}>
                        {t('map.filters.ramp')}
                      </ReportToggleText>
                    </ReportToggle>
                    <ReportToggle
                      $active={reportForm.elevator}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: reportForm.elevator }}
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
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: reportForm.brailleBlock }}
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
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: reportForm.accessibleToilet }}
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
                  <ImageAttachButton
                    label={t('map.report.addImage')}
                    onPress={addReportImages}
                  />

                  {reportForm.images.map(image => (
                    <ReportImageItem key={image.id}>
                      <ReportImagePreview source={{ uri: image.uri }} />
                      <ReportImageBody>
                        <ReportImageTopRow>
                          <ReportImageName numberOfLines={1}>
                            {image.fileName}
                          </ReportImageName>
                          <ReportImageRemoveButton
                            accessibilityRole="button"
                            accessibilityLabel={t('map.a11y.removeImage')}
                            hitSlop={8}
                            onPress={() => removeReportImage(image.id)}
                          >
                            <Trash2
                              color={colors.dangerBright}
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
                              accessibilityRole="radio"
                              accessibilityState={{
                                checked: image.category === category.value,
                              }}
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
                          placeholderTextColor={colors.textDisabled}
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
                    placeholderTextColor={colors.textDisabled}
                    multiline
                    textAlignVertical="top"
                  />
                </ReportEtcField>
              </ReportModalScroll>

              <SubmitButton
                label={t('map.report.submit')}
                loading={isReportSubmitting}
                onPress={submitShelterReport}
              />
            </ReportModalCard>
          </KeyboardAvoidingView>
        </ReportModalOverlay>
      </Modal>

      <FullscreenImageViewer
        value={imageModal}
        onChange={setImageModal}
        resolveSource={resolveImageSource}
        onImageError={handleImageError}
      />
    </Screen>
  );
}
