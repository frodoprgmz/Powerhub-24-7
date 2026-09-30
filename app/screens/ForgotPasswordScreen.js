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

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert(t('error'), t('enterEmail'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      Alert.alert(t('success'), t('resetLinkSent'));
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (error) {
      Alert.alert(t('error'), error.response?.data?.message || t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{t('forgotPasswordTitle')}</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#A0AEC0"
          returnKeyType="done"
          onSubmitEditing={handleSendCode}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('sendResetCode')}</Text>
          )}
        </TouchableOpacity>
      </View>

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
  linkWrapper: { marginTop: 20 },
  linkText: { color: '#4A5568', fontSize: 15, fontWeight: 'bold' },
});
