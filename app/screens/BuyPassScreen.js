import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

export default function BuyPassScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleBuy = async (type) => {
    setLoading(true);
    try {
      // 1. Zgloszenie do backendu zeby utworzyl zamowienie w PayU
      const response = await api.post('/payu/order', { type });
      const { redirectUri } = response.data;
      
      if (redirectUri) {
        // 2. Otwarcie przegladarki z platnoscia PayU
        await Linking.openURL(redirectUri);
      } else {
        Alert.alert(t('error'), 'Brak linku do platnosci');
      }
    } catch (error) {
      Alert.alert(t('paymentErrorTitle'), error.response?.data?.message || t('paymentError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('buyPassTitle')}</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.content}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.info}>{t('testModeNote')}</Text>

        <TouchableOpacity
          style={[styles.passCard, loading && styles.passCardDisabled]}
          onPress={() => handleBuy('daily')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.passTitle}>{t('passDaily')}</Text>
          <Text style={styles.passPrice}>{t('passDailyPrice')}</Text>
          <Text style={styles.passDesc}>{t('passDailyDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.passCard, styles.passCardHighlight, loading && styles.passCardDisabled]}
          onPress={() => handleBuy('monthly')}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.passTitle}>{t('passMonthly')}</Text>
          <Text style={styles.passPrice}>{t('passMonthlyPrice')}</Text>
          <Text style={styles.passDesc}>{t('passMonthlyDesc')}</Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator size="large" color="#2B6CB0" style={{ marginTop: 20 }} />
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
  backBtn: {
    width: 70,
    paddingVertical: 5,
  },
  backText: {
    fontSize: 15,
    color: '#2B6CB0',
    fontFamily: 'Helvetica', fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica', fontWeight: 'bold',
    color: '#2D3748',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 72,
    marginBottom: 20,
    marginTop: 10,
  },
  info: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  passCard: {
    width: '100%',
    padding: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  passCardHighlight: {
    borderColor: '#2B6CB0',
    backgroundColor: '#EBF8FF',
  },
  passCardDisabled: {
    opacity: 0.6,
  },
  passTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica', fontWeight: 'bold',
    marginBottom: 10,
    color: '#2D3748',
  },
  passPrice: {
    fontSize: 26,
    color: '#38A169',
    fontFamily: 'Helvetica', fontWeight: '900',
    marginBottom: 10,
  },
  passDesc: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
  },
});
