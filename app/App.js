import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainScreen from './screens/MainScreen';
import AdminScreen from './screens/AdminScreen';
import BuyPassScreen from './screens/BuyPassScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import VerifyEmailScreen from './screens/VerifyEmailScreen';

import { LanguageProvider } from './contexts/LanguageContext';
import { navigationRef } from './utils/navigationRef';
import secureStorage from './utils/secureStorage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      const token = await secureStorage.getItem('token');
      const role = await secureStorage.getItem('role');
      if (token) {
        if (role === 'admin') setInitialRoute('Admin');
        else setInitialRoute('Main');
      } else {
        setInitialRoute('Login');
      }
    };
    checkToken();
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <Image
          source={require('./assets/logo.png')}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#2D3748" style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: '#F7F9FC' }}>
      <LanguageProvider>
        <StatusBar style="dark" />
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F9FC' } }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="BuyPass" component={BuyPassScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    width: 220,
    height: 88,
  },
  loadingSpinner: {
    marginTop: 40,
  },
});
