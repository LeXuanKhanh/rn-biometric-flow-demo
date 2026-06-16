import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';

interface PinPadProps {
  onComplete: (pin: string) => void;
  pinLength?: number;
  disabled?: boolean;
  error?: boolean;
}

export default function PinPad({
  onComplete,
  pinLength = 6,
  disabled = false,
  error = false,
}: PinPadProps) {
  const [pin, setPin] = useState('');
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Vibration.vibrate(400);
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 12, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -12, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 60, useNativeDriver: true}),
    ]).start();
  }, [shakeAnim]);

  React.useEffect(() => {
    if (error) {
      shake();
      // Reset pin after error shake
      const timer = setTimeout(() => setPin(''), 500);
      return () => clearTimeout(timer);
    }
  }, [error, shake]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled) {return;}
      if (pin.length >= pinLength) {return;}
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === pinLength) {
        setTimeout(() => {
          onComplete(newPin);
          setPin('');
        }, 100);
      }
    },
    [pin, pinLength, disabled, onComplete],
  );

  const handleDelete = useCallback(() => {
    if (disabled) {return;}
    setPin(prev => prev.slice(0, -1));
  }, [disabled]);

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <View style={styles.container}>
      {/* PIN Dots */}
      <Animated.View
        style={[styles.dotsRow, {transform: [{translateX: shakeAnim}]}]}>
        {Array.from({length: pinLength}).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length && styles.dotFilled,
              error && styles.dotError,
            ]}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => {
              if (key === '') {
                return <View key={ki} style={styles.keyPlaceholder} />;
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key={ki}
                    style={styles.keyButton}
                    onPress={handleDelete}
                    disabled={disabled}
                    activeOpacity={0.7}>
                    <AntDesign name="arrowleft" size={22} color="#94A3B8" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={ki}
                  style={[styles.keyButton, disabled && styles.keyDisabled]}
                  onPress={() => handleDigit(key)}
                  disabled={disabled}
                  activeOpacity={0.7}>
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4B5563',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dotError: {
    borderColor: '#EF4444',
    backgroundColor: '#EF4444',
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  keyButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A2035',
    borderWidth: 1,
    borderColor: '#2D3A5A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  keyDisabled: {
    opacity: 0.4,
  },
  keyPlaceholder: {
    width: 80,
    height: 80,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  // deleteKey removed — now using AntDesign arrowleft icon
});
