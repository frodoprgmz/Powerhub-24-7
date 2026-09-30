import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

const LOGS_CACHE_KEY = 'offline_logs';

/**
 * Zapisuje zdarzenie zamka. Jeśli nie ma internetu, kolejkuje je w pamięci urządzenia.
 */
export const logBluetoothEvent = async (status, details) => {
  const logEntry = {
    status,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    // Próba wysłania od razu
    await api.post('/lock/log', logEntry);
  } catch (error) {
    // Jeśli brak neta, zapisz w kolejce offline
    try {
      const cached = await AsyncStorage.getItem(LOGS_CACHE_KEY);
      const queue = cached ? JSON.parse(cached) : [];
      queue.push(logEntry);
      await AsyncStorage.setItem(LOGS_CACHE_KEY, JSON.stringify(queue));
      if (__DEV__) console.log('Zapisano log offline:', logEntry);
    } catch (cacheError) {
      if (__DEV__) console.warn('Błąd kolejkowania logu offline', cacheError);
    }
  }
};

/**
 * Synchronizuje zaległe logi (wywoływane przy starcie apki lub odzyskaniu neta)
 */
export const syncOfflineLogs = async () => {
  try {
    const cached = await AsyncStorage.getItem(LOGS_CACHE_KEY);
    if (!cached) return;

    const queue = JSON.parse(cached);
    if (!Array.isArray(queue) || queue.length === 0) return;

    // Wysyłamy wszystkie zaległe logi
    const remainingQueue = [];
    for (const log of queue) {
      try {
        await api.post('/lock/log', log);
      } catch (err) {
        // Jeśli któryś znów się nie udał (np. wciąż brak neta), zostaw w kolejce
        remainingQueue.push(log);
      }
    }

    if (remainingQueue.length === 0) {
      await AsyncStorage.removeItem(LOGS_CACHE_KEY);
      if (__DEV__) console.log('Wszystkie logi offline zsynchronizowane');
    } else {
      await AsyncStorage.setItem(LOGS_CACHE_KEY, JSON.stringify(remainingQueue));
    }
  } catch (error) {
    if (__DEV__) console.warn('Błąd synchronizacji logów offline', error);
  }
};
