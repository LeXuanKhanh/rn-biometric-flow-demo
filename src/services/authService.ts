import * as Keychain from 'react-native-keychain';

const REFRESH_TOKEN_SERVICE = 'com.rnbiometricflowdemo.refreshToken';
const PIN_SERVICE = 'com.rnbiometricflowdemo.pin';
const FAILURE_COUNT_SERVICE = 'com.rnbiometricflowdemo.failureCount';

// ─── Refresh Token ──────────────────────────────────────────────────────────

export async function storeRefreshToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('refreshToken', token, {
    service: REFRESH_TOKEN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: REFRESH_TOKEN_SERVICE,
    });
    if (credentials) {
      return credentials.password;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearRefreshToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
}

// ─── PIN ────────────────────────────────────────────────────────────────────

export async function storePIN(pin: string): Promise<void> {
  await Keychain.setGenericPassword('pin', pin, {
    service: PIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function verifyPIN(pin: string): Promise<boolean> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: PIN_SERVICE,
    });
    if (credentials) {
      return credentials.password === pin;
    }
    return false;
  } catch {
    return false;
  }
}

export async function hasPINSet(): Promise<boolean> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: PIN_SERVICE,
    });
    return !!credentials;
  } catch {
    return false;
  }
}

export async function clearPIN(): Promise<void> {
  await Keychain.resetGenericPassword({ service: PIN_SERVICE });
}

// ─── Failure Count ──────────────────────────────────────────────────────────

export async function getFailureCount(): Promise<number> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: FAILURE_COUNT_SERVICE,
    });
    if (credentials) {
      return parseInt(credentials.password, 10) || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function incrementFailureCount(): Promise<number> {
  const current = await getFailureCount();
  const next = current + 1;
  await Keychain.setGenericPassword('failureCount', String(next), {
    service: FAILURE_COUNT_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return next;
}

export async function resetFailureCount(): Promise<void> {
  await Keychain.resetGenericPassword({ service: FAILURE_COUNT_SERVICE });
}

// ─── Token Refresh ──────────────────────────────────────────────────────────

/**
 * Mock token refresh — in production this would call your auth API.
 * Returns a new access token string.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  // Simulate network delay
  await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  // Return a mock access token
  return `access_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ─── Full Logout ─────────────────────────────────────────────────────────────

export async function forceLogout(): Promise<void> {
  await Promise.all([
    clearRefreshToken(),
    clearPIN(),
    resetFailureCount(),
  ]);
}
