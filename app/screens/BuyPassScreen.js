import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../api';

export default function BuyPassScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const handleBuy = async (type) => {
    setLoading(true);
    try {
      const response = await api.post('/passes/buy', { type });
      Alert.alert(t('success'), t('paymentSuccess') + response.data.message);
      navigation.goBack();
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
          <Text style={styles.backText}>← Wróć</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kup Karnet</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.info}>Wybierz rodzaj karnetu. (Środowisko testowe - płatność zawsze kończy się sukcesem).</Text>

        <TouchableOpacity 
          style={styles.passCard} 
          onPress={() => handleBuy('daily')}
          disabled={loading}
        >
          <Text style={styles.passTitle}>Karnet 1-dniowy</Text>
          <Text style={styles.passPrice}>20 PLN</Text>
          <Text style={styles.passDesc}>Ważny 24 godziny od momentu zakupu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.passCard, styles.passCardHighlight]} 
          onPress={() => handleBuy('monthly')}
          disabled={loading}
        >
          <Text style={styles.passTitle}>Karnet 30-dniowy</Text>
          <Text style={styles.passPrice}>100 PLN</Text>
          <Text style={styles.passDesc}>Najlepsza opcja! Ważny przez równe 30 dni.</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#2B6CB0" style={{ marginTop: 30 }} />}
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 5,
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: '#2B6CB0',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  info: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  passCard: {
    width: '100%',
    padding: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 20,
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
  passTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2D3748',
  },
  passPrice: {
    fontSize: 24,
    color: '#38A169',
    fontWeight: '900',
    marginBottom: 10,
  },
  passDesc: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  }
});
