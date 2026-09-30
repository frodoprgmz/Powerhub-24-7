import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from './utils/navigationRef';

const API_URL = 'https://powerhubappbackend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 (expired/invalid token), but not on auth routes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      await AsyncStorage.clear();
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
