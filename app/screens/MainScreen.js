import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import api from '../api';
import { useLanguage } from '../contexts/LanguageContext';
import { unlockBluetooth } from '../utils/ttlockHelper';

export default function MainScreen({ navigation }) {
  const [passInfo, setPassInfo] = useState(null);
  const [lockStatus, setLockStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const { t, toggleLanguage } = useLanguage();

  useEffect(() => {
    if (isFocused) {
      fetchPassInfo();
      fetchLockStatus();
    }
  }, [isFocused]);

  const fetchPassInfo = async () => {
    try {
      const response = await api.get('/passes/current');
      setPassInfo(response.data);
    } catch (error) {
      console.log('Error fetching pass info', error);
    }
  };

  const fetchLockStatus = async () => {
    try {
      const res = await api.get('/lock/status');
      setLockStatus(res.data);
    } catch (e) {
      console.log('No lock status found', e);
    }
  };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      if (lockStatus && lockStatus.lockData) {
        await unlockBluetooth(lockStatus.lockData);
        Alert.alert(t('success'), t('openDoor'));
      } else {
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
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
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

        {passInfo ? (
          <View style={styles.passCard}>
            <View style={styles.statusRow}>
              <Text style={styles.passLabel}>{t('passStatus')}</Text>
              <Text
                style={[
                  styles.passStatus,
                  passInfo.hasActivePass ? styles.textSuccess : styles.textError,
                ]}
              >
                {passInfo.hasActivePass ? t('active') : t('inactive')}
              </Text>
            </View>

            {passInfo.hasActivePass && passInfo.activePassExpiry && (
              <Text style={styles.passExpiry}>
                {t('validUntil')} {new Date(passInfo.activePassExpiry).toLocaleString()}
              </Text>
            )}
          </View>
        ) : (
          <ActivityIndicator size="large" color="#2D3748" style={{ marginBottom: 30 }} />
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.unlockButton,
            (!passInfo?.hasActivePass || loading) && styles.disabledButton,
          ]}
          onPress={handleUnlock}
          disabled={!passInfo?.hasActivePass || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('openDoor')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buyButton]}
          onPress={() => navigation.navigate('BuyPass')}
        >
          <Text style={styles.buttonText}>{t('buyPass')}</Text>
        </TouchableOpacity>

        {!passInfo?.hasActivePass && (
          <Text style={styles.infoText}>{t('needPass')}</Text>
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
});
