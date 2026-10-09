import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import AppNavigator from './src/navigation/AppNavigator';
import SplashOverlay from './src/components/SplashOverlay';
import { refreshAccessToken } from './src/lib/axiosInstance';
import { DialogProvider } from './src/utils/dialog';
import { useInAppUpdate } from './src/hooks/useInAppUpdate';
import {
  restorePushPreferences,
  usePushRegistration,
} from './src/services/push.service';
import { restoreSavedLanguage } from './src/i18n';
import { useSplashStore } from './src/store';

function App() {
  const [sessionRestored, setSessionRestored] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  // 앱 시작 시 Keychain의 refresh token으로 세션 복원(로그인 안 했으면 즉시 no-op)과
  // 저장된 언어·알림 설정 복원을 함께 기다린다. 그동안은 스플래시가 가려 준다.
  useEffect(() => {
    Promise.allSettled([
      refreshAccessToken(),
      restoreSavedLanguage(),
      restorePushPreferences(),
    ]).finally(
      () => {
        setSessionRestored(true);
      },
    );
  }, []);

  const setSplashDone = useSplashStore(state => state.setDone);

  const hideSplash = useCallback(() => {
    setSplashVisible(false);
    setSplashDone();
  }, [setSplashDone]);

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <DialogProvider>
        <InAppUpdateChecker />
        <PushRegistrar />
        {sessionRestored ? <AppNavigator /> : <SessionLoading />}
        {/* 세션 복원이 끝날 때까지 스플래시가 가려 주므로 따로 로딩 표시는 두지 않는다. */}
        {splashVisible ? (
          <SplashOverlay ready={sessionRestored} onFinish={hideSplash} />
        ) : null}
      </DialogProvider>
    </SafeAreaProvider>
  );
}

// 업데이트 안내는 공통 다이얼로그를 쓰므로 DialogProvider 안쪽에서 돌아야 한다.
function InAppUpdateChecker() {
  useInAppUpdate();
  return null;
}

// 앱 사용 중 받은 재난문자도 공통 다이얼로그로 띄우므로 같은 이유로 안쪽에 둔다.
function PushRegistrar() {
  usePushRegistration();
  return null;
}

export default App;

const SessionLoading = styled.View`
  flex: 1;
  background: #ffffff;
`;
