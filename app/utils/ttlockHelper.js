import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { Ttlock, LockControlType } from 'react-native-ttlock';
import BleManager from 'react-native-ble-manager';
import { logBluetoothEvent } from './logger';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  return true;
};

export const unlockBluetooth = async (lockData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const hasPerms = await requestPermissions();
      if (!hasPerms) {
        logBluetoothEvent('Błąd', 'Brak uprawnień Bluetooth/Lokalizacji (ERR_PERMS)');
        return reject(new Error('ERR_PERMS'));
      }

      if (Platform.OS === 'android') {
        try {
          await BleManager.enableBluetooth();
        } catch {
          logBluetoothEvent('Błąd', 'Bluetooth wyłączony — nie udało się otworzyć zamka (ERR_BT_OFF)');
          return reject(new Error('ERR_BT_OFF'));
        }
      }

      let isResolved = false;

      // Timeout po 6 sekundach
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try { Ttlock.stopScan(); } catch (e) {}
          logBluetoothEvent('Błąd', 'Timeout — zamek nie odpowiedział w ciągu 6 sekund (ERR_TIMEOUT)');
          reject(new Error('ERR_TIMEOUT'));
        }
      }, 6000);

      Ttlock.controlLock(
        LockControlType.Unlock,
        lockData,
        (lockTime, electricQuantity, uniqueId) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          if (__DEV__) console.log('TTLock success:', lockTime, 'battery:', electricQuantity);
          // Logowanie sukcesu do backendu (z obsługą offline)
          logBluetoothEvent('Sukces', 'Zamek otwarty przez Bluetooth (Aplikacja)');
          resolve(true);
        },
        (errorCode, errorDesc) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          if (__DEV__) console.warn('TTLock error:', errorCode, errorDesc);
          // Zaloguj błąd BT do backendu
          logBluetoothEvent('Błąd', `Błąd Bluetooth: kod ${errorCode} — ${errorDesc}`);
          reject(new Error('ERR_COMM'));
        }
      );
    } catch (e) {
      console.warn('unlockBluetooth unexpected error:', e);
      logBluetoothEvent('Błąd', `Nieoczekiwany błąd Bluetooth: ${e.message}`);
      reject(new Error('ERR_COMM'));
    }
  });
};


export const prepareBluetooth = async () => {
  try {
    const hasPerms = await requestPermissions();
    if (!hasPerms) return;
    if (Platform.OS === 'android') {
      try { await BleManager.enableBluetooth(); } catch (e) {}
    }
    // Krotkie skanowanie w tle, aby wybudzic radio BT i cache OS
    Ttlock.startScan(() => {});
    setTimeout(() => {
      try { Ttlock.stopScan(); } catch (e) {}
    }, 2000);
  } catch (e) {}
};
