import { appleAuth } from '@invertase/react-native-apple-authentication';

export interface AppleLoginResult {
  identityToken: string | null;
  name?: string;
}

// iOS 전용. 호출부에서 Platform.OS === 'ios' 가드 필요.
// 이름(fullName)은 최초 로그인 시 한 번만 내려오므로, 있을 때만 채워 백엔드로 넘긴다.
export async function loginWithApple(): Promise<AppleLoginResult> {
  const res = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
  });

  const family = res.fullName?.familyName ?? '';
  const given = res.fullName?.givenName ?? '';
  const name = `${family}${given}`.trim() || undefined; // 한국어 순서(성+이름)

  return { identityToken: res.identityToken, name };
}
