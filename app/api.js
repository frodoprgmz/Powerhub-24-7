import axios from 'axios';
import secureStorage from './utils/secureStorage';
import { navigationRef } from './utils/navigationRef';

const API_URL = 'https://powerhubappbackend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10s timeout — Render free tier can be slow on cold start
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token), but not on auth routes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Use startsWith on the path to avoid bypass via query params like ?redirect=/auth/login
    const isAuthRoute = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      await secureStorage.clear();
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
