import { useCallback } from 'react';
import { useRequest } from '../hooks/useRequest';
import api from '../lib/axiosInstance';
import { loginWithKakao, logoutFromKakao } from '../auth/kakao';
import { loginWithNaver, logoutFromNaver } from '../auth/naver';
import { getAppleAuthorizationCode, loginWithApple } from '../auth/apple';
import { applySession, clearSession, type AuthResponse } from './authSession';
import { getRefreshToken } from './refreshTokenStore';
import { useUserStore } from '../store/user';

// 카카오 로그인: SDK accessToken → 우리 서버 JWT 발급 → 세션 반영
export function useKakaoLogin() {
  const { request } = useRequest();
  return useCallback(async () => {
    const kakao = await loginWithKakao();
    const data = await request<AuthResponse>(
      () =>
        api
          .post<AuthResponse>('/api/app/kakao-login', {
            accessToken: kakao.token.accessToken,
          })
          .then(res => res.data),
      undefined,
      { ignoreErrorRedirect: true },
    );
    if (data) await applySession(data);
  }, [request]);
}

// 네이버 로그인: SDK accessToken → 우리 서버 JWT 발급 → 세션 반영
export function useNaverLogin() {
  const { request } = useRequest();
  return useCallback(async () => {
    const naver = await loginWithNaver();
    const data = await request<AuthResponse>(
      () =>
        api
          .post<AuthResponse>('/api/app/naver-login', {
            accessToken: naver.token.accessToken,
          })
          .then(res => res.data),
      undefined,
      { ignoreErrorRedirect: true },
    );
    if (data) await applySession(data);
  }, [request]);
}

// 애플 로그인(iOS): identityToken(+최초 이름) → 우리 서버 JWT 발급
export function useAppleLogin() {
  const { request } = useRequest();
  return useCallback(async () => {
    const apple = await loginWithApple();
    if (!apple.identityToken)
      throw new Error('Apple identityToken이 없습니다.');
    const data = await request<AuthResponse>(
      () =>
        api
          .post<AuthResponse>('/api/app/apple-login', {
            accessToken: apple.identityToken,
            name: apple.name,
          })
          .then(res => res.data),
      undefined,
      { ignoreErrorRedirect: true },
    );
    if (data) await applySession(data);
  }, [request]);
}

// 회원 탈퇴: 서버에서 회원+관련 데이터 삭제 → 로컬 세션·소셜 세션 정리.
// 애플 회원은 서버가 애플 토큰을 철회할 수 있게 애플 창을 한 번 더 띄워 코드를 받는다.
// 사용자가 애플 창을 닫으면 탈퇴하지 않고 false.
export function useWithdraw() {
  const { request } = useRequest();
  return useCallback(async (): Promise<boolean> => {
    let appleAuthorizationCode: string | undefined;
    if (useUserStore.getState().user?.socialType === 'APPLE') {
      const code = await getAppleAuthorizationCode();
      if (!code) return false;
      appleAuthorizationCode = code;
    }
    await request(
      () =>
        api
          .delete('/api/app/member', {
            data: appleAuthorizationCode ? { appleAuthorizationCode } : undefined,
          })
          .then(res => res.data),
      undefined,
      { ignoreErrorRedirect: true },
    );
    await clearSession();
    try {
      await logoutFromKakao();
    } catch {
      // 카카오 세션이 없을 수도 있음
    }
    try {
      await logoutFromNaver();
    } catch {
      // 네이버 세션이 없을 수도 있음
    }
    return true;
  }, [request]);
}

// 로그아웃: 서버 refresh 삭제 시도 → 로컬 세션·카카오 세션 정리(실패해도 로컬은 정리)
export function useLogout() {
  const { request } = useRequest();
  return useCallback(async () => {
    const rt = await getRefreshToken();
    try {
      await request(
        () =>
          api.delete('/api/refresh', {
            headers: rt ? { 'X-Refresh-Token': rt } : undefined,
          }),
        undefined,
        { disableLoading: true },
      );
    } catch {
      // 서버 삭제 실패해도 클라 정리는 진행
    }
    await clearSession();
    try {
      await logoutFromKakao();
    } catch {
      // 카카오 세션이 없을 수도 있음
    }
    try {
      await logoutFromNaver();
    } catch {
      // 네이버 세션이 없을 수도 있음
    }
  }, [request]);
}

