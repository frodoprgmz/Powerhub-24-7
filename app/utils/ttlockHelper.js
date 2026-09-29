import { NativeModules, Platform, PermissionsAndroid, Alert } from 'react-native';
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
      return granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;
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
        } catch (error) {
          return reject(new Error('ERR_BT_OFF'));
        }
      }
      
      let isResolved = false;

      // Timeout po 4.5 sekundach
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          // Opcjonalnie zatrzymaj skanowanie w tle, jeśli SDK utknęło
          try { Ttlock.stopScan(); } catch(e) {}
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
          console.log('TTLock success:', lockTime);
          api.post('/lock/unlock').catch(e => console.log(e));
          resolve(true);
        },
        (errorCode, errorDesc) => {
          if (isResolved) return;
          isResolved = true;
          clearTimeout(timeoutId);
          console.log('TTLock error:', errorCode, errorDesc);
          reject(new Error('ERR_COMM'));
        }
      );
    } catch (e) {
      reject(new Error('ERR_COMM'));
    }
  });
};
