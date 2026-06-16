import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {storeRefreshToken} from '../services/authService';
import {useAuth} from '../store/authStore';

interface Props {
  onLoginSuccess: () => void;
}

export default function LoginScreen({onLoginSuccess}: Props) {
  const {setRefreshToken} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 6, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -6, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 60, useNativeDriver: true}),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      shake();
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));

      // Mock validation: any non-empty credentials succeed
      if (email.trim() && password.trim()) {
        const mockRefreshToken = `refresh_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;
        await storeRefreshToken(mockRefreshToken);
        setRefreshToken(mockRefreshToken);
        onLoginSuccess();
      } else {
        shake();
        Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      shake();
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <AntDesign name="lock" size={40} color="#6366F1" />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your secure account</Text>
          </View>

          {/* Form */}
          <Animated.View
            style={[styles.form, {transform: [{translateX: shakeAnim}]}]}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  emailFocused && styles.inputWrapperFocused,
                ]}>
                <AntDesign name="mail" size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  // onFocus={() => setEmailFocused(true)}
                  // onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}>
                <AntDesign name="key" size={18} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  // onFocus={() => setPasswordFocused(true)}
                  // onBlur={() => setPasswordFocused(false)}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoHint}>
              <View style={styles.demoHintRow}>
                <AntDesign name="infocirlceo" size={14} color="#6366F1" />
                <Text style={styles.demoHintText}>
                  Demo: enter any email &amp; password to log in
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Text style={styles.footer}>
            Protected by biometric authentication
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 48,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A2035',
    borderWidth: 1,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  // logoIcon removed — now using AntDesign icon directly
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F1F5F9',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141828',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2D3A5A',
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputWrapperFocused: {
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  // inputIcon removed — now using AntDesign icon directly
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '400',
  },
  loginButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoHint: {
    backgroundColor: '#1A2035',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2D3A5A',
  },
  demoHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoHintText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    color: '#4B5563',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 48,
    letterSpacing: 0.3,
  },
});
