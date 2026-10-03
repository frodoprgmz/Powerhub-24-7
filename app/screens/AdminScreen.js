import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguage } from '../contexts/LanguageContext';
import { unlockBluetooth } from '../utils/ttlockHelper';
import { logBluetoothEvent } from '../utils/logger';
import secureStorage from '../utils/secureStorage';
import api from '../api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const UserItem = ({ u, t, doUpdatePass, cancelPass }) => {
  const [localStart, setLocalStart] = useState(new Date());
  const [localEnd, setLocalEnd] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const now = new Date();
  const isActive =
    u.activePassExpiry &&
    new Date(u.activePassExpiry) > now &&
    (!u.activePassStart || new Date(u.activePassStart) <= now);

  return (
    <View style={styles.userItem}>
      <View style={styles.userInfoRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.listTitle}>{u.email}</Text>
          <Text style={styles.listSubtitle}>
            {isActive
              ? `${t('validUntil')} ${new Date(u.activePassExpiry).toLocaleDateString()}`
              : t('inactive')}
          </Text>
        </View>
        <Text style={[styles.listBadge, isActive ? styles.badgeSuccess : styles.badgeError]}>
          {isActive ? t('active') : t('inactive')}
        </Text>
      </View>

      <View style={[styles.dateRow, { marginVertical: 10 }]}>
        <TouchableOpacity onPress={() => setShowStart(true)} style={styles.dateBtn}>
          <Text style={styles.dateLabel}>{t('startDate')}:</Text>
          <Text style={styles.dateValue}>{localStart.toLocaleDateString()}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEnd(true)} style={styles.dateBtn}>
          <Text style={styles.dateLabel}>{t('endDate')}:</Text>
          <Text style={styles.dateValue}>{localEnd.toLocaleDateString()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userActionsRow}>
        <TouchableOpacity
          style={[styles.userBtn, { backgroundColor: '#38A169' }]}
          onPress={() => doUpdatePass(u._id, localStart, localEnd)}
        >
          <Text style={styles.userBtnText}>{t('grantFromCalendar')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.userBtn, { backgroundColor: '#E53E3E' }]}
          onPress={() => cancelPass(u._id)}
        >
          <Text style={styles.userBtnText}>{t('cancelPass')}</Text>
        </TouchableOpacity>
      </View>

      {showStart && (
        <DateTimePicker
          value={localStart}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStart(false);
            if (date) setLocalStart(date);
          }}
        />
      )}
      {showEnd && (
        <DateTimePicker
          value={localEnd}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEnd(false);
            if (date) setLocalEnd(date);
          }}
        />
      )}
    </View>
  );
};

export default function AdminScreen({ navigation }) {
  const { t, toggleLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('logs');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [lockStatus, setLockStatus] = useState(null);

  const [ekeyEmail, setEkeyEmail] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [isAdminVerified, setIsAdminVerified] = useState(false);

  useEffect(() => {
    // Verify role on server before rendering admin panel
    const verifyRole = async () => {
      try {
        await api.get('/users'); // Quick check if we have admin rights
        setIsAdminVerified(true);
        fetchData();
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          Alert.alert(t('error'), 'Unauthorized access');
          logout();
        }
      }
    };
    verifyRole();
  }, []);

  useEffect(() => {
    if (isAdminVerified) fetchData();
  }, [activeTab, isAdminVerified]);

  const fetchData = async () => {
    if (!isAdminVerified) return;
    setLoading(true);
    try {
      if (activeTab === 'logs') {
        const [logsRes, statusRes] = await Promise.all([
          api.get('/lock/logs'),
          api.get('/lock/status'),
        ]);
        setLogs(logsRes.data);
        setLockStatus(statusRes.data);
      } else if (activeTab === 'users') {
        const usersRes = await api.get('/users');
        setUsers(usersRes.data);
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Błąd połączenia';
      console.error('[AdminScreen] fetchData error:', msg, error.response?.status);
      Alert.alert('Błąd ładowania', `Nie udało się pobrać danych:\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await secureStorage.clear();
    navigation.replace('Login');
  };

  const isUnlockingRef = useRef(false);

  const handleUnlock = async () => {
    if (!lockStatus || !lockStatus.lockData) {
      // Log the attempt even when there's no lock data
      logBluetoothEvent('Błąd', 'Brak danych zamka — nie można otworzyć (admin)');
      return Alert.alert(t('error'), t('lockDataError'));
    }
    if (isUnlockingRef.current) return;
    isUnlockingRef.current = true;
    setLoading(true);
    try {
      await unlockBluetooth(lockStatus.lockData);
      Alert.alert(t('success'), t('openDoor'));
      if (activeTab === 'logs') fetchData();
    } catch (error) {
      const errMsg = error.message;
      // BT errors are already logged inside ttlockHelper — no double-log needed
      Alert.alert(
        t('error'),
        (errMsg && t(errMsg) !== errMsg) ? t(errMsg) : t('somethingWentWrong')
      );
      if (activeTab === 'logs') fetchData(); // Refresh logs to show the error entry
    } finally {
      setLoading(false);
      isUnlockingRef.current = false;
    }
  };

  const isEkeySubmittingRef = useRef(false);
  const isCodeSubmittingRef = useRef(false);

  const validateDates = () => {
    if (endDate <= startDate) {
      Alert.alert(t('error'), t('dateRangeInvalid'));
      return false;
    }
    return true;
  };

  const handleSendEKey = async () => {
    if (!ekeyEmail.trim()) return Alert.alert(t('error'), t('searchEmail'));
    if (!EMAIL_REGEX.test(ekeyEmail.trim())) return Alert.alert(t('error'), t('invalidEmail'));
    if (!validateDates()) return;
    if (isEkeySubmittingRef.current) return;
    isEkeySubmittingRef.current = true;
    try {
      const res = await api.post('/lock/sendEKey', {
        receiverUsername: ekeyEmail.trim(),
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      });
      Alert.alert(t('success'), res.data.message || t('success'));
      setEkeyEmail('');
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('somethingWentWrong'));
    } finally {
      isEkeySubmittingRef.current = false;
    }
  };

  const handleGeneratePasscode = async () => {
    if (!validateDates()) return;
    if (isCodeSubmittingRef.current) return;
    isCodeSubmittingRef.current = true;
    try {
      const res = await api.post('/lock/getPasscode', {
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      });
      Alert.alert(t('success'), t('passcodeResult') + '\n\n' + res.data.passcode);
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('somethingWentWrong'));
    } finally {
      isCodeSubmittingRef.current = false;
    }
  };

  
  const handleCancelUserPass = async (userId) => {
    Alert.alert(t('confirmCancelTitle'), t('confirmCancelMsg'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('yes'),
        style: 'destructive',
        onPress: () => doUpdatePass(userId, null, null, true),
      },
    ]);
  };

  const doUpdatePass = async (userId, customStart, customEnd, cancel = false) => {

    try {
      let payload = { startDate: null, expiryDate: null };
      if (!cancel) {
        payload.startDate = customStart.getTime();
        payload.expiryDate = customEnd.getTime();
      }
      await api.post(`/users/${userId}/updatePass`, payload);
      Alert.alert(t('success'), t('passUpdated'));
      fetchData();
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('updateError'));
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const DateRangeSelector = () => (
    <View style={styles.dateRow}>
      <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
        <Text style={styles.dateLabel}>{t('startDate')}:</Text>
        <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
        <Text style={styles.dateLabel}>{t('endDate')}:</Text>
        <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAdminVerified) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D3748" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
            <Text style={styles.langText}>{t('langToggle')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {['logs', 'users', 'ekeys', 'codes'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => { setSearchQuery(''); setActiveTab(tab); }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {t(tab === 'users' ? 'clients' : tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('unlockTest')}</Text>
              <Text style={styles.lockInfo}>
                🔋 {lockStatus?.electricQuantity ?? '--'}%
              </Text>
              <TouchableOpacity
                style={[styles.button, styles.unlockButton]}
                onPress={handleUnlock}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t('unlockTest')}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{t('logs')}</Text>
                <TouchableOpacity onPress={fetchData}>
                  <Text style={styles.refreshText}>{t('refresh')}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchEmail')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#A0AEC0"
              />
              {loading ? (
                <ActivityIndicator size="large" color="#2D3748" style={{ marginVertical: 20 }} />
              ) : filteredLogs.length === 0 ? (
                <Text style={styles.emptyText}>{t('noLogs')}</Text>
              ) : (
                filteredLogs.map((log) => (
                  <View key={log._id} style={styles.listItem}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.listTitle}>{log.userEmail}</Text>
                      <Text style={styles.listSubtitle}>
                        {new Date(log.timestamp).toLocaleString('pl-PL')} · {log.role}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.listBadge,
                        log.status === 'Sukces' ? styles.badgeSuccess : styles.badgeError,
                      ]}
                    >
                      {log.status}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{t('clients')}</Text>
              <TouchableOpacity onPress={fetchData}>
                <Text style={styles.refreshText}>{t('refresh')}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchClient')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#A0AEC0"
            />
            {loading ? (
              <ActivityIndicator size="large" color="#2D3748" style={{ marginVertical: 20 }} />
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.emptyText}>{t('noClients')}</Text>
            ) : (
              filteredUsers.map((u) => (
                <UserItem 
                  key={u._id} 
                  u={u} 
                  t={t} 
                  doUpdatePass={(id, start, end) => doUpdatePass(id, start, end, false)} 
                  cancelPass={handleCancelUserPass} 
                />
              ))
            )}
          </View>
        )}

        {/* EKEYS TAB */}
        {activeTab === 'ekeys' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('sendEkey')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              value={ekeyEmail}
              onChangeText={setEkeyEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#A0AEC0"
            />
            <DateRangeSelector />
            <TouchableOpacity
              style={[styles.button, styles.actionButton]}
              onPress={handleSendEKey}
            >
              <Text style={styles.buttonText}>{t('sendEkey')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CODES TAB */}
        {activeTab === 'codes' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('generateCode')}</Text>
            <DateRangeSelector />
            <TouchableOpacity
              style={[styles.button, styles.actionButton, { backgroundColor: '#D69E2E' }]}
              onPress={handleGeneratePasscode}
            >
              <Text style={styles.buttonText}>{t('generateCode')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  logoSmall: { width: 200, height: 65 },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
  },
  langText: { fontSize: 12, fontWeight: 'bold', color: '#4A5568' },
  logoutBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  logoutText: { color: '#E53E3E', fontFamily: 'Helvetica', fontWeight: 'bold', fontSize: 15 },
  tabsWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tabsContainer: { paddingHorizontal: 10, paddingVertical: 10, gap: 8 },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
  },
  tabBtnActive: { backgroundColor: '#2B6CB0' },
  tabText: { fontSize: 14, color: '#4A5568', fontFamily: 'Helvetica', fontWeight: 'bold' },
  tabTextActive: { color: '#fff' },
  content: { padding: 15, paddingBottom: 50 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 12 },
  lockInfo: { fontSize: 16, color: '#4A5568', marginBottom: 15, textAlign: 'center', fontWeight: '500' },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#F7F9FC',
    fontSize: 16,
    color: '#2D3748',
  },
  searchInput: {
    width: '100%',
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#F7F9FC',
    fontSize: 14,
    color: '#2D3748',
  },
  button: { width: '100%', height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  unlockButton: { backgroundColor: '#38A169' },
  actionButton: { backgroundColor: '#2B6CB0' },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Helvetica', fontWeight: 'bold' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#2B6CB0', fontFamily: 'Helvetica', fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: '#A0AEC0', textAlign: 'center', marginVertical: 15 },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#EDF2F7',
  },
  listTitle: { fontSize: 14, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#2D3748' },
  listSubtitle: { fontSize: 12, color: '#718096', marginTop: 3 },
  listBadge: {
    fontSize: 11,
    fontFamily: 'Helvetica', fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  badgeSuccess: { color: '#22543D', backgroundColor: '#C6F6D5' },
  badgeError: { color: '#742A2A', backgroundColor: '#FED7D7' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
  dateBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F7F9FC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  dateLabel: { fontSize: 11, color: '#718096', marginBottom: 4 },
  dateValue: { fontSize: 15, fontFamily: 'Helvetica', fontWeight: 'bold', color: '#2D3748' },
  userItem: { paddingVertical: 14, borderBottomWidth: 1, borderColor: '#EDF2F7' },
  userInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  userActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  userBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  userBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Helvetica', fontWeight: 'bold' },
});
