import {
  isSensorAvailable,
  simplePrompt,
  type BiometricSensorInfo,
} from '@sbaiahmed1/react-native-biometrics';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Biometry types as returned by @sbaiahmed1/react-native-biometrics.
 * 'Biometrics' is the Android generic type (fingerprint / face).
 */
export type BiometryType =
  | 'TouchID'
  | 'FaceID'
  | 'Biometrics'
  | null;

// ─── Biometric Availability ──────────────────────────────────────────────────

/**
 * Returns the biometry type available on this device, or null if none.
 */
export async function getSupportedBiometryType(): Promise<BiometryType> {
  try {
    const info: BiometricSensorInfo = await isSensorAvailable();
    if (
      info.available &&
      info.biometryType &&
      info.biometryType !== 'None' &&
      info.biometryType !== 'Unknown'
    ) {
      return info.biometryType as BiometryType;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true if a biometric sensor is available and enrolled.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const type = await getSupportedBiometryType();
  return type !== null;
}

// ─── Labels & Icons ──────────────────────────────────────────────────────────

export function getBiometricLabel(biometryType: BiometryType): string {
  switch (biometryType) {
    case 'FaceID':
      return 'Face ID';
    case 'TouchID':
      return 'Touch ID';
    case 'Biometrics':
      return 'Fingerprint';
    default:
      return 'Biometrics';
  }
}

export function getBiometricIconName(biometryType: BiometryType): string {
  switch (biometryType) {
    case 'FaceID':
      return 'scan1';
    case 'TouchID':
      return 'customerservice';
    case 'Biometrics':
      return 'customerservice';
    default:
      return 'lock';
  }
}

// ─── Biometric Authentication ────────────────────────────────────────────────

/**
 * Triggers the OS biometric prompt via @sbaiahmed1/react-native-biometrics.
 * Returns true on success, false on failure / cancellation.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    console.log('authenticateWithBiometrics')
    const result = await simplePrompt(
      'Use your biometrics to verify your identity',
      // biometricStrength can be added here if needed:
      // { biometricStrength: BiometricStrength.Strong }
    );
    return result.success;
  } catch (error: any) {
    console.log('Biometric auth error:', error?.message);
    return false;
  }
}
