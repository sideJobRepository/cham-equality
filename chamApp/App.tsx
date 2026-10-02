import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import AppNavigator from './src/navigation/AppNavigator';
import { refreshAccessToken } from './src/lib/axiosInstance';
import { DialogProvider } from './src/utils/dialog';
import { useInAppUpdate } from './src/hooks/useInAppUpdate';

function App() {
  const [sessionRestored, setSessionRestored] = useState(false);

  // 앱 시작 시 Keychain의 refresh token으로 세션 복원(로그인 안 했으면 즉시 no-op).
  useEffect(() => {
    refreshAccessToken().finally(() => {
      setSessionRestored(true);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <DialogProvider>
        <InAppUpdateChecker />
        {sessionRestored ? (
          <AppNavigator />
        ) : (
          <SessionLoading>
            <ActivityIndicator color="#2563eb" />
          </SessionLoading>
        )}
      </DialogProvider>
    </SafeAreaProvider>
  );
}

// 업데이트 안내는 공통 다이얼로그를 쓰므로 DialogProvider 안쪽에서 돌아야 한다.
function InAppUpdateChecker() {
  useInAppUpdate();
  return null;
}

export default App;

const SessionLoading = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background: #ffffff;
`;
