import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import {
  BookOpen,
  Home,
  Map,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ManualScreen from '../screens/ManualScreen';
import MoreScreen from '../screens/MoreScreen';
import { colors } from '../theme/index.ts';

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

// 화면 밖(푸시 알림 탭 처리 등)에서 탭을 옮길 때 쓴다.
export const navigationRef = createNavigationContainerRef<RootTabParamList>();

function TabBarButton(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      android_ripple={{ color: 'transparent' }}
      pressColor="transparent"
    />
  );
}

const tabIcons: Record<keyof RootTabParamList, LucideIcon> = {
  Home,
  Map,
  Manual: BookOpen,
  More: MoreHorizontal,
};

export default function AppNavigator() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Math.max(insets.bottom, 8);

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
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
            height: 56 + tabBarBottomPadding,
            paddingTop: 6,
            paddingBottom: tabBarBottomPadding,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarButton: props => <TabBarButton {...props} />,
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
