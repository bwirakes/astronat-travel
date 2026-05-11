import type { PropsWithChildren } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/design/tokens';

export function AppScreen({
  children,
  contentStyle,
}: PropsWithChildren<{ contentStyle?: ViewStyle | ViewStyle[] }>) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.screenContent, contentStyle]}>
      {children}
    </ScrollView>
  );
}

export function StandaloneScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.standalone}>
      {children}
    </SafeAreaView>
  );
}

export function MonoLabel({ children, color = colors.textTertiary }: PropsWithChildren<{ color?: string }>) {
  return <Text style={[styles.monoLabel, { color }]}>{children}</Text>;
}

export function DisplayTitle({
  children,
  size = 'lg',
  style,
}: PropsWithChildren<{ size?: 'sm' | 'md' | 'lg'; style?: StyleProp<TextStyle> }>) {
  return <Text style={[styles.displayTitle, displaySize[size], style]}>{children}</Text>;
}

export function BodyCopy({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.bodyCopy, muted && styles.bodyMuted]}>{children}</Text>;
}

export function SectionHeader({
  index,
  title,
  sub,
}: {
  index?: string;
  title: string;
  sub?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {index ? <Text style={styles.sectionIndex}>{index}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

export function AstroPill({
  children,
  variant = 'ghost',
}: PropsWithChildren<{ variant?: 'ghost' | 'accent' | 'gold' | 'sage' | 'spiced' }>) {
  return (
    <View style={[styles.pill, pillStyles[variant]]}>
      <Text style={[styles.pillText, variant === 'accent' && styles.pillAccentText]}>{children}</Text>
    </View>
  );
}

export function AstronatCard({
  children,
  tone = 'surface',
  style,
}: PropsWithChildren<{ tone?: 'surface' | 'eggshell' | 'blue' | 'outline'; style?: ViewStyle | ViewStyle[] }>) {
  return <View style={[styles.card, cardTones[tone], style]}>{children}</View>;
}

export function ActionButton({
  children,
  href,
  onPress,
  variant = 'primary',
}: PropsWithChildren<{ href?: Href; onPress?: () => void; variant?: 'primary' | 'light' | 'outline' }>) {
  const content = (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, actionStyles[variant], pressed && styles.pressed]}>
      <Text style={[styles.actionText, variant === 'light' && styles.actionTextDark]}>{children}</Text>
    </Pressable>
  );

  if (!href) return content;
  return (
    <Link href={href} asChild>
      {content}
    </Link>
  );
}

export function AppTextInput(props: TextInputProps) {
  return <TextInput placeholderTextColor="rgba(248,245,236,0.35)" {...props} style={[styles.input, props.style]} />;
}

export function IdentityStrip({
  items,
}: {
  items: { label: string; value: string; glyph?: string; color?: string }[];
}) {
  return (
    <View style={styles.identityStrip}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.identityItem, index > 0 && styles.identityBorder]}>
          <Text style={styles.identityLabel}>{item.label}</Text>
          <View style={styles.identityValueRow}>
            <Text style={styles.identityValue}>{item.value}</Text>
            {item.glyph ? <Text style={[styles.identityGlyph, { color: item.color ?? colors.gold }]}>{item.glyph}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function ScoreRing({ score, label }: { score: number | null; label?: string }) {
  return (
    <View style={styles.scoreRing}>
      <View style={styles.scoreRingInner}>
        <Text style={styles.scoreValue}>{score ?? '--'}</Text>
        {label ? <Text style={styles.scoreLabel}>{label}</Text> : null}
      </View>
    </View>
  );
}

export function ReadingRow({
  destination,
  meta,
  score,
  href,
}: {
  destination: string;
  meta: string;
  score: number | null;
  href: Href;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.readingRow, pressed && styles.pressed]}>
        <View style={styles.readingLeft}>
          <ScoreRing score={score} />
          <View style={styles.readingCopy}>
            <Text style={styles.readingTitle}>{destination}</Text>
            <Text style={styles.readingMeta}>{meta}</Text>
          </View>
        </View>
        <Text style={styles.rowArrow}>View</Text>
      </Pressable>
    </Link>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.stateBox}>
      <MonoLabel>{label}</MonoLabel>
      <Text style={styles.stateTitle}>Loading</Text>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
    </View>
  );
}

export function AssetImage({
  source,
  style,
  contentFit = 'contain',
}: {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'contain' | 'cover';
}) {
  return <Image source={source} style={style} contentFit={contentFit} />;
}

const displaySize = StyleSheet.create({
  sm: { fontSize: 34, lineHeight: 36 },
  md: { fontSize: 46, lineHeight: 48 },
  lg: { fontSize: 58, lineHeight: 60 },
});

const pillStyles = StyleSheet.create({
  ghost: { borderColor: colors.appBorder },
  accent: { backgroundColor: colors.y2kBlue, borderColor: colors.y2kBlue },
  gold: { borderColor: colors.gold },
  sage: { borderColor: colors.sage },
  spiced: { borderColor: colors.spicedLife },
});

const cardTones = StyleSheet.create({
  surface: { backgroundColor: colors.appSurface, borderColor: colors.appBorder },
  eggshell: { backgroundColor: colors.eggshell, borderColor: 'rgba(0,0,0,0.08)' },
  blue: { backgroundColor: colors.y2kBlue, borderColor: 'rgba(255,255,255,0.2)' },
  outline: { backgroundColor: 'transparent', borderColor: colors.appBorder },
});

const actionStyles = StyleSheet.create({
  primary: { backgroundColor: colors.y2kBlue, borderColor: colors.y2kBlue },
  light: { backgroundColor: colors.eggshell, borderColor: colors.eggshell },
  outline: { backgroundColor: 'transparent', borderColor: colors.appBorder },
});

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.charcoal,
    flex: 1,
  },
  screenContent: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.xl,
  },
  standalone: {
    backgroundColor: colors.charcoal,
    flex: 1,
  },
  monoLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 5,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  displayTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontWeight: '400',
    letterSpacing: 0,
  },
  bodyCopy: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 21,
    fontWeight: '300',
    lineHeight: 37,
  },
  bodyMuted: {
    color: colors.textSecondary,
  },
  sectionHeader: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionIndex: {
    color: colors.gold,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 31,
    lineHeight: 34,
  },
  sectionSub: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  pillAccentText: {
    color: colors.eggshell,
  },
  card: {
    borderWidth: 1,
    padding: spacing.lg,
    ...radius.asymmetric,
  },
  action: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  actionText: {
    color: colors.eggshell,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  actionTextDark: {
    color: colors.charcoal,
  },
  pressed: {
    opacity: 0.72,
  },
  input: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    paddingVertical: spacing.md,
  },
  identityStrip: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: spacing.lg,
  },
  identityItem: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  identityBorder: {
    borderLeftColor: colors.appBorder,
    borderLeftWidth: 1,
    paddingLeft: spacing.md,
  },
  identityLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  identityValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  identityValue: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
  },
  identityGlyph: {
    fontFamily: fonts.body,
    fontSize: 20,
  },
  scoreRing: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 2,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  scoreRingInner: {
    alignItems: 'center',
    borderColor: 'rgba(201,169,110,0.32)',
    borderRadius: 999,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  scoreValue: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 23,
    lineHeight: 24,
  },
  scoreLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  readingRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
    width: '100%',
  },
  readingLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  readingCopy: {
    flex: 1,
    gap: 4,
  },
  readingTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 28,
  },
  readingMeta: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  rowArrow: {
    color: colors.textSecondary,
    fontFamily: fonts.bodyHeavy,
    fontSize: 12,
    minWidth: 44,
    textAlign: 'right',
  },
  stateBox: {
    alignItems: 'center',
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 32,
  },
  stateBody: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
