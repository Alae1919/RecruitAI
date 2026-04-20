import axios, { InternalAxiosRequestConfig, AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

interface TokenRefreshResponse {
  access: string;
  refresh?: string;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post<TokenRefreshResponse>(
          `${API_BASE_URL}/users/token/refresh/`,
          { refresh: refreshToken }
        );
        localStorage.setItem('accessToken', data.access);
        if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  fields: Record<string, string[]> | null;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields: Record<string, string[]> | null;

  constructor({ status, code, message, fields }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface ErrorResponseData {
  code?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await apiClient(config);
    return res.data as T;
  } catch (err) {
    const axiosErr = err as AxiosError<ErrorResponseData>;
    const r = axiosErr.response;
    throw new ApiError({
      status: r?.status ?? 0,
      code: r?.data?.code ?? 'UNKNOWN',
      message: r?.data?.detail ?? r?.data?.message ?? axiosErr.message ?? 'Unknown error',
      fields: r?.data?.errors ?? null,
    });
  }
}
