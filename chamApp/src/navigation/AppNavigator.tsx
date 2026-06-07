import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ShelterScreen from '../screens/ShelterScreen';
import ReportScreen from '../screens/ReportScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootTabParamList = {
  Home: undefined;
  Shelter: undefined;
  Report: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function 그러AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            height: 64,
            paddingTop: 6,
            paddingBottom: 8,
            borderTopColor: '#e5e7eb',
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈' }} />
        <Tab.Screen name="Shelter" component={ShelterScreen} options={{ tabBarLabel: '대피소' }} />
        <Tab.Screen name="Report" component={ReportScreen} options={{ tabBarLabel: '제보' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '설정' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
