import { Platform } from 'react-native';
import Config from 'react-native-config';
import {
  appleAuth,
  appleAuthAndroid,
} from '@invertase/react-native-apple-authentication';

export interface AppleLoginResult {
  identityToken: string | null;
  name?: string;
}

// 이름(fullName)은 최초 로그인 시 한 번만 내려오므로, 있을 때만 채워 백엔드로 넘긴다.
export async function loginWithApple(): Promise<AppleLoginResult> {
  if (Platform.OS === 'android') {
    const clientId = Config.APPLE_SERVICE_ID;
    const redirectUri = Config.APPLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error(
        'Android Apple 로그인 설정이 없습니다. APPLE_SERVICE_ID, APPLE_REDIRECT_URI를 .env에 추가하세요.',
      );
    }

    appleAuthAndroid.configure({
      clientId,
      redirectUri,
      responseType: appleAuthAndroid.ResponseType.ALL,
      scope: appleAuthAndroid.Scope.ALL,
      nonce: createRequestId(),
      state: createRequestId(),
    });

    const res = await appleAuthAndroid.signIn();
    const family = res.user?.name?.lastName ?? '';
    const given = res.user?.name?.firstName ?? '';
    const name = `${family}${given}`.trim() || undefined;

    return { identityToken: res.id_token ?? null, name };
  }

  const res = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });

  const family = res.fullName?.familyName ?? '';
  const given = res.fullName?.givenName ?? '';
  const name = `${family}${given}`.trim() || undefined; // 한국어 순서(성+이름)

  return { identityToken: res.identityToken, name };
}

function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
