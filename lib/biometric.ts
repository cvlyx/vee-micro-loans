import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BIOMETRIC_USER_KEY = '@phoenix_biometric_user';
const BIOMETRIC_ID_KEY = '@phoenix_biometric_id';

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: LocalAuthentication.AuthenticationType | null;
  hasSavedCredentials: boolean;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.log('Biometric check error:', error);
    return false;
  }
}

/**
 * Get detailed biometric status
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  try {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const biometryType = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const savedUserId = await AsyncStorage.getItem(BIOMETRIC_USER_KEY);

    return {
      isAvailable: isAvailable && isEnrolled,
      biometryType: biometryType[0] || null,
      hasSavedCredentials: !!savedUserId,
    };
  } catch (error) {
    console.log('Get biometric status error:', error);
    return {
      isAvailable: false,
      biometryType: null,
      hasSavedCredentials: false,
    };
  }
}

/**
 * Get the biometry type name for display
 */
export function getBiometryTypeName(type: LocalAuthentication.AuthenticationType | null): string {
  switch (type) {
    case LocalAuthentication.AuthenticationType.FINGERPRINT:
      return 'Fingerprint';
    case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
      return 'Face ID';
    case LocalAuthentication.AuthenticationType.IRIS:
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate user with biometric
 */
export async function authenticateWithBiometric(): Promise<{ success: boolean; error?: string }> {
  try {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!isAvailable) {
      return { success: false, error: 'Biometric not available on this device' };
    }

    if (!isEnrolled) {
      return { success: false, error: 'No biometric credentials enrolled' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your account',
      fallbackLabel: 'Use password instead',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: 'Authentication failed' };
    }
  } catch (error) {
    console.log('Biometric authentication error:', error);
    return { success: false, error: 'Authentication error' };
  }
}

/**
 * Save biometric credentials for a user
 */
export async function saveBiometricPreference(userId: string, biometricId: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(BIOMETRIC_USER_KEY, userId);
    await AsyncStorage.setItem(BIOMETRIC_ID_KEY, biometricId);
    return true;
  } catch (error) {
    console.log('Save biometric preference error:', error);
    return false;
  }
}

/**
 * Get saved biometric user ID
 */
export async function getBiometricUserId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BIOMETRIC_USER_KEY);
  } catch (error) {
    console.log('Get biometric user ID error:', error);
    return null;
  }
}

/**
 * Get saved biometric ID
 */
export async function getBiometricId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BIOMETRIC_ID_KEY);
  } catch (error) {
    console.log('Get biometric ID error:', error);
    return null;
  }
}

/**
 * Clear saved biometric credentials
 */
export async function clearBiometricCredentials(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_USER_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_ID_KEY);
    return true;
  } catch (error) {
    console.log('Clear biometric credentials error:', error);
    return false;
  }
}

/**
 * Generate a unique biometric ID for the device
 */
export function generateBiometricId(userId: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `bio_${userId.substring(0, 8)}_${timestamp}_${randomPart}`;
}
