import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { astroBrand } from '@astronat/core';

import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

const palette = Colors.dark;

export function ScreenShell({ children }: PropsWithChildren) {
  return <View style={styles.screen}>{children}</View>;
}

export function EditorialHeader({
  kicker,
  title,
  deck,
  meta,
}: {
  kicker: string;
  title: string;
  deck?: string;
  meta?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.kickerRow}>
        <ThemedText style={styles.kicker}>{kicker}</ThemedText>
        {meta ? <ThemedText style={styles.headerMeta}>{meta}</ThemedText> : null}
      </View>
      <ThemedText style={styles.displayTitle}>{title}</ThemedText>
      {deck ? <ThemedText style={styles.deck}>{deck}</ThemedText> : null}
    </View>
  );
}

export function SectionRule({
  index,
  title,
  aside,
}: {
  index?: string;
  title: string;
  aside?: string;
}) {
  return (
    <View style={styles.sectionRule}>
      <View style={styles.sectionTitleRow}>
        {index ? <ThemedText style={styles.index}>{index}</ThemedText> : null}
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      </View>
      {aside ? <ThemedText style={styles.sectionAside}>{aside}</ThemedText> : null}
    </View>
  );
}

export function AstroPill({
  children,
  tone = 'ghost',
}: PropsWithChildren<{ tone?: 'ghost' | 'accent' | 'gold' | 'sage' | 'spiced' }>) {
  return (
    <View style={[styles.pill, pillTone[tone]]}>
      <ThemedText style={[styles.pillText, tone === 'accent' && styles.pillAccentText]}>
        {children}
      </ThemedText>
    </View>
  );
}

export function AstroCard({
  children,
  tone = 'surface',
  style,
}: PropsWithChildren<{ tone?: 'surface' | 'blue' | 'eggshell' | 'outline'; style?: ViewStyle }>) {
  return <View style={[styles.card, cardTone[tone], style]}>{children}</View>;
}

export function ActionButton({
  children,
  tone = 'primary',
  ...props
}: PropsWithChildren<PressableProps & { tone?: 'primary' | 'eggshell' }>) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.action,
        tone === 'eggshell' ? styles.actionEggshell : styles.actionPrimary,
        pressed && styles.pressed,
      ]}>
      <ThemedText style={[styles.actionText, tone === 'eggshell' && styles.actionEggshellText]}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

export function MetricStrip({ items }: { items: { label: string; value: string; tone?: string }[] }) {
  return (
    <View style={styles.metricStrip}>
      {items.map((item) => (
        <View key={item.label} style={styles.metric}>
          <ThemedText style={styles.metricValue}>{item.value}</ThemedText>
          <ThemedText style={styles.metricLabel}>{item.label}</ThemedText>
        </View>
      ))}
    </View>
  );
}

export function RowItem({
  label,
  title,
  value,
  right,
}: {
  label?: string;
  title: string;
  value?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.rowItem}>
      <View style={styles.rowCopy}>
        {label ? <ThemedText style={styles.rowLabel}>{label}</ThemedText> : null}
        <ThemedText style={styles.rowTitle}>{title}</ThemedText>
        {value ? <ThemedText style={styles.rowValue}>{value}</ThemedText> : null}
      </View>
      {right}
    </View>
  );
}

const cutRadius: ViewStyle = {
  borderTopLeftRadius: 4,
  borderTopRightRadius: 18,
  borderBottomRightRadius: 4,
  borderBottomLeftRadius: 18,
};

const cardTone = StyleSheet.create({
  surface: {
    backgroundColor: palette.backgroundElement,
    borderColor: palette.border,
  },
  blue: {
    backgroundColor: astroBrand.colors.y2kBlue,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  eggshell: {
    backgroundColor: astroBrand.colors.eggshell,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: palette.border,
  },
});

const pillTone = StyleSheet.create({
  ghost: {
    borderColor: palette.border,
  },
  accent: {
    backgroundColor: astroBrand.colors.y2kBlue,
    borderColor: astroBrand.colors.y2kBlue,
  },
  gold: {
    borderColor: astroBrand.colors.gold,
  },
  sage: {
    borderColor: astroBrand.colors.sage,
  },
  spiced: {
    borderColor: astroBrand.colors.spicedLife,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.five,
  },
  kickerRow: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  kicker: {
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  headerMeta: {
    color: astroBrand.colors.acqua,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  displayTitle: {
    color: palette.text,
    fontFamily: 'PerfectlyNineties',
    fontSize: 56,
    lineHeight: 50,
    textTransform: 'uppercase',
  },
  deck: {
    color: palette.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  sectionRule: {
    alignItems: 'flex-end',
    borderBottomColor: palette.text,
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  index: {
    color: astroBrand.colors.spicedLife,
    fontFamily: 'Monigue',
    fontSize: 20,
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: 'PerfectlyNineties',
    fontSize: 28,
    lineHeight: 28,
    textTransform: 'uppercase',
  },
  sectionAside: {
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    ...cutRadius,
  },
  pillText: {
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  pillAccentText: {
    color: astroBrand.colors.eggshell,
  },
  card: {
    borderWidth: 1,
    padding: Spacing.three,
    ...cutRadius,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    ...cutRadius,
  },
  actionPrimary: {
    backgroundColor: astroBrand.colors.y2kBlue,
  },
  actionEggshell: {
    backgroundColor: astroBrand.colors.eggshell,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  actionEggshellText: {
    color: astroBrand.colors.charcoal,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ translateY: 1 }],
  },
  metricStrip: {
    borderColor: palette.border,
    borderWidth: 1,
    flexDirection: 'row',
    ...cutRadius,
  },
  metric: {
    flex: 1,
    gap: 2,
    padding: Spacing.three,
  },
  metricValue: {
    color: palette.text,
    fontFamily: 'PerfectlyNineties',
    fontSize: 30,
    lineHeight: 30,
  },
  metricLabel: {
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rowItem: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    color: astroBrand.colors.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  rowTitle: {
    color: palette.text,
    fontFamily: 'PerfectlyNineties',
    fontSize: 26,
    lineHeight: 28,
    textTransform: 'uppercase',
  },
  rowValue: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
