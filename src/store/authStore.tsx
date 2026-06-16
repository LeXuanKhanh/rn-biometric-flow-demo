import React, {createContext, useContext, useState, useCallback} from 'react';

export type AuthStatus =
  | 'bootstrapping'
  | 'unauthenticated'
  | 'security_gate'
  | 'authenticated';

interface AuthState {
  status: AuthStatus;
  refreshToken: string | null;
  accessToken: string | null;
  failureCount: number;
}

interface AuthContextType extends AuthState {
  setStatus: (status: AuthStatus) => void;
  setRefreshToken: (token: string | null) => void;
  setAccessToken: (token: string | null) => void;
  setFailureCount: (count: number) => void;
  incrementFailure: () => number;
  resetAuth: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<AuthState>({
    status: 'bootstrapping',
    refreshToken: null,
    accessToken: null,
    failureCount: 0,
  });

  const setStatus = useCallback((status: AuthStatus) => {
    setState(prev => ({...prev, status}));
  }, []);

  const setRefreshToken = useCallback((token: string | null) => {
    setState(prev => ({...prev, refreshToken: token}));
  }, []);

  const setAccessToken = useCallback((token: string | null) => {
    setState(prev => ({...prev, accessToken: token}));
  }, []);

  const setFailureCount = useCallback((count: number) => {
    setState(prev => ({...prev, failureCount: count}));
  }, []);

  const incrementFailure = useCallback(() => {
    let next = 0;
    setState(prev => {
      next = prev.failureCount + 1;
      return {...prev, failureCount: next};
    });
    return next;
  }, []);

  const resetAuth = useCallback(() => {
    setState({
      status: 'unauthenticated',
      refreshToken: null,
      accessToken: null,
      failureCount: 0,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        setStatus,
        setRefreshToken,
        setAccessToken,
        setFailureCount,
        incrementFailure,
        resetAuth,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
