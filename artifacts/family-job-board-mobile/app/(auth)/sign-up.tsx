import { useSignUp, useAuth } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useColors } from '@/hooks/useColors';
import { Text } from 'react-native';
import { Image } from 'expo-image';

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  if (signUp?.status === 'complete' || isSignedIn) {
    return null;
  }

  const handleSubmit = async () => {
    if (!signUp) return;
    try {
      const { error } = await signUp.password({
        emailAddress,
        password,
      });
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        return;
      }
      if (!error) await signUp.verifications.sendEmailCode();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    if (!signUp) return;
    try {
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: () => {
            router.push('/');
          },
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const isVerification =
    signUp?.status === 'missing_requirements' &&
    signUp?.unverifiedFields?.includes('email_address') &&
    signUp?.missingFields?.length === 0;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + 60,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 24,
      }}
    >
      <View pointerEvents="none" style={[styles.bubbleLarge, { backgroundColor: colors.secondary }]} />
      <View pointerEvents="none" style={[styles.bubbleSmall, { backgroundColor: colors.accent }]} />
      <View style={styles.header}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo} 
          contentFit="contain" 
        />
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isVerification ? 'Verify your email' : 'Sign up'}
        </Text>
        {!isVerification && (
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Join your crew and start earning.</Text>
        )}
      </View>

      {isVerification ? (
        <View style={styles.form}>
          <Input
            label="Verification code"
            placeholder="Enter the code sent to your email"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            error={errors?.fields?.code?.message}
          />
          <Button
            label="Verify"
            onPress={handleVerify}
            loading={fetchStatus === 'fetching'}
            style={styles.button}
          />
          <Button
            label="I need a new code"
            variant="outline"
            onPress={() => signUp?.verifications.sendEmailCode()}
            style={styles.button}
          />
        </View>
      ) : (
        <View style={styles.form}>
          <Input
            label="Email address"
            placeholder="Enter email"
            value={emailAddress}
            onChangeText={setEmailAddress}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors?.fields?.emailAddress?.message}
          />
          <Input
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors?.fields?.password?.message}
          />
          <Button
            label="Sign up"
            onPress={handleSubmit}
            loading={fetchStatus === 'fetching'}
            disabled={!emailAddress || !password}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              Already have an account?{' '}
            </Text>
            <Link href="/sign-in" asChild>
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Sign in
              </Text>
            </Link>
          </View>
        </View>
      )}
      <View nativeID="clerk-captcha" />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
    borderRadius: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  tagline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: 8,
  },
  bubbleLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: 22,
    right: -72,
    opacity: 0.7,
  },
  bubbleSmall: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    top: 180,
    left: -32,
    opacity: 0.16,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});