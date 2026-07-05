import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const ACCESS_KEY = 'fl_access';
const REFRESH_KEY = 'fl_refresh';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (error.response?.status === 401 && refresh && !original._retried) {
      original._retried = true;
      try {
        refreshing ??= axios
          .post('/api/auth/refresh/', { refresh })
          .then((r) => {
            setTokens(r.data.access, r.data.refresh);
            return r.data.access as string;
          })
          .finally(() => {
            refreshing = null;
          });
        const access = await refreshing;
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        clearTokens();
        window.dispatchEvent(new Event('fl-logout'));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
