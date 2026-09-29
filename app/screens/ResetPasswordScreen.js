import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleReset = async () => {
    if (!token || !newPassword) {
      Alert.alert(t('error'), t('fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, newPassword });
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

      <TextInput
        style={styles.input}
        placeholder={t('codePlaceholder')}
        value={token}
        onChangeText={setToken}
        autoCapitalize="characters"
      />
      
      <TextInput
        style={styles.input}
        placeholder={t('newPassword')}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : t('changePassword')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
        <Text style={styles.linkText}>{t('backToLogin')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 250, height: 100, marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#f9f9f9' },
  button: { width: '100%', height: 50, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkText: { color: '#666', marginTop: 15 }
});
