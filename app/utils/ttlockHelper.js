import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { Ttlock, LockControlType } from 'react-native-ttlock';
import BleManager from 'react-native-ble-manager';
import api from '../api';

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
        return reject(new Error('ERR_PERMS'));
      }

      if (Platform.OS === 'android') {
        try {
          await BleManager.enableBluetooth();
        } catch {
          return reject(new Error('ERR_BT_OFF'));
        }
      }

      let isResolved = false;

      // Timeout po 4.5 sekundach
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try { Ttlock.stopScan(); } catch (e) {}
          reject(new Error('ERR_TIMEOUT'));
        }
      }, 4500);

      Ttlock.controlLock(
        LockControlType.Unlock,
        lockData,
        (lockTime, electricQuantity, uniqueId) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          if (__DEV__) console.log('TTLock success:', lockTime, 'battery:', electricQuantity);
          // Log the unlock to the backend (fire-and-forget, errors are logged)
          api.post('/lock/unlock').catch((e) => {
            if (__DEV__) console.warn('Backend log failed:', e?.message);
          });
          resolve(true);
        },
        (errorCode, errorDesc) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          if (__DEV__) console.warn('TTLock error:', errorCode, errorDesc);
          reject(new Error('ERR_COMM'));
        }
      );
    } catch (e) {
      console.warn('unlockBluetooth unexpected error:', e);
      reject(new Error('ERR_COMM'));
    }
  });
};
