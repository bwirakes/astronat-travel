import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAstronatData } from '@/data/use-astronat-data';
import { colors, fonts, spacing } from '@/design/tokens';
import { AppScreen, BodyCopy, DisplayTitle, MonoLabel, ScoreRing, SectionHeader } from '@/design/primitives';

export function ReadingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useAstronatData();
  const reading = data.readings.find((item) => item.id === id) ?? data.readings[0];

  return (
    <AppScreen>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <MonoLabel>{reading.kind} Reading</MonoLabel>
            <DisplayTitle>{reading.destination}</DisplayTitle>
            <Text style={styles.meta}>{reading.meta}</Text>
          </View>
          <ScoreRing score={reading.score} label="Score" />
        </View>
      </View>

      <View style={styles.report}>
        <SectionHeader index="01" title="Overview" />
        <BodyCopy>
          This place brings your chart into a more visible register. The strongest signal is not simply whether it is easy, but where it asks you to become more deliberate.
        </BodyCopy>
      </View>

      <View style={styles.report}>
        <SectionHeader index="02" title="What Shifts" />
        <Text style={styles.reportBody}>
          The angular emphasis sharpens public movement while keeping the private chart intact. Treat this as a field report: useful for timing, intention, and comparison.
        </Text>
      </View>

      <View style={styles.report}>
        <SectionHeader index="03" title="Timing" />
        <Text style={styles.reportBody}>
          Choose dates that give the chart room to breathe. Favor windows with supportive lunar movement and avoid rushing the first day of arrival.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    paddingBottom: spacing.lg,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    gap: spacing.md,
  },
  meta: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  report: {
    gap: spacing.lg,
  },
  reportBody: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 17,
    lineHeight: 30,
  },
});
