import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary, type ErrorBoundaryProps } from '@/components/ErrorBoundary';
import type { ErrorFallbackProps } from '@/components/ErrorFallback';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@/lib/tokenCache';
import {
  setBaseUrl,
  setAuthTokenGetter,
} from '@workspace/api-client-react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync().then(
  () => console.info('[startup] Native splash auto-hide prevention enabled'),
  (error) =>
    console.error(
      '[startup] Failed to prevent native splash auto-hide',
      formatError(error),
    ),
);

const queryClient = new QueryClient();
const STARTUP_DIAGNOSTIC_DELAY_MS = 8_000;
const FONT_LOAD_TIMEOUT_MS = 5_000;
const SPLASH_HIDE_TIMEOUT_MS = 5_000;

type StartupErrorInfo = {
  message: string;
  stackTrace?: string;
};

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getPublishableKeyPrefix(): string {
  if (!publishableKey) return 'undefined';
  return `${publishableKey.slice(0, 15)}…`;
}

function hideNativeSplash(reason: string): void {
  console.info(`[startup] Hiding native splash (${reason})`);

  let settled = false;
  const watchdog = setTimeout(() => {
    if (!settled) {
      console.error(
        `[startup] SplashScreen.hideAsync() did not settle within ${SPLASH_HIDE_TIMEOUT_MS}ms`,
      );
    }
  }, SPLASH_HIDE_TIMEOUT_MS);

  void SplashScreen.hideAsync().then(
    () => {
      settled = true;
      clearTimeout(watchdog);
      console.info('[startup] Native splash hidden');
    },
    (error) => {
      settled = true;
      clearTimeout(watchdog);
      console.error(
        '[startup] SplashScreen.hideAsync() failed',
        formatError(error),
      );
    },
  );
}

function StartupErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <View style={styles.diagnosticContainer}>
      <Text style={styles.diagnosticTitle}>Authentication startup failed</Text>
      <Text style={styles.diagnosticText}>
        ClerkProvider threw before the app could render.
      </Text>
      <Text style={styles.diagnosticText}>
        Error: {error.message || 'Unknown error'}
      </Text>
      <Text style={styles.diagnosticText}>
        Publishable key prefix: {getPublishableKeyPrefix()}
      </Text>
      <Text style={styles.diagnosticText}>
        API base URL: {domain ? `https://${domain}` : 'undefined'}
      </Text>
      <ScrollView style={styles.diagnosticDetails}>
        <Text selectable style={styles.diagnosticMono}>
          {error.stack || 'No stack trace captured.'}
        </Text>
      </ScrollView>
      <Pressable onPress={resetError} style={styles.diagnosticButton}>
        <Text style={styles.diagnosticButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

type RuntimeErrorUtils = {
  getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
  setGlobalHandler?: (
    handler: (error: unknown, isFatal?: boolean) => void,
  ) => void;
};

function RuntimeErrorReporter({
  onError,
}: {
  onError: (error: StartupErrorInfo) => void;
}) {
  useEffect(() => {
    const globalObject = globalThis as typeof globalThis & {
      ErrorUtils?: RuntimeErrorUtils;
      addEventListener?: (
        type: string,
        listener: (event: { reason?: unknown }) => void,
      ) => void;
      removeEventListener?: (
        type: string,
        listener: (event: { reason?: unknown }) => void,
      ) => void;
    };
    const errorUtils = globalObject.ErrorUtils;
    const previousHandler = errorUtils?.getGlobalHandler?.();
    const report = (source: string, error: unknown, stackTrace?: string) => {
      const message = formatError(error);
      console.error(`[Choremate startup] ${source}: ${message}`, error);
      onError({ message, stackTrace });
    };
    const globalHandler = (error: unknown, isFatal?: boolean) => {
      report(`global ${isFatal ? 'fatal ' : ''}error`, error);
      previousHandler?.(error, isFatal);
    };
    const unhandledRejectionHandler = (event: { reason?: unknown }) => {
      report('unhandled promise rejection', event.reason);
    };

    errorUtils?.setGlobalHandler?.(globalHandler);
    globalObject.addEventListener?.(
      'unhandledrejection',
      unhandledRejectionHandler,
    );

    return () => {
      if (previousHandler) errorUtils?.setGlobalHandler?.(previousHandler);
      globalObject.removeEventListener?.(
        'unhandledrejection',
        unhandledRejectionHandler,
      );
    };
  }, [onError]);

  return null;
}

// Invalidate cache when user changes
function ClerkQueryClientCacheInvalidator() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (
      prevUserIdRef.current !== undefined &&
      prevUserIdRef.current !== userId
    ) {
      qc.clear();
    }
    prevUserIdRef.current = userId;
  }, [userId, qc]);

  return null;
}

function RootLayoutNav() {
  const { startupError } = React.useContext(StartupDiagnosticsContext);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colors = useColors();
  const [apiAuthReady, setApiAuthReady] = React.useState(false);
  const [showStartupDiagnostics, setShowStartupDiagnostics] =
    React.useState(false);

  useEffect(() => {
    if (isLoaded && apiAuthReady) {
      setShowStartupDiagnostics(false);
      return;
    }

    const timer = setTimeout(
      () => setShowStartupDiagnostics(true),
      STARTUP_DIAGNOSTIC_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [apiAuthReady, isLoaded]);

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    setApiAuthReady(true);
    return () => {
      setApiAuthReady(false);
      setAuthTokenGetter(async () => null);
    };
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (isSignedIn && inAuthGroup) {
      router.replace('/');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments, router]);

  if (!isLoaded || !apiAuthReady) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        {showStartupDiagnostics ? (
          <ScrollView
            contentContainerStyle={styles.diagnosticContent}
            style={styles.diagnosticScroll}
          >
            <Text style={[styles.diagnosticTitle, { color: colors.foreground }]}>
              Authentication is still loading
            </Text>
            <Text style={[styles.diagnosticText, { color: colors.foreground }]}>
              Clerk isLoaded: {String(isLoaded)}
            </Text>
            <Text style={[styles.diagnosticText, { color: colors.foreground }]}>
              API auth ready: {String(apiAuthReady)}
            </Text>
            <Text style={[styles.diagnosticText, { color: colors.foreground }]}>
              Publishable key prefix: {getPublishableKeyPrefix()}
            </Text>
            <Text style={[styles.diagnosticText, { color: colors.foreground }]}>
              API base URL: {domain ? `https://${domain}` : 'undefined'}
            </Text>
            <Text style={[styles.diagnosticText, { color: colors.foreground }]}>
              Captured runtime error:{' '}
              {startupError?.message || 'none captured'}
            </Text>
            {startupError?.stackTrace ? (
              <Text selectable style={[styles.diagnosticMono, { color: colors.foreground }]}>
                {startupError.stackTrace}
              </Text>
            ) : null}
          </ScrollView>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: 'Back' }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="setup" options={{ presentation: 'modal' }} />
      <Stack.Screen name="job/new" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [fontLoadTimedOut, setFontLoadTimedOut] = React.useState(false);
  const splashHideStarted = React.useRef(false);
  const [startupError, setStartupError] =
    React.useState<StartupErrorInfo | null>(null);
  const recordStartupError = React.useCallback(
    (error: StartupErrorInfo) => {
      setStartupError((current) => current ?? error);
    },
    [],
  );
  const recordBoundaryError = React.useCallback<
    NonNullable<ErrorBoundaryProps['onError']>
  >((error, stackTrace) => {
    recordStartupError({ message: error.message, stackTrace });
  }, [recordStartupError]);

  useEffect(() => {
    if (fontsLoaded || fontError || fontLoadTimedOut) {
      return;
    }

    const timeoutId = setTimeout(() => {
      console.warn(
        `[startup] Inter font loading exceeded ${FONT_LOAD_TIMEOUT_MS}ms; continuing with system font fallback`,
      );
      setFontLoadTimedOut(true);
    }, FONT_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [fontLoadTimedOut, fontError, fontsLoaded]);

  const canRenderWithoutFonts = fontsLoaded || Boolean(fontError) || fontLoadTimedOut;

  useEffect(() => {
    if (!canRenderWithoutFonts || splashHideStarted.current) return;

    splashHideStarted.current = true;
    const reason = fontsLoaded
      ? 'Inter fonts loaded'
      : fontError
        ? 'Inter font loading failed'
        : 'Inter font loading timed out; using system fallback';
    hideNativeSplash(reason);
  }, [canRenderWithoutFonts, fontError, fontsLoaded]);

  if (!canRenderWithoutFonts) return null;

  return (
    <SafeAreaProvider>
      <RuntimeErrorReporter onError={recordStartupError} />
      <ErrorBoundary
        FallbackComponent={StartupErrorFallback}
        onError={recordBoundaryError}
      >
        <ClerkProvider
          publishableKey={publishableKey}
          tokenCache={tokenCache}
          proxyUrl={proxyUrl}
          standardBrowser={false}
        >
          <StartupDiagnosticsContext.Provider value={{ startupError }}>
            <QueryClientProvider client={queryClient}>
              <ClerkQueryClientCacheInvalidator />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </QueryClientProvider>
          </StartupDiagnosticsContext.Provider>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const StartupDiagnosticsContext = React.createContext<{
  startupError: StartupErrorInfo | null;
}>({ startupError: null });

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  diagnosticScroll: {
    width: '100%',
  },
  diagnosticContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  diagnosticContainer: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  diagnosticTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  diagnosticText: {
    fontSize: 14,
    lineHeight: 20,
  },
  diagnosticDetails: {
    flex: 1,
    marginTop: 8,
  },
  diagnosticMono: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  diagnosticButton: {
    alignItems: 'center',
    backgroundColor: '#2D6CDF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  diagnosticButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
