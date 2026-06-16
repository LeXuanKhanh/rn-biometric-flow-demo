import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import PinPad from '../components/PinPad';
import {getBiometricLabel} from '../services/biometricService';
import {
  verifyPIN,
  hasPINSet,
  storePIN,
  resetFailureCount,
} from '../services/authService';
import {useBiometricAuth} from '../hooks/useBiometricAuth';

const MAX_FAILURES = 5;

interface Props {
  onPassGate: () => void;
  onForceLogout: () => void;
}

type Mode = 'checking' | 'biometric' | 'pin_verify' | 'pin_setup';

export default function SecurityGateScreen({onPassGate, onForceLogout}: Props) {
  const [mode, setMode] = useState<Mode>('checking');
  const [pinError, setPinError] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [pinSetupStep, setPinSetupStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPinEntry, setFirstPinEntry] = useState('');

  // ─── Biometric hook ───────────────────────────────────────────────────────
  const {
    isBiometricSupported,
    biometryType,
    biometricIconName,
    failureCount,
    attemptsRemaining,
    isAuthenticating,
    isInitialising,
    authenticate,
    resetFailures,
  } = useBiometricAuth({
    maxFailures: MAX_FAILURES,
    onLockedOut: () =>
      Alert.alert(
        'Security Lock',
        'Too many failed attempts. Logging out for your security.',
        [{text: 'OK', onPress: onForceLogout}],
      ),
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 400, useNativeDriver: true}),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // ─── Bootstrap security gate (mode selection only) ────────────────────────
  useEffect(() => {
    if (isInitialising) {return;}

    (async () => {
      // Already locked out from a previous session?
      if (failureCount >= MAX_FAILURES) {
        Alert.alert(
          'Account Locked',
          'Too many failed attempts. You have been logged out for security.',
          [{text: 'OK', onPress: onForceLogout}],
        );
        return;
      }

      if (isBiometricSupported) {
        setMode('biometric');
        setStatusMessage(`Use ${getBiometricLabel(biometryType)} to unlock`);
      } else {
        const pinExists = await hasPINSet();
        setMode(pinExists ? 'pin_verify' : 'pin_setup');
        setStatusMessage(pinExists ? 'Enter your PIN' : 'Create a PIN');
      }

      animateIn();
    })();
  // Run once after the hook finishes initialising
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialising]);

  // ─── Biometric auth via hook ──────────────────────────────────────────────
  const triggerBiometric = useCallback(async () => {
    if (isAuthenticating) {return;}
    const result = await authenticate();
    if (result === 'success') {
      onPassGate();
    } else if (result === 'failed') {
      Alert.alert(
        'Authentication Failed',
        `Incorrect attempt. ${attemptsRemaining - 1} ${
          attemptsRemaining - 1 === 1 ? 'try' : 'tries'
        } remaining.`,
      );
    }
    // 'locked_out' is handled by onLockedOut callback in the hook
  }, [isAuthenticating, authenticate, onPassGate, attemptsRemaining]);

  // Auto-trigger biometric prompt on entering biometric mode
  useEffect(() => {
    if (mode === 'biometric') {
      const timer = setTimeout(triggerBiometric, 600);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ─── PIN verify ───────────────────────────────────────────────────────────
  const handlePinComplete = useCallback(
    async (pin: string) => {
      const correct = await verifyPIN(pin);
      if (correct) {
        setPinError(false);
        await resetFailures();
        onPassGate();
      } else {
        setPinError(true);
        setTimeout(() => setPinError(false), 600);
        // Re-use the hook's failure tracking for PIN too
        const newCount = failureCount + 1;
        if (newCount >= MAX_FAILURES) {
          Alert.alert(
            'Security Lock',
            'Too many failed attempts. Logging out for your security.',
            [{text: 'OK', onPress: onForceLogout}],
          );
        } else {
          Alert.alert(
            'Authentication Failed',
            `Incorrect PIN. ${MAX_FAILURES - newCount} ${
              MAX_FAILURES - newCount === 1 ? 'try' : 'tries'
            } remaining.`,
          );
        }
      }
    },
    [failureCount, onForceLogout, onPassGate, resetFailures],
  );

  // ─── PIN setup ────────────────────────────────────────────────────────────
  const handlePinSetup = useCallback(
    async (pin: string) => {
      if (pinSetupStep === 'enter') {
        setFirstPinEntry(pin);
        setPinSetupStep('confirm');
        setStatusMessage('Confirm your PIN');
      } else {
        if (pin === firstPinEntry) {
          await storePIN(pin);
          setMode('pin_verify');
          setStatusMessage('Enter your PIN');
          setPinSetupStep('enter');
          setFirstPinEntry('');
        } else {
          setPinError(true);
          setTimeout(() => setPinError(false), 600);
          setPinSetupStep('enter');
          setFirstPinEntry('');
          setStatusMessage('PINs did not match. Try again.');
          setTimeout(() => setStatusMessage('Create a PIN'), 1500);
        }
      }
    },
    [firstPinEntry, pinSetupStep],
  );

  // ─── Switch to PIN ────────────────────────────────────────────────────────
  const switchToPin = useCallback(async () => {
    const pinExists = await hasPINSet();
    setMode(pinExists ? 'pin_verify' : 'pin_setup');
    setStatusMessage(pinExists ? 'Enter your PIN' : 'Create a PIN');
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 0, duration: 150, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 20, duration: 150, useNativeDriver: true}),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
        Animated.timing(slideAnim, {toValue: 0, duration: 300, useNativeDriver: true}),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const failuresRemaining = attemptsRemaining;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
        ]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {mode === 'checking' ? (
              <ActivityIndicator color="#6366F1" size="large" />
            ) : (
              <AntDesign
                name={
                  mode === 'biometric'
                    ? biometricIconName
                    : mode === 'pin_setup'
                    ? 'appstore-o'
                    : 'lock'
                }
                size={44}
                color="#6366F1"
              />
            )}
          </View>
          <Text style={styles.title}>Security Gate</Text>
          <Text style={styles.subtitle}>{statusMessage}</Text>
        </View>

        {/* Failure warning */}
        {failureCount > 0 && failureCount < MAX_FAILURES && (
          <View style={styles.warningBadge}>
            <AntDesign name="warning" size={14} color="#FCA5A5" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              {failuresRemaining} {failuresRemaining === 1 ? 'attempt' : 'attempts'} remaining
            </Text>
          </View>
        )}

        {/* Biometric mode */}
        {mode === 'biometric' && (
          <View style={styles.biometricSection}>
            <TouchableOpacity
              style={[styles.biometricButton, isAuthenticating && styles.biometricButtonActive]}
              onPress={triggerBiometric}
              disabled={isAuthenticating}
              activeOpacity={0.8}>
              {isAuthenticating ? (
                <ActivityIndicator color="#6366F1" size="large" />
              ) : (
                <>
                  <AntDesign
                    name={biometricIconName}
                    size={56}
                    color="#6366F1"
                  />
                  <Text style={styles.biometricButtonLabel}>
                    {getBiometricLabel(biometryType)}
                  </Text>
                  <Text style={styles.biometricButtonHint}>Tap to authenticate</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.altButton} onPress={switchToPin}>
              <Text style={styles.altButtonText}>Use PIN instead</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PIN mode (verify or setup) */}
        {(mode === 'pin_verify' || mode === 'pin_setup') && (
          <View style={styles.pinSection}>
            {mode === 'pin_setup' && (
              <View style={styles.setupStepBadge}>
                <Text style={styles.setupStepText}>
                  {pinSetupStep === 'enter' ? 'Step 1 of 2: Create' : 'Step 2 of 2: Confirm'}
                </Text>
              </View>
            )}
            <PinPad
              onComplete={mode === 'pin_verify' ? handlePinComplete : handlePinSetup}
              pinLength={6}
              disabled={isAuthenticating}
              error={pinError}
            />
          </View>
        )}

        {/* Progress dots */}
        {failureCount > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Failed attempts</Text>
            <View style={styles.progressDots}>
              {Array.from({length: MAX_FAILURES}).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i < failureCount && styles.progressDotFailed,
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    gap: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A2035',
    borderWidth: 1.5,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 8,
  },
  // modeIcon removed — now using AntDesign icon directly
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBadge: {
    backgroundColor: '#2D1A1A',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
  },
  biometricSection: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  biometricButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#141828',
    borderWidth: 2,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  biometricButtonActive: {
    borderColor: '#6366F1',
    shadowOpacity: 0.5,
  },
  // biometricButtonIcon removed — now using AntDesign icon directly
  biometricButtonLabel: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButtonHint: {
    color: '#6B7280',
    fontSize: 12,
  },
  altButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  altButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '500',
  },
  pinSection: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  setupStepBadge: {
    backgroundColor: '#1A2035',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2D3A5A',
  },
  setupStepText: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    gap: 10,
  },
  progressLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A2035',
    borderWidth: 1,
    borderColor: '#2D3A5A',
  },
  progressDotFailed: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
});
