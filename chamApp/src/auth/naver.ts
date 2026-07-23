import NaverLogin, {
  type GetProfileResponse,
  type NaverLoginResponse,
} from '@react-native-seoul/naver-login';

export type NaverLoginResult = {
  token: NonNullable<NaverLoginResponse['successResponse']>;
  profile: GetProfileResponse['response'];
};

export async function loginWithNaver(): Promise<NaverLoginResult> {
  const result = await NaverLogin.login();

  if (!result.isSuccess || !result.successResponse) {
    if (result.failureResponse?.isCancel) {
      throw new Error('NAVER_LOGIN_CANCELLED');
    }
    throw new Error(
      result.failureResponse?.message || '네이버 로그인에 실패했습니다.',
    );
  }

  const profile = await NaverLogin.getProfile(
    result.successResponse.accessToken,
  );
  return { token: result.successResponse, profile: profile.response };
}

export async function logoutFromNaver(): Promise<void> {
  await NaverLogin.logout();
}
