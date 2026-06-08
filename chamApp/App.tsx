import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
