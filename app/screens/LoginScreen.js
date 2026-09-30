import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t, toggleLanguage } = useLanguage();

  // Import secureStorage lazily to avoid circular dep issue
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert(t('error'), t('invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const secureStorage = (await import('../utils/secureStorage')).default;
      const response = await api.post('/auth/login', { email: email.trim(), password });
      const { token, role } = response.data;
      await secureStorage.setItem('token', token);
      await secureStorage.setItem('role', role);

      if (role === 'admin') {
        navigation.replace('Admin');
      } else {
        navigation.replace('Main');
      }
    } catch (error) {
      if (error.response?.data?.verificationRequired) {
        navigation.navigate('VerifyEmail', { email: email.trim() });
      } else {
        Alert.alert(t('loginError'), error.response?.data?.message || t('somethingWentWrong'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
        <Text style={styles.langText}>{t('langToggle')}</Text>
      </TouchableOpacity>

      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{t('welcome')}</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#A0AEC0"
          returnKeyType="next"
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#A0AEC0"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
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
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('login')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkWrapper}>
        <Text style={styles.linkText}>{t('forgotPassword')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkWrapper}>
        <Text style={styles.linkText}>{t('noAccount')}</Text>
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
  langBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
  },
  langText: { fontSize: 14, color: '#2D3748', fontFamily: 'Helvetica', fontWeight: 'bold' },
  logo: { width: 280, height: 110, marginBottom: 30 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 25, color: '#2D3748' },
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
  eyeBtn: {
    paddingLeft: 10,
  },
  eyeIcon: {
    fontSize: 18,
  },
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
  buttonText: { color: '#fff', fontSize: 18, fontFamily: 'Helvetica', fontWeight: 'bold' },
  linkWrapper: { marginTop: 18 },
  linkText: { color: '#4A5568', fontSize: 15, fontFamily: 'Helvetica', fontWeight: 'bold' },
});
