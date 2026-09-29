import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
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
      await api.post('/auth/verify-email', { email, token });
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
      
      <Text style={styles.infoText}>{t('verifyEmailInfo')} {email}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('verificationCodePlaceholder')}
        value={token}
        onChangeText={setToken}
        autoCapitalize="characters"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : t('confirm')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} style={{ marginTop: 25 }} disabled={resending}>
        <Text style={[styles.linkText, { color: '#2B6CB0' }]}>{resending ? t('sending') : t('resendNewCode')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 15 }}>
        <Text style={styles.linkText}>{t('backToLogin')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 250, height: 100, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#000' },
  infoText: { textAlign: 'center', marginBottom: 20, color: '#666' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#f9f9f9' },
  button: { width: '100%', height: 50, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#666', fontWeight: 'bold' }
});
