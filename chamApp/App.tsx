import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { refreshAccessToken } from './src/lib/axiosInstance';

function App() {
  // 앱 시작 시 Keychain의 refresh token으로 세션 복원(로그인 안 했으면 즉시 no-op).
  // 로그인은 선택 기능이라 UI를 막지 않고 백그라운드로 복원한다.
  useEffect(() => {
    refreshAccessToken();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
