import axios from 'axios';
import { showToast } from 'vant';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// —— 请求拦截：附加 token ——
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// —— 是否正在刷新 token ——
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function addRefreshQueue() {
  return new Promise<string>((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });
}

function flushRefreshQueue(token: string | null, error: unknown) {
  refreshQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });
  refreshQueue = [];
}

// 无需 token 刷新的公开接口（它们的 401 表示"认证失败"而非"token 过期"）
const PUBLIC_AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh'];

// —— 响应拦截：统一错误处理 + 静默刷新 ——
request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // 网络错误
    if (!response) {
      showToast('网络异常，请检查网络连接');
      return Promise.reject(error);
    }

    const isPublicAuth = PUBLIC_AUTH_URLS.some((url) => config.url?.includes(url));

    // 401 处理：公开接口 → 直接抛错让调用方处理；受保护接口 → 尝试刷新 token
    if (response.status === 401 && !isPublicAuth) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const storedRefreshToken = localStorage.getItem('refreshToken');
          if (!storedRefreshToken) throw new Error('未登录');

          const res = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}/auth/refresh`,
            { refreshToken: storedRefreshToken },
          );

          const { accessToken, refreshToken: newRefreshToken } = res.data.data.tokens;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          isRefreshing = false;
          flushRefreshQueue(accessToken, null);

          config.headers.Authorization = `Bearer ${accessToken}`;
          return request(config);
        } catch {
          isRefreshing = false;
          flushRefreshQueue(null, new Error('登录已过期'));
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          showToast('登录已过期，请重新登录');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        try {
          const token = await addRefreshQueue();
          config.headers.Authorization = `Bearer ${token}`;
          return request(config);
        } catch {
          return Promise.reject(error);
        }
      }
    }

    // 公开接口的错误 → 只透传，由调用方自己展示 toast
    if (isPublicAuth) {
      return Promise.reject(error);
    }

    // 其他错误 → Toast 提示
    const message = response?.data?.message ?? '请求失败，请重试';
    if (response?.status !== 404) showToast(message);
    return Promise.reject(error);
  },
);

// —— 类型安全的请求封装 ——
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await request.get(url, { params });
  return res.data.data as T;
}

export async function post<T>(url: string, data?: unknown): Promise<T> {
  const res = await request.post(url, data);
  return res.data.data as T;
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await request.patch(url, data);
  return res.data.data as T;
}

export async function del<T>(url: string): Promise<T> {
  const res = await request.delete(url);
  return res.data.data as T;
}

export default request;
