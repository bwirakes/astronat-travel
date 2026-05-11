import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExploreButton } from '@/components/explore-buttons';
import { exploreCards } from '@/data/demo';
import { useAstronatData } from '@/data/use-astronat-data';
import { colors, fonts, spacing } from '@/design/tokens';
import {
  ActionButton,
  AppScreen,
  AstroPill,
  MonoLabel,
  ReadingRow,
  SectionHeader,
} from '@/design/primitives';

export function DashboardScreen() {
  const { data } = useAstronatData();
  const { profile, access, readings } = data;

  return (
    <View style={styles.root}>
      <AppScreen contentStyle={styles.screenContent}>
        <View style={styles.hero}>
          <View style={styles.pillRow}>
            <AstroPill variant="ghost">{profile.sun} Sun</AstroPill>
            <AstroPill variant={access.canRead ? 'gold' : 'ghost'}>
              {access.canRead ? 'Reading available' : 'Access active'}
            </AstroPill>
          </View>
          <Text style={styles.greeting}>
            Hello, <Text style={styles.name}>{profile.firstName}</Text>
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.section}>
            <MonoLabel>Explore</MonoLabel>
            <View style={styles.exploreGrid}>
              {exploreCards.map((card) => (
                <ExploreButton key={card.href} {...card} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader title="Your Readings" />
            <View style={styles.readingList}>
              {readings.slice(0, 3).map((reading) => (
                <ReadingRow
                  key={reading.id}
                  destination={reading.destination}
                  meta={reading.meta}
                  score={reading.score}
                  href={`/reading/${reading.id}`}
                />
              ))}
            </View>
            <ActionButton href="/readings" variant="outline">
              View all readings
            </ActionButton>
          </View>
        </View>
      </AppScreen>

      <Link href="/reading/new" asChild>
        <Pressable style={({ pressed }) => [styles.floatingAction, pressed && styles.pressed]}>
          <Text style={styles.floatingPlus}>+</Text>
          <Text style={styles.floatingText}>New Reading</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.charcoal,
    flex: 1,
  },
  screenContent: {
    paddingBottom: 136,
  },
  hero: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  greeting: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 58,
    letterSpacing: 0,
    lineHeight: 62,
  },
  name: {
    color: colors.y2kBlue,
  },
  grid: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  exploreGrid: {
    gap: spacing.md,
  },
  readingList: {
    gap: spacing.sm,
  },
  floatingAction: {
    alignItems: 'center',
    backgroundColor: colors.y2kBlue,
    borderColor: 'rgba(248,245,236,0.34)',
    borderWidth: 1,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: spacing.md,
    shadowColor: '#000',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    ...{
      borderTopLeftRadius: 26,
      borderTopRightRadius: 6,
      borderBottomRightRadius: 26,
      borderBottomLeftRadius: 6,
    },
  },
  pressed: {
    opacity: 0.76,
  },
  floatingPlus: {
    color: colors.eggshell,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    marginTop: -2,
  },
  floatingText: {
    color: colors.eggshell,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
