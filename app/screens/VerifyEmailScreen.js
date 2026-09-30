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

export default function VerifyEmailScreen({ route, navigation }) {
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { t } = useLanguage();

  const handleVerify = async () => {
    if (!token) {
      Alert.alert(t('error'), t('enterCode'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, token: token.trim() });
      Alert.alert(t('success'), t('verifySuccess'));
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      Alert.alert(t('success'), t('resendSuccess'));
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('resendError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{t('verifyEmailTitle')}</Text>
      <Text style={styles.infoText}>
        {t('verifyEmailInfo')}{'\n'}
        <Text style={styles.emailHighlight}>{email}</Text>
      </Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={t('verificationCodePlaceholder')}
          value={token}
          onChangeText={setToken}
          autoCapitalize="characters"
          placeholderTextColor="#A0AEC0"
          returnKeyType="done"
          onSubmitEditing={handleVerify}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('confirm')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleResend}
        style={styles.linkWrapper}
        disabled={resending}
      >
        <Text style={[styles.linkText, { color: '#2B6CB0' }]}>
          {resending ? t('sending') : t('resendNewCode')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={styles.linkWrapper}
      >
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
  logo: { width: 220, height: 88, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 12, color: '#2D3748' },
  infoText: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#718096',
    fontSize: 14,
    lineHeight: 22,
  },
  emailHighlight: {
    color: '#2D3748',
    fontWeight: 'bold',
  },
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
    fontSize: 18,
    color: '#2D3748',
    textAlign: 'center',
    letterSpacing: 4,
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
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkWrapper: { marginTop: 18 },
  linkText: { color: '#4A5568', fontSize: 15, fontWeight: 'bold' },
});
