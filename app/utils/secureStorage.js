/**
 * Secure storage wrapper.
 *
 * Wraps expo-secure-store for sensitive data (token, role, lockData).
 * Falls back to AsyncStorage if SecureStore is unavailable (web/emulator).
 *
 * Sensitive keys stored in SecureStore: token, role, cache_lockStatus
 * Non-sensitive keys stay in AsyncStorage: lang, cache_passInfo
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = new Set(['token', 'role', 'cache_lockStatus']);

const secureStorage = {
  async getItem(key) {
    try {
      if (SECURE_KEYS.has(key)) {
        return await SecureStore.getItemAsync(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      // SecureStore may fail on unsupported platforms — fall back
      return await AsyncStorage.getItem(key);
    }
  },

  async setItem(key, value) {
    try {
      if (SECURE_KEYS.has(key)) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      await AsyncStorage.setItem(key, value);
    }
  },

  async removeItem(key) {
    try {
      if (SECURE_KEYS.has(key)) {
        await SecureStore.deleteItemAsync(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      await AsyncStorage.removeItem(key);
    }
  },

  /** Clear all sensitive keys + all AsyncStorage keys */
  async clear() {
    await Promise.allSettled([
      ...Array.from(SECURE_KEYS).map((k) => SecureStore.deleteItemAsync(k).catch(() => {})),
      AsyncStorage.clear(),
    ]);
  },
};

export default secureStorage;
