import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

export const API_BASE_URL = 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const flushQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
};

const redirectToLogin = (reason: 'expired' | 'unauthorized' = 'expired') => {
  tokenStorage.clear();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?reason=${reason}`;
  }
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original || original._retry) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (original.url?.includes('/auth/refresh-token')) {
      redirectToLogin('expired');
      return Promise.reject(error);
    }

    if (original.url?.includes('/auth/login') || original.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      redirectToLogin('unauthorized');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        {},
        { headers: { 'x-refresh-token': refreshToken } },
      );
      const newAccessToken = res.data?.data?.accessToken;
      if (!newAccessToken) {
        throw new Error('No accessToken in refresh response');
      }
      tokenStorage.setAccessToken(newAccessToken);
      flushQueue(null, newAccessToken);

      if (original.headers) original.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      redirectToLogin('expired');
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
