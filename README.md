# 🔐 RN Biometric Flow Demo

A bare React Native project demonstrating a complete **biometric authentication flow** using `react-native-keychain`.

## Flow Diagram

```
App Start ──► Bootstrap
                │
    ┌───────────┴──────────────┐
    │ No refresh token         │ Has refresh token
    ▼                          ▼
Login Screen           Security Gate
                              │
                    ┌─────────┴─────────┐
                    │ Biometrics?       │
               Yes  ▼               No  ▼
            Face ID / Touch ID     PIN Code
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Fail > 5?        │
               Yes  ▼               No  ▼
            Force Logout       Pass Security Gate
                                      │
                              Refresh Token
                                      │
                              Authenticated
                                      │
                               Home Screen
```

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| react-native | 0.86.0 | Bare framework |
| react-native-keychain | ^10.0.0 | Secure token + PIN storage |
| @react-navigation/native | ^7 | Navigation container |
| @react-navigation/stack | ^7 | Stack navigator |
| react-native-reanimated | ^4 | Animations |
| react-native-gesture-handler | ^3 | Gesture support |
| react-native-safe-area-context | ^5 | Safe area insets |
| react-native-screens | ^4 | Native screen optimization |

## Project Structure

```
src/
├── App.tsx                         # Root app with providers
├── navigation/
│   └── RootNavigator.tsx           # State-machine-based navigation
├── screens/
│   ├── LoginScreen.tsx             # Email/password login
│   ├── SecurityGateScreen.tsx      # Biometric or PIN challenge
│   └── HomeScreen.tsx              # Authenticated home
├── services/
│   ├── authService.ts              # Keychain token and PIN operations
│   └── biometricService.ts        # Biometric availability and auth
├── components/
│   ├── PinPad.tsx                  # 6-digit PIN pad component
│   └── LoadingOverlay.tsx          # Bootstrap loading state
└── store/
    └── authStore.tsx               # React Context auth state
```

## Security Model

- **Refresh tokens** stored in iOS Keychain / Android Keystore via react-native-keychain
- **PIN** stored securely with WHEN_UNLOCKED_THIS_DEVICE_ONLY access
- **Biometric failures** tracked persistently 5 failures trigger force logout
- **Force logout** clears all keychain entries

## Running

### iOS
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### Android
```bash
npx react-native run-android
```

## Demo Credentials

Any non-empty email + password combination will log you in (mock validation).

## iOS Permission

NSFaceIDUsageDescription is set in Info.plist for Face ID.

## Android Permissions

USE_BIOMETRIC and USE_FINGERPRINT are declared in AndroidManifest.xml.
