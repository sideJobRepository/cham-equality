import { login, logout, me, KakaoLoginToken, KakaoUser } from '@react-native-kakao/user';

export type KakaoLoginResult = {
  token: KakaoLoginToken;
  profile: KakaoUser;
};

export async function loginWithKakao(): Promise<KakaoLoginResult> {
  const token = await login();
  const profile = await me();
  return { token, profile };
}

export async function logoutFromKakao(): Promise<void> {
  await logout();
}
