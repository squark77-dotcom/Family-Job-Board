import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  useRegisterPushToken,
} from '@workspace/api-client-react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { registerForPushNotificationsAsync } from '@/lib/pushNotifications';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

function PushNotificationRegistration() {
  const { isLoaded, isSignedIn } = useAuth();
  const { data: profile } = useGetCurrentUser({
    query: {
      enabled: isLoaded && Boolean(isSignedIn),
      queryKey: getGetCurrentUserQueryKey(),
    },
  });
  const registerToken = useRegisterPushToken();

  useEffect(() => {
    if (
      !isLoaded ||
      !isSignedIn ||
      profile?.user.role !== "child" ||
      registerToken.isPending
    ) {
      return;
    }
    let cancelled = false;
    registerForPushNotificationsAsync()
      .then((token) => {
        if (!cancelled && token) {
          registerToken.mutate({
            data: {
              token,
              platform: Platform.OS === "ios" ? "ios" : "android",
            },
          });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, profile?.user.role]);

  return null;
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colors = useColors();
  const [apiAuthReady, setApiAuthReady] = React.useState(false);

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ClerkProvider
          publishableKey={publishableKey}
          tokenCache={tokenCache}
          proxyUrl={proxyUrl}
        >
          <QueryClientProvider client={queryClient}>
            <ClerkQueryClientCacheInvalidator />
              <PushNotificationRegistration />
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
