import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {forceLogout} from '../services/authService';
import {useAuth} from '../store/authStore';

interface Props {
  accessToken: string | null;
  onLogout: () => void;
}

// ─── Icon name maps for stats and features ───────────────────────────────────
const stats = (accessToken: string | null, refreshToken: string | null) => {
  const truncate = (token: string | null) => {
    if (!token) {return 'N/A';}
    return `${token.slice(0, 16)}...${token.slice(-8)}`;
  };
  return [
    {iconName: 'checkcircleo', label: 'Auth Status', value: 'Authenticated', color: '#10B981'},
    {iconName: 'key',         label: 'Access Token', value: truncate(accessToken), color: '#6366F1'},
    {iconName: 'retweet',     label: 'Refresh Token', value: truncate(refreshToken), color: '#F59E0B'},
    {iconName: 'Safety',      label: 'Security', value: 'Biometric / PIN', color: '#06B6D4'},
  ];
};

const features = [
  {
    iconName: 'lock',
    title: 'Keychain Storage',
    desc: 'Tokens stored securely in iOS Keychain / Android Keystore via react-native-keychain.',
  },
  {
    iconName: 'scan1',
    title: 'Biometric Gate',
    desc: 'Face ID / Fingerprint authentication with up to 5 retry attempts before lockout.',
  },
  {
    iconName: 'appstore-o',
    title: 'PIN Fallback',
    desc: 'PIN code fallback when biometrics are unavailable, also protected by 5-attempt limit.',
  },
];

const flowSteps = [
  {step: 'App Start',       iconName: 'rocket1',     done: true},
  {step: 'Bootstrap',       iconName: 'setting',     done: true},
  {step: 'Token Found',     iconName: 'key',         done: true},
  {step: 'Security Gate',   iconName: 'Safety',      done: true},
  {step: 'Biometrics / PIN', iconName: 'scan1',      done: true},
  {step: 'Token Refreshed', iconName: 'retweet',     done: true},
  {step: 'Home Screen',     iconName: 'home',        done: true},
];

export default function HomeScreen({accessToken, onLogout}: Props) {
  const {refreshToken} = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {toValue: 1, duration: 500, useNativeDriver: true}),
        Animated.timing(slideAnim, {toValue: 0, duration: 500, useNativeDriver: true}),
      ]),
      Animated.stagger(120, [
        Animated.timing(card1Anim, {toValue: 1, duration: 350, useNativeDriver: true}),
        Animated.timing(card2Anim, {toValue: 1, duration: 350, useNativeDriver: true}),
        Animated.timing(card3Anim, {toValue: 1, duration: 350, useNativeDriver: true}),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, card1Anim, card2Anim, card3Anim]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          await forceLogout();
          onLogout();
        },
      },
    ]);
  };

  const statItems = stats(accessToken, refreshToken);
  const cardAnims = [card1Anim, card2Anim, card3Anim, card3Anim];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View
          style={[styles.header, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
          <View style={styles.greeting}>
            <View style={styles.avatarContainer}>
              <AntDesign name="user" size={24} color="#6366F1" />
            </View>
            <View>
              <Text style={styles.greetingText}>Good evening</Text>
              <Text style={styles.nameText}>Authenticated User</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={logoutLoading}
            activeOpacity={0.8}>
            <AntDesign name="logout" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </Animated.View>

        {/* Success Banner */}
        <Animated.View
          style={[styles.successBanner, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
          <AntDesign name="checkcircle" size={36} color="#10B981" />
          <View style={styles.successText}>
            <Text style={styles.successTitle}>Security Gate Passed</Text>
            <Text style={styles.successSubtitle}>
              Identity verified • Token refreshed • Session active
            </Text>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statItems.map((stat, i) => (
            <Animated.View
              key={i}
              style={[styles.statCard, {opacity: cardAnims[i]}]}>
              <AntDesign name={stat.iconName as any} size={24} color={stat.color} style={styles.statIcon} />
              <Text style={[styles.statValue, {color: stat.color}]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Flow Recap */}
        <Animated.View style={[styles.section, {opacity: card2Anim}]}>
          <Text style={styles.sectionTitle}>Auth Flow</Text>
          <View style={styles.flowContainer}>
            {flowSteps.map((item, i, arr) => (
              <View key={i} style={styles.flowItem}>
                <View style={[styles.flowDot, item.done && styles.flowDotDone]}>
                  <AntDesign
                    name={item.iconName as any}
                    size={16}
                    color={item.done ? '#10B981' : '#4B5563'}
                  />
                </View>
                <Text style={[styles.flowStepText, item.done && styles.flowStepDone]}>
                  {item.step}
                </Text>
                {i < arr.length - 1 && <View style={styles.flowConnector} />}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.section, {opacity: card3Anim}]}>
          <Text style={styles.sectionTitle}>Security Features</Text>
          <View style={styles.featuresList}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <AntDesign name={f.iconName as any} size={28} color="#6366F1" style={styles.featureIcon} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Logout button */}
        <Animated.View style={{opacity: card3Anim}}>
          <TouchableOpacity
            style={styles.fullLogoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}>
            <AntDesign name="logout" size={16} color="#FCA5A5" style={styles.fullLogoutIcon} />
            <Text style={styles.fullLogoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A2035',
    borderWidth: 1,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 2,
  },
  nameText: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '700',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A2035',
    borderWidth: 1,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    backgroundColor: '#0D1F18',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#064E3B',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  successText: {
    flex: 1,
    gap: 4,
  },
  successTitle: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
  },
  successSubtitle: {
    color: '#6EE7B7',
    fontSize: 12,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#141828',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3A5A',
    padding: 16,
    gap: 6,
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  flowContainer: {
    backgroundColor: '#141828',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2D3A5A',
    padding: 20,
    gap: 0,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
  },
  flowDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A2035',
    borderWidth: 1,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  flowDotDone: {
    backgroundColor: '#1A3A2A',
    borderColor: '#065F46',
  },
  flowStepText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    paddingVertical: 12,
  },
  flowStepDone: {
    color: '#10B981',
  },
  flowConnector: {
    position: 'absolute',
    left: 17,
    top: 36,
    width: 2,
    height: 24,
    backgroundColor: '#065F46',
    zIndex: 0,
  },
  featuresList: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#141828',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D3A5A',
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  featureIcon: {
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
  },
  featureDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
  },
  fullLogoutButton: {
    backgroundColor: '#1A0E0E',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    flexDirection: 'row',
    gap: 8,
  },
  fullLogoutIcon: {
    marginTop: 1,
  },
  fullLogoutText: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '600',
  },
});
