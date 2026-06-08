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

let refreshing: Promise<string | null> | null = null;

export async function refreshToken(): Promise<string | null> {
  try {
    const { data } = await axios.post('/cham/refresh', null, {
      baseURL: api.defaults.baseURL,
      withCredentials: true,
    });
    const newToken = data?.token ?? null;

    tokenStore.set(newToken);
    return newToken;
  } catch (error) {
    console.error(error);
    tokenStore.clear();
    return null;
  } finally {
    refreshing = null;
  }
}

api.interceptors.request.use(async (config: AuthAxiosRequestConfig) => {
  if (config.url?.includes('/cham/refresh')) return config;

  let token = tokenStore.get();
  if (!token) {
    if (!refreshing) refreshing = refreshToken();
    token = await refreshing;
  }

  config.__hadAuth = !!token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

let isRefreshing = false;
let waiters: Array<(token: string) => void> = [];

const addWaiter = (callback: (token: string) => void) => {
  waiters.push(callback);
};

const notifyAll = (token: string) => {
  waiters.forEach(callback => callback(token));
  waiters = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & {
      __isRetryRequest?: boolean;
      __hadAuth?: boolean;
    };

    if (!error.response) return Promise.reject(error);

    if (original?.url?.includes('/cham/refresh')) {
      return Promise.reject(error);
    }

    if (
      error.response.status !== 401 ||
      original?.__isRetryRequest ||
      !original?.__hadAuth
    ) {
      return Promise.reject(error);
    }

    const retryPromise = new Promise((resolve, reject) => {
      addWaiter((token: string) => {
        try {
          original.__isRetryRequest = true;
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        } catch (retryError) {
          reject(retryError);
        }
      });
    });

    if (!isRefreshing) {
      isRefreshing = true;
      axios
        .post('/cham/refresh', null, {
          baseURL: api.defaults.baseURL,
          withCredentials: true,
        })
        .then(({ data }) => {
          const newToken = data?.token;
          if (!newToken) throw new Error('No access token from refresh');
          tokenStore.set(newToken);
          notifyAll(newToken);
        })
        .catch(refreshError => {
          console.error(refreshError);
          waiters = [];
          tokenStore.clear();
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    return retryPromise;
  },
);

export default api;
