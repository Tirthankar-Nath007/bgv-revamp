import axios from 'axios';
import { store } from '@/app/store';
import { logout } from '@/features/auth/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      // navigate is handled by the component/hook layer
      window.dispatchEvent(new CustomEvent('bgv:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
