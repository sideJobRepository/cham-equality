import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  BookOpen,
  Home,
  Map,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ManualScreen from '../screens/ManualScreen';
import MoreScreen from '../screens/MoreScreen';

export type RootTabParamList = {
  Home: undefined;
  Map:
    | {
        focusPlaceId?: number;
        focusShelterId?: number;
        focusNonce?: number;
      }
    | undefined;
  Manual: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const tabIcons: Record<keyof RootTabParamList, LucideIcon> = {
  Home,
  Map,
  Manual: BookOpen,
  More: MoreHorizontal,
};

export default function AppNavigator() {
  const { t } = useTranslation();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: '#a3a7ac',
          tabBarIcon: ({ color, focused, size }) => {
            const Icon = tabIcons[route.name];
            return (
              <Icon
                color={color}
                size={focused ? size + 2 : size}
                strokeWidth={2.4}
              />
            );
          },
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
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarLabel: t('tabs.home') }}
        />
        <Tab.Screen
          name="Map"
          component={MapScreen}
          options={{ tabBarLabel: t('tabs.map') }}
        />
        <Tab.Screen
          name="Manual"
          component={ManualScreen}
          options={{ tabBarLabel: t('tabs.manual') }}
        />
        <Tab.Screen
          name="More"
          component={MoreScreen}
          options={{ tabBarLabel: t('tabs.more') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
