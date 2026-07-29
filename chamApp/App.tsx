import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import AppNavigator from './src/navigation/AppNavigator';
import { refreshAccessToken } from './src/lib/axiosInstance';
import { DialogProvider } from './src/utils/dialog';

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

export default App;

const SessionLoading = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background: #ffffff;
`;
