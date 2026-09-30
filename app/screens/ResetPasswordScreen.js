import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleReset = async () => {
    if (!token || !newPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('error'), t('passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token: token.trim(), newPassword });
      Alert.alert(t('success'), t('resetSuccess'));
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{t('resetPasswordTitle')}</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={t('codePlaceholder')}
          value={token}
          onChangeText={setToken}
          autoCapitalize="characters"
          placeholderTextColor="#A0AEC0"
          returnKeyType="next"
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('newPassword')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#A0AEC0"
            returnKeyType="done"
            onSubmitEditing={handleReset}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('changePassword')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkWrapper}>
        <Text style={styles.linkText}>{t('backToLogin')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 260, height: 104, marginBottom: 30 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 25, color: '#2D3748' },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#F7F9FC',
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    letterSpacing: 3,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F7F9FC',
    marginBottom: 15,
    height: 55,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    height: '100%',
  },
  eyeBtn: { paddingLeft: 10 },
  eyeIcon: { fontSize: 18 },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 5,
  },
  buttonDisabled: { backgroundColor: '#A0AEC0' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkWrapper: { marginTop: 20 },
  linkText: { color: '#4A5568', fontSize: 15, fontWeight: 'bold' },
});
