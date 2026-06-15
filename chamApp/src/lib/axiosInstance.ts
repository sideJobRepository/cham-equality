import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import Config from 'react-native-config';
import { tokenStore } from '../services/tokenStore';

type AuthAxiosRequestConfig = InternalAxiosRequestConfig & {
  __hadAuth?: boolean;
};

const api = axios.create({
  baseURL: Config.API_BASE_URL ?? 'http://10.0.2.2:8080',
  timeout: 15000,
  withCredentials: true,
});

api.interceptors.request.use(async (config: AuthAxiosRequestConfig) => {
  if (config.url?.includes('/api/refresh')) return config;

  let token = tokenStore.get();
  // Refresh token flow is temporarily disabled.
  // if (!token) {
  //   if (!refreshing) refreshing = refreshToken();
  //   token = await refreshing;
  // }

  config.__hadAuth = !!token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & {
      __isRetryRequest?: boolean;
      __hadAuth?: boolean;
    };

    if (!error.response) return Promise.reject(error);

    if (original?.url?.includes('/api/refresh')) {
      return Promise.reject(error);
    }

    if (
      error.response.status !== 401 ||
      original?.__isRetryRequest ||
      !original?.__hadAuth
    ) {
      return Promise.reject(error);
    }

    // if (!isRefreshing) {
    //   isRefreshing = true;
    //   axios
    //     .post('/api/refresh', null, {
    //       baseURL: api.defaults.baseURL,
    //       withCredentials: true,
    //     })
    //     .then(({ data }) => {
    //       const newToken = data?.token;
    //       if (!newToken) throw new Error('No access token from refresh');
    //       tokenStore.set(newToken);
    //       notifyAll(newToken);
    //     })
    //     .catch(refreshError => {
    //       console.error(refreshError);
    //       waiters = [];
    //       tokenStore.clear();
    //     })
    //     .finally(() => {
    //       isRefreshing = false;
    //     });
    // }
    //
    // return retryPromise;
    return Promise.reject(error);
  },
);

export default api;
