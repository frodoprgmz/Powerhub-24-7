import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t, toggleLanguage } = useLanguage();

  const handleRegister = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { email, password });
      Alert.alert(t('success'), response.data.message || t('success'));
      navigation.navigate('VerifyEmail', { email });
    } catch (error) {
      Alert.alert(t('regError'), error.response?.data?.message || t('somethingWentWrong'));
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
      <Text style={styles.title}>{t('createAccount')}</Text>
      
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder={t('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#A0AEC0"
        />
        <TextInput
          style={styles.input}
          placeholder={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#A0AEC0"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '...' : t('register')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 25 }}>
        <Text style={styles.linkText}>{t('hasAccount')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F9FC', alignItems: 'center', justifyContent: 'center' },
  langBtn: { position: 'absolute', top: 50, right: 20, padding: 8, backgroundColor: '#EDF2F7', borderRadius: 20 },
  langText: { fontSize: 14, color: '#2D3748', fontWeight: 'bold' },
  logo: { width: 280, height: 110, marginBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 25, color: '#2D3748' },
  card: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 3 },
  input: { width: '100%', height: 55, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 15, marginBottom: 15, backgroundColor: '#F7F9FC', fontSize: 16, color: '#2D3748' },
  button: { width: '100%', height: 55, backgroundColor: '#2D3748', justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginTop: 5 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#4A5568', fontSize: 15, fontWeight: 'bold' }
});
