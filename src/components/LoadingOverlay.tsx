import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({
  message = 'Loading...',
}: LoadingOverlayProps) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Rotate animation for the ring
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    ).start();
  }, [pulse, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.logoContainer, {opacity: pulse}]}>
        <Animated.View
          style={[styles.spinner, {transform: [{rotate: spin}]}]}
        />
        <AntDesign name="lock" size={44} color="#6366F1" />
      </Animated.View>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>Please wait...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spinner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#6366F1',
    borderRightColor: '#818CF8',
  },
  // icon removed — now using AntDesign icon directly
  message: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subMessage: {
    color: '#4B5563',
    fontSize: 14,
  },
});
