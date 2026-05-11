import { StyleSheet, Text, View } from 'react-native';

import { useAstronatData } from '@/data/use-astronat-data';
import { colors, fonts, spacing } from '@/design/tokens';
import { ActionButton, AppScreen, BodyCopy, DisplayTitle, MonoLabel, ReadingRow, SectionHeader } from '@/design/primitives';

export function ReadingsScreen() {
  const { data } = useAstronatData();

  return (
    <AppScreen>
      <View style={styles.hero}>
        <MonoLabel>Readings</MonoLabel>
        <DisplayTitle>Your Readings</DisplayTitle>
        <BodyCopy muted>
          Every destination report lives here, organized by place, score, and sky condition.
        </BodyCopy>
      </View>

      <View style={styles.list}>
        {data.readings.map((reading) => (
          <ReadingRow
            key={reading.id}
            destination={reading.destination}
            meta={reading.meta}
            score={reading.score}
            href={`/reading/${reading.id}`}
          />
        ))}
      </View>

      <View style={styles.footerCard}>
        <SectionHeader title="Create a new report" />
        <Text style={styles.footerText}>
          Compare your natal chart against a new city, date, and intention.
        </Text>
        <ActionButton href="/reading/new" variant="light">
          New reading
        </ActionButton>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  footerCard: {
    backgroundColor: colors.y2kBlue,
    gap: spacing.md,
    padding: spacing.lg,
  },
  footerText: {
    color: 'rgba(248,245,236,0.82)',
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
  },
});
