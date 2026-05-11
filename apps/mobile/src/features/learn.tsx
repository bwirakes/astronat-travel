import { StyleSheet, Text, View } from 'react-native';

import { astronatAssets } from '@/design/assets';
import { AssetImage, AppScreen, BodyCopy, DisplayTitle, MonoLabel, SectionHeader } from '@/design/primitives';
import { colors, fonts, radius, spacing } from '@/design/tokens';

const lessons = [
  {
    title: 'Natal Chart',
    body: 'Angles, houses, planets, and the chart structure behind every reading.',
    source: astronatAssets.learn.zodiac,
  },
  {
    title: 'Houses',
    body: 'The twelve rooms of a chart, from private foundations to public weather.',
    source: astronatAssets.learn.houses,
  },
  {
    title: 'Aspects',
    body: 'The geometry that turns placements into tension, ease, and momentum.',
    source: astronatAssets.learn.aspects,
  },
];

export function LearnScreen() {
  return (
    <AppScreen>
      <View style={styles.hero}>
        <AssetImage source={astronatAssets.explore.learn} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroCopy}>
          <MonoLabel color={colors.charcoal}>Hub</MonoLabel>
          <DisplayTitle size="md" style={styles.heroTitle}>
            Discover Learn
          </DisplayTitle>
          <BodyCopy muted>Astrology lessons written against the same chart language used in your readings.</BodyCopy>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Start Here" />
        <View style={styles.lessonList}>
          {lessons.map((lesson) => (
            <View key={lesson.title} style={styles.lesson}>
              <AssetImage source={lesson.source} style={styles.lessonImage} contentFit="cover" />
              <View style={styles.lessonCopy}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonBody}>{lesson.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.eggshell,
    minHeight: 300,
    overflow: 'hidden',
    position: 'relative',
    ...radius.asymmetric,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,245,236,0.78)',
  },
  heroCopy: {
    gap: spacing.sm,
    padding: spacing.lg,
    position: 'relative',
  },
  heroTitle: {
    color: colors.charcoal,
  },
  section: {
    gap: spacing.md,
  },
  lessonList: {
    gap: spacing.sm,
  },
  lesson: {
    alignItems: 'center',
    backgroundColor: colors.appSurface,
    borderColor: colors.appBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  lessonImage: {
    borderRadius: radius.xs,
    height: 74,
    width: 86,
  },
  lessonCopy: {
    flex: 1,
    gap: 4,
  },
  lessonTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 30,
  },
  lessonBody: {
    color: colors.textTertiary,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
});
