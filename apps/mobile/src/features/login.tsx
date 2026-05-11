import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/data/auth';
import { ActionButton, AppTextInput, DisplayTitle, StandaloneScreen } from '@/design/primitives';
import { colors, fonts, spacing } from '@/design/tokens';

export function LoginScreen() {
  const { loading, message, session, signInAsTestUser, signInWithGoogle, signInWithOtp, signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (session) return <Redirect href="/dashboard" />;

  return (
    <StandaloneScreen>
      <View style={styles.screen}>
        <BrandLogo size="sm" />

        <View style={styles.panel}>
          <DisplayTitle size="md">Welcome back.</DisplayTitle>

          <Pressable
            disabled={loading}
            onPress={() => void signInWithGoogle()}
            style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </Pressable>

          <Divider label="or" />

          <Text style={styles.label}>Email</Text>
          <AppTextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="nat@astronat.com"
            value={email}
          />

          <Text style={styles.label}>Password</Text>
          <AppTextInput
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            value={password}
          />

          <ActionButton
            onPress={async () => {
              const ok = await signInWithPassword(email, password);
              if (ok) router.replace('/dashboard');
            }}>
            {loading ? 'Signing in' : 'Sign in'}
          </ActionButton>

          <ActionButton onPress={() => void signInWithOtp(email)} variant="outline">
            Send magic link instead
          </ActionButton>

          <Divider label="dev" />

          <Pressable
            disabled={loading}
            onPress={async () => {
              const ok = await signInAsTestUser();
              if (ok) router.replace('/dashboard');
            }}
            style={({ pressed }) => [styles.testButton, pressed && styles.pressed]}>
            <Text style={styles.testText}>Login as test user</Text>
          </Pressable>

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.signupRow}>
            <Text style={styles.signupCopy}>Don&apos;t have an account?</Text>
            <Pressable onPress={() => router.push('/flow')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </StandaloneScreen>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.lg,
  },
  panel: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.eggshell,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  googleG: {
    color: colors.y2kBlue,
    fontFamily: fonts.bodyHeavy,
    fontSize: 18,
  },
  googleText: {
    color: colors.charcoal,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  dividerLine: {
    backgroundColor: colors.appBorder,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: -spacing.md,
    textTransform: 'uppercase',
  },
  testButton: {
    alignItems: 'center',
    borderColor: colors.y2kBlue,
    borderStyle: 'dashed',
    borderWidth: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  testText: {
    color: colors.y2kBlue,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  message: {
    borderColor: colors.appBorder,
    borderWidth: 1,
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    padding: spacing.md,
    textAlign: 'center',
  },
  signupRow: {
    alignItems: 'center',
    borderTopColor: colors.appBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingTop: spacing.lg,
  },
  signupCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  signupLink: {
    color: colors.y2kBlue,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.72,
  },
});
