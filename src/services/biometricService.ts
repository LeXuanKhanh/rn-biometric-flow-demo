import * as Keychain from 'react-native-keychain';

export type BiometryType =
  | 'TouchID'
  | 'FaceID'
  | 'Fingerprint'
  | 'Face'
  | 'Iris'
  | null;

// ─── Biometric Availability ─────────────────────────────────────────────────

export async function getSupportedBiometryType(): Promise<BiometryType> {
  try {
    const biometryType = await Keychain.getSupportedBiometryType();
    return biometryType as BiometryType;
  } catch {
    return null;
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  const type = await getSupportedBiometryType();
  console.log('type: ',type)
  return type !== null;
}

export function getBiometricLabel(biometryType: BiometryType): string {
  switch (biometryType) {
    case 'FaceID':
      return 'Face ID';
    case 'TouchID':
      return 'Touch ID';
    case 'Fingerprint':
      return 'Fingerprint';
    case 'Face':
      return 'Face Recognition';
    case 'Iris':
      return 'Iris Scan';
    default:
      return 'Biometrics';
  }
}

export function getBiometricIconName(biometryType: BiometryType): string {
  switch (biometryType) {
    case 'FaceID':
    case 'Face':
      return 'scan1';
    case 'TouchID':
    case 'Fingerprint':
      return 'customerservice';
    case 'Iris':
      return 'eye';
    default:
      return 'lock';
  }
}

// ─── Biometric Authentication ────────────────────────────────────────────────

const BIOMETRIC_MARKER_SERVICE = 'com.rnbiometricflowdemo.biometricMarker';

export async function authenticateWithBiometrics(): Promise<boolean> {
  try {
    // Store + retrieve with biometrics access control forces the OS prompt
    await Keychain.setGenericPassword('biometric', 'auth_marker', {
      service: BIOMETRIC_MARKER_SERVICE,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: {
        title: 'Biometric Authentication',
        subtitle: 'Authenticate to continue',
        description: 'Use your biometrics to verify your identity',
        cancel: 'Use PIN instead',
      },
    });

    const result = await Keychain.getGenericPassword({
      service: BIOMETRIC_MARKER_SERVICE,
      authenticationPrompt: {
        title: 'Biometric Authentication',
        subtitle: 'Authenticate to continue',
        description: 'Use your biometrics to verify your identity',
        cancel: 'Use PIN instead',
      },
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    });

    return !!result;
  } catch (error: any) {
    // User cancelled or biometric failed
    console.log('Biometric auth error:', error?.message);
    return false;
  }
}
