import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import { unlockBluetooth } from '../utils/ttlockHelper';
import secureStorage from '../utils/secureStorage';

// AsyncStorage keys for offline cache
const CACHE_PASS = 'cache_passInfo';
const CACHE_LOCK = 'cache_lockStatus'; // stored in SecureStore (contains lockData)

// Minimum time (ms) between automatic re-fetches when screen is focused
const FETCH_TTL = 15000;

/**
 * Checks whether a pass is truly active RIGHT NOW based on its expiry date.
 * Used for both online (server data) and offline (cached data).
 * When offline the server can't revoke anything — but we enforce
 * the expiry timestamp that was written into the cache.
 */
const isPassCurrentlyActive = (passData) => {
  if (!passData?.hasActivePass) return false;
  if (!passData?.activePassExpiry) return false;
  return new Date(passData.activePassExpiry) > new Date();
};

export default function MainScreen({ navigation }) {
  const [passInfo, setPassInfo] = useState(null);
  const [lockStatus, setLockStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  const lastFetchRef = useRef(0);
  const isFocused = useIsFocused();
  const { t, toggleLanguage } = useLanguage();

  useEffect(() => {
    if (isFocused) {
      const now = Date.now();
      // Only auto-fetch if TTL has passed, avoid hammering on quick back-navigations
      if (now - lastFetchRef.current > FETCH_TTL) {
        loadData();
      }
    }
  }, [isFocused]);

  const loadData = async () => {
    setFetching(true);
    setFetchError(false);
    lastFetchRef.current = Date.now();
    await Promise.all([fetchPassInfo(), fetchLockStatus()]);
    setFetching(false);
  };

  const fetchPassInfo = async () => {
    try {
      const response = await api.get('/passes/current');
      setPassInfo(response.data);
      setIsOffline(false);
      // Cache for offline use — in SecureStore to prevent tampering
      await secureStorage.setItem(CACHE_PASS, JSON.stringify(response.data));
    } catch (error) {
      // Try loading from cache
      try {
        const cached = await secureStorage.getItem(CACHE_PASS);
        if (cached) {
          setPassInfo(JSON.parse(cached));
          setIsOffline(true);
        } else {
          setFetchError(true);
          setPassInfo({ hasActivePass: false });
        }
      } catch {
        setFetchError(true);
        setPassInfo({ hasActivePass: false });
      }
    }
  };

  const fetchLockStatus = async () => {
    try {
      const res = await api.get('/lock/status');
      setLockStatus(res.data);
      setIsOffline(false);
      // Cache lockData securely (contains Bluetooth key)
      await secureStorage.setItem(CACHE_LOCK, JSON.stringify(res.data));
    } catch {
      try {
        const cached = await secureStorage.getItem(CACHE_LOCK);
        if (cached) {
          setLockStatus(JSON.parse(cached));
          setIsOffline(true);
        }
      } catch {
        // No cache, BT-only unlock won't work — fallback will try API
      }
    }
  };

  // Guard against double-tap: loading state disables the button,
  // but this ref prevents any race between the tap and the state update.
  const isUnlockingRef = useRef(false);

  const handleUnlock = async () => {
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    setLoading(true);
    try {
      if (lockStatus?.lockData) {
        // Bluetooth path — works offline!
        await unlockBluetooth(lockStatus.lockData);
        Alert.alert(t('success'), t('openDoor'));
      } else {
        // Fallback to API (requires internet)
        const response = await api.post('/lock/unlock');
        Alert.alert(t('success'), response.data.message || t('openDoor'));
      }
    } catch (error) {
      const errMsg = error.message;
      if (errMsg && (errMsg.startsWith('ERR_') || errMsg.includes('ERR_'))) {
        Alert.alert(t('error'), t(errMsg));
      } else {
        Alert.alert(t('error'), error.response?.data?.message || t('somethingWentWrong'));
      }
    } finally {
      setLoading(false);
      isUnlockingRef.current = false;
    }
  };

  const logout = async () => {
    await secureStorage.clear();
    navigation.replace('Login');
  };

  // Compute actual active state based on server data OR cached data + local expiry check
  const isActiveNow = isPassCurrentlyActive(passInfo);
  const isExpiredOffline = isOffline && passInfo?.hasActivePass && !isActiveNow;
  const canUnlock = isActiveNow && !loading;

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>📡 {t('offlineBanner')}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/logo.png')} style={styles.logoSmall} resizeMode="contain" />
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
            <Text style={styles.langText}>{t('langToggle')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('yourPanel')}</Text>

        {/* Pass Info Card */}
        {fetching && !passInfo ? (
          <View style={styles.passCard}>
            <ActivityIndicator size="large" color="#2D3748" />
            <Text style={styles.loadingText}>{t('loadingPass')}</Text>
          </View>
        ) : fetchError && !passInfo?.hasActivePass ? (
          <View style={styles.passCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{t('fetchError')}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryBtnText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.passCard}>
            <View style={styles.statusRow}>
              <Text style={styles.passLabel}>{t('passStatus')}</Text>
              <Text
                style={[
                  styles.passStatus,
                  isActiveNow ? styles.textSuccess : styles.textError,
                ]}
              >
                {isExpiredOffline
                  ? t('expired')
                  : isActiveNow
                    ? t('active')
                    : t('inactive')}
              </Text>
            </View>

            {passInfo?.activePassExpiry && (
              <Text style={styles.passExpiry}>
                {isActiveNow ? t('validUntil') : t('expiredOn')}{' '}
                {new Date(passInfo.activePassExpiry).toLocaleString()}
              </Text>
            )}

            {isOffline && !isExpiredOffline && (
              <Text style={styles.cachedNote}>🕐 {t('cachedData')}</Text>
            )}

            {isExpiredOffline && (
              <Text style={styles.expiredOfflineNote}>
                ⚠️ {t('passExpiredOffline')}
              </Text>
            )}
          </View>
        )}

        {/* Unlock Button */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.unlockButton,
            !canUnlock && styles.disabledButton,
          ]}
          onPress={handleUnlock}
          disabled={!canUnlock}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('openDoor')}</Text>
          )}
        </TouchableOpacity>

        {/* Buy Pass Button */}
        <TouchableOpacity
          style={[styles.button, styles.buyButton]}
          onPress={() => navigation.navigate('BuyPass')}
          disabled={isOffline}
        >
          <Text style={[styles.buttonText, isOffline && { opacity: 0.5 }]}>{t('buyPass')}</Text>
        </TouchableOpacity>

        {!isActiveNow && !fetching && !isExpiredOffline && (
          <Text style={styles.infoText}>{t('needPass')}</Text>
        )}

        {isExpiredOffline && !fetching && (
          <Text style={styles.infoText}>{t('passExpiredOfflineHint')}</Text>
        )}

        {isOffline && isActiveNow && (
          <Text style={styles.infoText}>{t('offlineUnlockInfo')}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  offlineBanner: {
    backgroundColor: '#D69E2E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    width: 140,
    height: 45,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
  },
  langText: {
    color: '#4A5568',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#E53E3E',
    fontWeight: 'bold',
    fontSize: 15,
  },
  content: {
    padding: 24,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2D3748',
  },
  passCard: {
    width: '100%',
    padding: 25,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  passLabel: {
    fontSize: 16,
    color: '#4A5568',
    marginRight: 10,
  },
  passStatus: {
    fontSize: 18,
    fontWeight: '900',
  },
  passExpiry: {
    fontSize: 14,
    color: '#718096',
    marginTop: 5,
  },
  cachedNote: {
    fontSize: 12,
    color: '#D69E2E',
    marginTop: 8,
    fontWeight: '600',
  },
  loadingText: {
    color: '#A0AEC0',
    marginTop: 12,
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    color: '#718096',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#2D3748',
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buyButton: {
    backgroundColor: '#2B6CB0',
  },
  unlockButton: {
    backgroundColor: '#38A169',
  },
  disabledButton: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textSuccess: {
    color: '#38A169',
  },
  textError: {
    color: '#E53E3E',
  },
  infoText: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  expiredOfflineNote: {
    color: '#E53E3E',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
});
