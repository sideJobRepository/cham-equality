import { useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
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

interface MapMessageEvent {
  nativeEvent: {
    data: string;
  };
}

interface SelectedPlace {
  placeId: number;
  name: string;
  address: string;
  description: string;
  shelterCount: number;
}

interface WebMessagePayload {
  type: 'marker' | 'ready' | 'error';
  payload?: SelectedPlace;
  message?: string;
  totalCount?: number;
  visibleCount?: number;
}

function buildMapHtml(mapKey: string, mapPayloadJson: string) {
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
            payload: {
              placeId: item.placeId,
              name: item.name || '대피소',
              address: item.address || '',
              description: item.description || '',
              shelterCount: Array.isArray(item.shelters) ? item.shelters.length : 0,
            },
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
        const center = new window.kakao.maps.LatLng(36.3504, 127.3845);

        const map = new window.kakao.maps.Map(container, {
          center: center,
          level: 9,
          mapTypeId: window.kakao.maps.MapTypeId.ROADMAP,
        });

        map.relayout();
        map.setCenter(center);
        map.setLevel(9);
        map.setMapTypeId(window.kakao.maps.MapTypeId.ROADMAP);

        let overlays = [];

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

        function draw() {
          clearOverlays();

          const mode = currentItems(map.getLevel());
          let visibleCount = 0;

          mode.items.forEach(function(item) {
            const coords = toLatLng(item);
            if (!coords) return;
            visibleCount += 1;

            const position = new window.kakao.maps.LatLng(coords.lat, coords.lng);
            const overlay = mode.kind === 'detail'
              ? createDetailOverlay(map, item, position)
              : createSummaryOverlay(map, item, position);

            overlays.push(overlay);
          });

          if (!visibleCount) {
            window.__notify({ type: 'error', message: '지도에 표시할 좌표가 없습니다' });
            return;
          }

          window.__notify({
            type: 'ready',
            totalCount: details.length,
            visibleCount: visibleCount,
          });
        }

        draw();
        window.kakao.maps.event.addListener(map, 'zoom_changed', draw);
      }

      window.kakao.maps.load(renderMap);
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
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );
  const [mapError, setMapError] = useState('');
  const [mapDebug, setMapDebug] = useState({ totalCount: 0, visibleCount: 0 });

  const mapHtml = useMemo(() => {
    const mapKey =
      Config.KAKAO_MAP_APP_KEY ?? Config.KAKAO_NATIVE_APP_KEY ?? '';
    if (!mapKey) return '';

    const payload = {
      details: Object.values(mapData?.details ?? {}),
      summaries: mapData?.summaries ?? {},
    };

    return buildMapHtml(mapKey, JSON.stringify(payload));
  }, [mapData]);

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

      if (parsed.type === 'ready') {
        setMapError('');
        setMapDebug({
          totalCount: parsed.totalCount ?? 0,
          visibleCount: parsed.visibleCount ?? 0,
        });
      }
    } catch {
      // no-op
    }
  };

  const handleShelterTypePress = (item: string) => {
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

  return (
    <Screen>
      <Header>
        <Description>여기에 내 위치 띄울거임.</Description>
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

      <DebugText>
        details {mapDebug.totalCount}개 / 현재표시 {mapDebug.visibleCount}개
      </DebugText>

      {selectedPlace ? (
        <DetailCard>
          <DetailTitle>{selectedPlace.name}</DetailTitle>
          <DetailAddress numberOfLines={2}>
            {selectedPlace.address || '주소 정보 없음'}
          </DetailAddress>
          {selectedPlace.description ? (
            <DetailDescription numberOfLines={3}>
              {selectedPlace.description}
            </DetailDescription>
          ) : null}
          <DetailMeta>연결된 대피소 {selectedPlace.shelterCount}개</DetailMeta>
        </DetailCard>
      ) : (
        <DetailPlaceholder>설명 문구 넣을 예정</DetailPlaceholder>
      )}
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

const Title = styled.Text`
  color: #111827;
  font-size: 28px;
  font-weight: 800;
`;

const Description = styled.Text`
  margin-top: 6px;
  color: #6b7280;
  font-size: 15px;
`;

const FilterSection = styled.View`
  gap: 10px;
  padding: 0 20px;
`;

const FilterGroup = styled.View`
  gap: 8px;
`;

const FilterLabel = styled.Text`
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
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
  flex: 1;
  overflow: hidden;
  margin: 14px 20px 0;
  border-radius: 22px;
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
  margin: 10px 20px 0;
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
`;

const DebugText = styled.Text`
  margin: 8px 20px 0;
  color: #6b7280;
  font-size: 12px;
`;

const DetailCard = styled.View`
  gap: 8px;
  margin: 14px 20px 20px;
  padding: 16px;
  border-radius: 20px;
  background-color: #ffffff;
`;

const DetailTitle = styled.Text`
  color: #111827;
  font-size: 17px;
  font-weight: 800;
`;

const DetailAddress = styled.Text`
  color: #4b5563;
  font-size: 14px;
  line-height: 20px;
`;

const DetailDescription = styled.Text`
  color: #374151;
  font-size: 14px;
  line-height: 20px;
`;

const DetailMeta = styled.Text`
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
`;

const DetailPlaceholder = styled.Text`
  margin: 14px 20px 20px;
  padding: 16px;
  border-radius: 20px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  background-color: #ffffff;
`;
