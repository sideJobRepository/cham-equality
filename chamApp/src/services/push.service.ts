import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import api from '../lib/axiosInstance.ts';
import {
  navigationRef,
  type RootTabParamList,
} from '../navigation/AppNavigator.tsx';
import { usePushStore, useSplashStore, useUserStore } from '../store';
import { useDialogUtil } from '../utils/dialog.tsx';
import { refreshSMS } from './sms.service.ts';

const messaging = getMessaging();

const PREFERENCES_STORAGE_KEY = 'push.preferences';

/**
 * 푸시 연결. 로그인과 무관하게 모든 기기를 등록한다.
 * - 스플래시가 걷힌 뒤 알림 권한을 묻는다(Android 13+). 두 번 거절하면 OS가 더는 묻지 않는다.
 * - 토큰은 앱 언어·알림 설정과 함께 서버에 올리고, 토큰·언어·로그인 상태·설정이 바뀌면 다시 올린다.
 * - 앱을 쓰는 중 받은 알림은 OS가 띄우지 않으므로 공통 알림창으로 보여준다.
 * - 재난문자 알림을 누르면 홈에서 해당 상세를, 제보 결과 알림을 누르면 더보기에서 그 제보 상세를 연다.
 *   관리자 개별 알림(notice)은 앱만 연다.
 */
export function usePushRegistration() {
  const { i18n } = useTranslation();
  const { alert } = useDialogUtil();
  const splashDone = useSplashStore(state => state.done);
  // 로그인·로그아웃이 바뀌면 다시 등록해 서버의 회원 연결을 맞춘다(개인 알림 대상).
  // 요청에 붙는 JWT로 서버가 회원을 판단하므로 값 자체는 보내지 않는다.
  const userId = useUserStore(state => state.user?.id ?? null);
  const disasterEnabled = usePushStore(state => state.disasterEnabled);
  const personalEnabled = usePushStore(state => state.personalEnabled);
  const preferencesRestored = usePushStore(state => state.preferencesRestored);
  const language = i18n.language;

  useEffect(() => {
    if (!splashDone || Platform.OS !== 'android') return;
    requestNotificationPermission();
  }, [splashDone]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (!preferencesRestored) return;
    const preferences = { disasterEnabled, personalEnabled };
    let cancelled = false;
    getToken(messaging)
      .then(token => {
        if (!cancelled) return registerToken(token, language, preferences);
      })
      .catch(() => {});
    const unsubscribe = onTokenRefresh(messaging, token => {
      registerToken(token, language, preferences).catch(() => {});
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [language, userId, disasterEnabled, personalEnabled, preferencesRestored]);

  useEffect(() => {
    return onMessage(messaging, message => {
      const type = message.data?.type;
      if (type !== 'disaster' && type !== 'notice' && type !== 'report') return;
      if (type === 'disaster') refreshSMS(language).catch(() => {});
      alert(
        message.notification?.title ?? '',
        message.notification?.body ?? undefined,
        { tone: type === 'disaster' ? 'warning' : 'info' },
      );
    });
  }, [alert, language]);

  useEffect(() => {
    const unsubscribe = onNotificationOpenedApp(messaging, message => {
      openFromNotification(message, language);
    });
    // 앱이 완전히 꺼져 있다가 알림으로 켜진 경우
    getInitialNotification(messaging)
      .then(message => {
        if (message) openFromNotification(message, language);
      })
      .catch(() => {});
    return unsubscribe;
    // 첫 실행 알림은 한 번만 처리하면 되므로 언어 변경에 다시 걸지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** 기기에 저장해 둔 알림 설정을 되살린다. 앱 시작 시 한 번, 토큰 등록 전에 부른다. */
export async function restorePushPreferences() {
  try {
    const saved = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved) as {
      disasterEnabled?: unknown;
      personalEnabled?: unknown;
    };
    usePushStore.getState().setPreferences({
      disasterEnabled: parsed.disasterEnabled !== false,
      personalEnabled: parsed.personalEnabled !== false,
    });
  } catch {
    // 못 읽으면 둘 다 켠 기본값으로 둔다.
  } finally {
    usePushStore.getState().markPreferencesRestored();
  }
}

/** 더보기의 알림 토글. 저장하면 등록 effect 가 서버에도 다시 올린다. */
export function updatePushPreferences(preferences: {
  disasterEnabled?: boolean;
  personalEnabled?: boolean;
}) {
  const store = usePushStore.getState();
  store.setPreferences(preferences);
  const next = usePushStore.getState();
  AsyncStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify({
      disasterEnabled: next.disasterEnabled,
      personalEnabled: next.personalEnabled,
    }),
  ).catch(() => {});
}

async function requestNotificationPermission() {
  // 13 미만은 설치 시점에 허용된 상태라 물을 게 없다.
  if (Number(Platform.Version) < 33) return;
  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (await PermissionsAndroid.check(permission)) return;
  await PermissionsAndroid.request(permission);
}

/** OS 알림 권한이 켜져 있는지. 꺼져 있으면 앱 토글을 켜도 알림이 안 온다. */
export async function hasNotificationPermission() {
  if (Platform.OS !== 'android' || Number(Platform.Version) < 33) return true;
  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
}

function registerToken(
  token: string,
  language: string,
  preferences: { disasterEnabled: boolean; personalEnabled: boolean },
) {
  return api.post('/api/app/push-tokens', {
    token,
    platform: Platform.OS,
    language,
    ...preferences,
  });
}

async function openFromNotification(
  message: RemoteMessage,
  language: string,
) {
  const type = message.data?.type;

  if (type === 'report') {
    const reportId = Number(message.data?.reportId);
    if (!Number.isFinite(reportId)) return;
    usePushStore.getState().requestOpenReport(reportId);
    navigateWhenReady('More');
    return;
  }

  if (type !== 'disaster') return;
  const messageId = Number(message.data?.messageId);
  if (!Number.isFinite(messageId)) return;

  // 홈 목록에 아직 새 문자가 없을 수 있어 먼저 받아 둔다. 실패해도 홈은 가지고 있는 목록으로 연다.
  await refreshSMS(language).catch(() => {});
  usePushStore.getState().requestOpen(messageId);
  // 앱이 꺼져 있다 켜진 경우엔 아직 내비게이션이 준비 전이지만, 첫 탭이 홈이라 그대로 둔다.
  if (navigationRef.isReady()) navigationRef.navigate('Home');
}

/** 알림으로 앱이 켜지면 내비게이션이 세션 복원 뒤에 생긴다. 준비될 때까지 잠깐 기다렸다 옮긴다. */
function navigateWhenReady(route: keyof RootTabParamList, attempts = 40) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(route as never);
    return;
  }
  if (attempts <= 0) return;
  setTimeout(() => navigateWhenReady(route, attempts - 1), 250);
}
