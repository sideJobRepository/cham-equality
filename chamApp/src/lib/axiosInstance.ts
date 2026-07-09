import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import Config from 'react-native-config';
import { tokenStore } from '../services/tokenStore';
import { getRefreshToken } from '../services/refreshTokenStore';
import { applySession, clearSession, type AuthResponse } from '../services/authSession';

type AuthAxiosRequestConfig = InternalAxiosRequestConfig & {
  __hadAuth?: boolean;
};

const api = axios.create({
  baseURL: Config.API_BASE_URL ?? 'http://10.0.2.2:8080',
  timeout: 15000,
});

// 동시에 여러 요청이 401을 맞아도 refresh는 한 번만 돌도록 공유하는 단일 Promise 락.
let refreshing: Promise<string | null> | null = null;

/**
 * Keychain의 refresh token으로 새 access token을 발급받아 세션에 반영한다.
 * 앱 부팅 시 세션 복원, 그리고 401 응답 시 자동 재발급 두 경로에서 쓰인다.
 * 인터셉터 재귀를 피하려고 raw axios로 호출한다.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const rt = await getRefreshToken();
  if (!rt) return null;

  try {
    const { data } = await axios.post<AuthResponse>('/api/refresh', null, {
      baseURL: api.defaults.baseURL,
      headers: { 'X-Refresh-Token': rt },
    });
    if (!data?.token) {
      await clearSession();
      return null;
    }
    await applySession(data);
    return data.token;
  } catch {
    await clearSession();
    return null;
  } finally {
    refreshing = null;
  }
}

api.interceptors.request.use((config: AuthAxiosRequestConfig) => {
  if (config.url?.includes('/api/refresh')) return config;

  const token = tokenStore.get();
  config.__hadAuth = !!token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { __isRetryRequest?: boolean; __hadAuth?: boolean })
      | undefined;

    if (!error.response || !original) return Promise.reject(error);
    if (original.url?.includes('/api/refresh')) return Promise.reject(error);

    // 토큰을 달고 나간 요청이 401이고, 아직 재시도 전일 때만 refresh 시도
    if (
      error.response.status !== 401 ||
      original.__isRetryRequest ||
      !original.__hadAuth
    ) {
      return Promise.reject(error);
    }

    if (!refreshing) refreshing = refreshAccessToken();
    const newToken = await refreshing;
    if (!newToken) return Promise.reject(error);

    // 재시도. Authorization은 요청 인터셉터가 새 토큰으로 다시 붙인다.
    original.__isRetryRequest = true;
    return api(original);
  },
);

export default api;
