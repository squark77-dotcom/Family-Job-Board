import { useSignIn } from '@clerk/expo';
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

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    if (!signIn) return;
    try {
      const { error } = await signIn.password({
        emailAddress,
        password,
      });
      if (error) {
        console.error(JSON.stringify(error, null, 2));
        return;
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            router.push('/');
          },
        });
      } else if (signIn.status === 'needs_client_trust') {
        const emailCodeFactor = signIn.supportedSecondFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );
        if (emailCodeFactor) {
          await signIn.mfa?.sendEmailCode();
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    if (!signIn) return;
    try {
      await signIn.mfa?.verifyEmailCode({ code });
      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: () => {
            router.push('/');
          },
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const isMfa = signIn?.status === 'needs_client_trust';

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
          {isMfa ? 'Verify your account' : 'Welcome back'}
        </Text>
        {!isMfa && (
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Jobs done. Points up. Let&apos;s go.</Text>
        )}
      </View>

      {isMfa ? (
        <View style={styles.form}>
          <Input
            label="Verification code"
            placeholder="Enter your verification code"
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
            onPress={() => signIn?.mfa?.sendEmailCode()}
            style={styles.button}
          />
          <Button
            label="Start over"
            variant="ghost"
            onPress={() => signIn?.reset()}
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
            error={errors?.fields?.identifier?.message}
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
            label="Continue"
            onPress={handleSubmit}
            loading={fetchStatus === 'fetching'}
            disabled={!emailAddress || !password}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
              Don't have an account?{' '}
            </Text>
            <Link href="/sign-up" asChild>
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Sign up
              </Text>
            </Link>
          </View>
        </View>
      )}
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