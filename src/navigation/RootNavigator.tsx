import React, {useEffect, useState, useRef} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import SecurityGateScreen from '../screens/SecurityGateScreen';
import HomeScreen from '../screens/HomeScreen';
import LoadingOverlay from '../components/LoadingOverlay';

import {getRefreshToken, forceLogout, refreshAccessToken} from '../services/authService';
import {useAuth} from '../store/authStore';

export type RootStackParamList = {
  Login: undefined;
  SecurityGate: undefined;
  Refreshing: undefined;
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const {
    status,
    setStatus,
    refreshToken,
    setRefreshToken,
    accessToken,
    setAccessToken,
    resetAuth,
  } = useAuth();

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const navigationRef = useRef<any>(null);

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = await getRefreshToken();
        if (token) {
          setRefreshToken(token);
          setStatus('security_gate');
        } else {
          setStatus('unauthenticated');
        }
      } catch {
        setStatus('unauthenticated');
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [setRefreshToken, setStatus]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleLoginSuccess = () => {
    setStatus('security_gate');
  };

  const handlePassGate = async () => {
    setIsRefreshing(true);
    try {
      const token = await getRefreshToken();
      if (!token) {
        handleForceLogout();
        return;
      }
      const newAccessToken = await refreshAccessToken(token);
      setAccessTokenState(newAccessToken);
      setAccessToken(newAccessToken);
      setStatus('authenticated');
    } catch {
      handleForceLogout();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceLogout = async () => {
    await forceLogout();
    resetAuth();
    setAccessTokenState(null);
    setStatus('unauthenticated');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (isBootstrapping) {
    return <LoadingOverlay message="Bootstrapping" />;
  }

  if (isRefreshing) {
    return <LoadingOverlay message="Refreshing token..." />;
  }

  if (status === 'unauthenticated') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (status === 'security_gate') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="SecurityGate">
            {() => (
              <SecurityGateScreen
                onPassGate={handlePassGate}
                onForceLogout={handleForceLogout}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  if (status === 'authenticated') {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Home">
            {() => (
              <HomeScreen
                accessToken={accessTokenState}
                onLogout={handleForceLogout}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return <LoadingOverlay message="Loading..." />;
}
