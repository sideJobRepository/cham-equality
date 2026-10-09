import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  type LayoutChangeEvent,
  NativeModules,
  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components/native';

const { ChamSplash } = NativeModules as {
  ChamSplash?: { hide: () => void };
};

// 가운데 앱 로고 + "모두의 안전" 을 합친 이미지, 하단 대전참여자치시민연대 로고(흰 알약 박스).
// 네이티브 스플래시(res/drawable-xxxhdpi/splash_*.png)와 같은 파일이다.
const splashIcon = require('../assets/images/splash-icon.png');
const splashBranding = require('../assets/images/splash-branding.png');
// 홍보 배너 하단 일러스트(대전 스카이라인·엑스포다리·시민들). 윗부분은 투명하게 페이드 처리돼 있다.
const splashBand = require('../assets/images/splash-band.png');
const BAND_RATIO = 234 / 1080;
// 화면 폭보다 30% 크게 그려 양옆을 잘라낸다. 원본 해상도(가로 480px) 때문에 이보다 키우면 흐려진다.
const BAND_SCALE = 1.3;

// res/values/splash_colors.xml 의 splash_background 와 같은 값.
const SPLASH_BACKGROUND = '#EAF4FF';
// 네이티브 스플래시(Android 12 규격)는 배경 없는 아이콘을 288dp 정사각형으로 화면 정중앙에,
// 브랜딩 이미지는 200x80dp 로 화면 하단에서 60dp 띄워 그린다. 같은 크기·자리에 그려야 이어질 때 튀지 않는다.
const ICON_BOX = 288;
// 아이콘 이미지 안에서 "모두의 안전" 글자가 끝나는 지점(세로 약 72%). 부제를 그 밑에 붙인다.
const TITLE_BOTTOM_RATIO = 0.72;
const BRANDING_WIDTH = 200;
const BRANDING_HEIGHT = 80;
const BRANDING_BOTTOM = 60;
// 너무 빨리 사라지면 깜빡임처럼 보여서 최소 노출 시간을 둔다.
const MIN_VISIBLE_MS = 1300;
// 뒤로가기로 나갔다 다시 켤 때(프로세스는 살아 있음)는 페이드아웃까지 합쳐 1초쯤만 보여준다.
const RELAUNCH_MIN_VISIBLE_MS = 700;

// JS 는 화면(Activity)이 다시 만들어져도 살아 있으므로, 두 번째 마운트부터는 재실행으로 본다.
let launchedBefore = false;
const DECOR_FADE_IN_MS = 400;
const FADE_OUT_MS = 300;

interface SplashOverlayProps {
  /** 앱이 첫 화면을 그릴 준비가 됐는지(세션 복원 완료 등). true 가 되면 걷기 시작한다. */
  ready: boolean;
  onFinish: () => void;
}

export default function SplashOverlay({ ready, onFinish }: SplashOverlayProps) {
  // i18n 은 index.js 에서 리소스를 직접 넘겨 동기로 초기화되므로 첫 렌더부터 번역이 준비돼 있다.
  const { t: translate } = useTranslation();
  const opacity = useRef(new Animated.Value(1)).current;
  // 네이티브 스플래시엔 없는 꾸밈(하늘 그라데이션·부제·일러스트)은 이어받은 뒤 살며시 띄운다.
  const decorOpacity = useRef(new Animated.Value(0)).current;
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [minVisibleMs] = useState(() =>
    launchedBefore ? RELAUNCH_MIN_VISIBLE_MS : MIN_VISIBLE_MS,
  );
  useEffect(() => {
    launchedBefore = true;
  }, []);
  // RN 루트 뷰의 실제 높이. 이걸 재야 네이티브 스플래시와 같은 자리를 계산할 수 있다.
  const [rootHeight, setRootHeight] = useState<number | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    if (rootHeight === null) setRootHeight(event.nativeEvent.layout.height);
  };

  // 같은 자리에 같은 그림을 그린 뒤에야 네이티브 스플래시를 걷는다. 그 전엔 어긋난 화면이 보일 수 있다.
  useEffect(() => {
    if (rootHeight === null) return;
    ChamSplash?.hide();
    Animated.timing(decorOpacity, {
      toValue: 1,
      duration: DECOR_FADE_IN_MS,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => setMinTimePassed(true), minVisibleMs);
    return () => clearTimeout(timer);
  }, [rootHeight, decorOpacity, minVisibleMs]);

  useEffect(() => {
    if (!ready || !minTimePassed) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [ready, minTimePassed, opacity, onFinish]);

  // 네이티브 스플래시는 화면 전체 기준으로 그린다. 루트 뷰가 화면을 꽉 채우면(타겟 SDK 36 의
  // Android 15+ 엣지 투 엣지) 보정이 필요 없고, 덜 채우면 위는 상태바, 아래는 내비게이션 바만큼 줄어든 것이다.
  const screen = Dimensions.get('screen');
  const window = Dimensions.get('window');
  const layout = (() => {
    if (rootHeight === null) return null;
    const statusBarHeight =
      Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
    const topInset = rootHeight < screen.height - 1 ? statusBarHeight : 0;
    const bottomInset = Math.max(0, screen.height - rootHeight - topInset);
    return {
      iconTop: (screen.height - ICON_BOX) / 2 - topInset,
      brandingBottom: BRANDING_BOTTOM - bottomInset,
    };
  })();

  return (
    <Overlay style={{ opacity }} pointerEvents="none" onLayout={handleLayout}>
      <StatusBar backgroundColor={SPLASH_BACKGROUND} barStyle="dark-content" />
      {layout ? (
        <>
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: decorOpacity }]}
          >
            <LinearGradient
              colors={['#BFDDFF', '#DDEEFF', SPLASH_BACKGROUND]}
              locations={[0, 0.35, 0.55]}
              style={StyleSheet.absoluteFill}
            />
            <Band
              source={splashBand}
              style={{
                width: window.width * BAND_SCALE,
                height: window.width * BAND_SCALE * BAND_RATIO,
                left: (window.width * (1 - BAND_SCALE)) / 2,
              }}
            />
            <Subtitle
              style={{
                top: layout.iconTop + ICON_BOX * TITLE_BOTTOM_RATIO + 10,
              }}
            >
              {translate('splash.tagline')}
            </Subtitle>
          </Animated.View>
          <Icon source={splashIcon} style={{ top: layout.iconTop }} />
          <Branding
            source={splashBranding}
            style={{ bottom: layout.brandingBottom }}
          />
        </>
      ) : null}
    </Overlay>
  );
}

const Overlay = styled(Animated.View)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: ${SPLASH_BACKGROUND};
`;

const Icon = styled.Image`
  position: absolute;
  align-self: center;
  width: ${ICON_BOX}px;
  height: ${ICON_BOX}px;
`;

const Subtitle = styled.Text`
  position: absolute;
  left: 0;
  right: 0;
  color: #3b5b8a;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  letter-spacing: -0.3px;
  padding: 0 24px;
`;

const Band = styled.Image`
  position: absolute;
  bottom: 0;
`;

const Branding = styled.Image`
  position: absolute;
  align-self: center;
  width: ${BRANDING_WIDTH}px;
  height: ${BRANDING_HEIGHT}px;
`;
