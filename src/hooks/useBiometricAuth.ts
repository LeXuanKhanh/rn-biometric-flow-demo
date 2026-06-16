import {useState, useCallback, useEffect} from 'react';
import {
  isBiometricAvailable,
  getSupportedBiometryType,
  authenticateWithBiometrics,
  getBiometricLabel,
  getBiometricIconName,
  BiometryType,
} from '../services/biometricService';
import {
  getFailureCount,
  incrementFailureCount,
  resetFailureCount,
} from '../services/authService';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthResult =
  | 'success'       // Biometric verified OK
  | 'failed'        // Biometric rejected (below max failures)
  | 'locked_out';   // Max failures reached

export interface UseBiometricAuthOptions {
  /** Maximum number of failures before locking out. Default: 5 */
  maxFailures?: number;
  /** Called when failures hit maxFailures. Use to trigger logout or block. */
  onLockedOut?: () => void;
}

export interface UseBiometricAuthReturn {
  /** Whether biometric hardware is available on this device */
  isBiometricSupported: boolean;
  /** The specific biometry type (FaceID, TouchID, Fingerprint…) */
  biometryType: BiometryType;
  /** Human-readable label, e.g. "Face ID" */
  biometricLabel: string;
  /** AntDesign icon name for the current biometry type */
  biometricIconName: string;
  /** Current failure count (persisted in Keychain) */
  failureCount: number;
  /** Max allowed failures before lockout */
  maxFailures: number;
  /** How many attempts are left before lockout */
  attemptsRemaining: number;
  /** True while biometric prompt is in-flight */
  isAuthenticating: boolean;
  /** Whether the device is initialising biometric state */
  isInitialising: boolean;
  /**
   * Trigger the OS biometric prompt.
   * - Increments failure count on failure.
   * - Resets failure count on success.
   * - Calls `onLockedOut` if max failures is reached.
   * @returns The auth result.
   */
  authenticate: () => Promise<AuthResult>;
  /**
   * Reset the stored failure count to zero.
   * Call this after a successful authentication flow completes.
   */
  resetFailures: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBiometricAuth({
  maxFailures = 5,
  onLockedOut,
}: UseBiometricAuthOptions = {}): UseBiometricAuthReturn {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isInitialising, setIsInitialising] = useState(true);

  // ─── Initialise: load persisted failure count + check hw support ───────────
  useEffect(() => {
    (async () => {
      try {
        const [storedFailures, available, type] = await Promise.all([
          getFailureCount(),
          isBiometricAvailable(),
          getSupportedBiometryType(),
        ]);

        setFailureCount(storedFailures);
        setIsBiometricSupported(available);
        setBiometryType(type);
      } finally {
        setIsInitialising(false);
      }
    })();
  }, []);

  // ─── authenticate ─────────────────────────────────────────────────────────
  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (isAuthenticating) {return 'failed';}

    setIsAuthenticating(true);
    try {
      const success = await authenticateWithBiometrics();

      if (success) {
        // Reset persisted count and local state on success
        await resetFailureCount();
        setFailureCount(0);
        return 'success';
      }

      // Failure path — increment persisted counter
      const newCount = await incrementFailureCount();
      setFailureCount(newCount);

      if (newCount >= maxFailures) {
        onLockedOut?.();
        return 'locked_out';
      }

      return 'failed';
    } catch {
      // Treat exceptions (e.g. user cancelled) the same as a failure
      const newCount = await incrementFailureCount();
      setFailureCount(newCount);

      if (newCount >= maxFailures) {
        onLockedOut?.();
        return 'locked_out';
      }

      return 'failed';
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, maxFailures, onLockedOut]);

  // ─── resetFailures ────────────────────────────────────────────────────────
  const resetFailures = useCallback(async () => {
    await resetFailureCount();
    setFailureCount(0);
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────
  const attemptsRemaining = Math.max(0, maxFailures - failureCount);
  const biometricLabel = getBiometricLabel(biometryType);
  const biometricIconName = getBiometricIconName(biometryType);

  return {
    isBiometricSupported,
    biometryType,
    biometricLabel,
    biometricIconName,
    failureCount,
    maxFailures,
    attemptsRemaining,
    isAuthenticating,
    isInitialising,
    authenticate,
    resetFailures,
  };
}
