import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { astronatAssets } from '@/design/assets';
import { ActionButton, AppTextInput, DisplayTitle, MonoLabel, StandaloneScreen } from '@/design/primitives';
import { colors, fonts, spacing } from '@/design/tokens';

const steps = ['Sign Up', 'Birth', 'Aha'];

export function FlowScreen() {
  const [step, setStep] = useState(0);

  return (
    <StandaloneScreen>
      <View style={styles.header}>
        <BrandLogo size="md" />
        <View style={styles.progress}>
          {steps.map((item, index) => (
            <View key={item} style={[styles.progressPip, index <= step && styles.progressPipActive]} />
          ))}
        </View>
        <Text style={styles.counter}>
          {String(step + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.heroWrap}>
          <View style={styles.heroImage}>
            <Image source={astronatAssets.couplesHero} style={styles.heroPhoto} contentFit="cover" />
          </View>
          <Text style={[styles.planetGlyph, styles.venus]}>♀</Text>
          <Text style={[styles.planetGlyph, styles.mars]}>♂</Text>
        </View>

        <View style={styles.card}>
          {step === 0 ? <SignupStep /> : null}
          {step === 1 ? <BirthStep /> : null}
          {step === 2 ? <AhaStep /> : null}

          <View style={styles.controls}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((current) => Math.max(0, current - 1))} style={styles.backButton}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <ActionButton
              onPress={() => {
                if (step >= steps.length - 1) router.push('/dashboard');
                else setStep((current) => current + 1);
              }}
              variant="light">
              {step >= steps.length - 1 ? 'Finish' : 'Continue'}
            </ActionButton>
          </View>
        </View>
      </View>
    </StandaloneScreen>
  );
}

function SignupStep() {
  return (
    <View style={styles.step}>
      <DisplayTitle size="md">
        Where should you <Text style={styles.scriptWord}>travel</Text> next?
      </DisplayTitle>
      <Text style={styles.stepBody}>
        Your natal chart projected across the globe. Discover where to go — and when.
      </Text>
      <Pressable style={styles.googleButton}>
        <Text style={styles.googleG}>G</Text>
        <Text style={styles.googleText}>Continue with Google</Text>
      </Pressable>
      <View style={styles.emailRow}>
        <AppTextInput placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" style={styles.emailInput} />
        <ActionButton variant="primary">Send Link</ActionButton>
      </View>
    </View>
  );
}

function BirthStep() {
  return (
    <View style={styles.step}>
      <MonoLabel color={colors.acqua}>Birth Data</MonoLabel>
      <DisplayTitle size="md">The chart starts with time and place.</DisplayTitle>
      <AppTextInput placeholder="First name" />
      <AppTextInput placeholder="Birth date" />
      <AppTextInput placeholder="Birth city" />
    </View>
  );
}

function AhaStep() {
  return (
    <View style={styles.step}>
      <MonoLabel color={colors.acqua}>Aha</MonoLabel>
      <DisplayTitle size="md">Your map is ready.</DisplayTitle>
      <Text style={styles.stepBody}>
        The dashboard opens with your chart, recent readings, and the next destination question.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 108,
    paddingHorizontal: spacing.lg,
  },
  progress: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  progressPip: {
    backgroundColor: colors.appBorder,
    borderRadius: 999,
    height: 4,
    width: 10,
  },
  progressPipActive: {
    backgroundColor: colors.eggshell,
    width: 28,
  },
  counter: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  body: {
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    padding: spacing.md,
  },
  heroWrap: {
    alignItems: 'center',
    minHeight: 260,
    position: 'relative',
  },
  heroImage: {
    height: 228,
    overflow: 'hidden',
    width: '82%',
  },
  heroPhoto: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 38,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 160,
  },
  planetGlyph: {
    color: colors.y2kBlue,
    fontFamily: fonts.body,
    fontSize: 46,
    position: 'absolute',
  },
  venus: {
    left: 20,
    top: 92,
  },
  mars: {
    right: 24,
    top: 160,
  },
  card: {
    gap: spacing.xl,
  },
  step: {
    gap: spacing.lg,
  },
  scriptWord: {
    color: colors.gold,
    fontFamily: fonts.accent,
    fontSize: 44,
    lineHeight: 42,
  },
  stepBody: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 30,
  },
  googleButton: {
    alignItems: 'center',
    borderColor: colors.appBorder,
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
  },
  googleG: {
    color: colors.y2kBlue,
    fontFamily: fonts.bodyHeavy,
    fontSize: 18,
  },
  googleText: {
    color: colors.textPrimary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 15,
  },
  emailRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emailInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 18,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: spacing.md,
  },
  backText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
