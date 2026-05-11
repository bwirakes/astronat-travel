import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import type { ImageSourcePropType } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/design/tokens';

export type ExploreButtonKind =
  | 'lifeGoals'
  | 'couples'
  | 'myChart'
  | 'worldCharts'
  | 'transits'
  | 'skyWeather'
  | 'learn';

export type ExploreButtonConfig = {
  href: Href;
  kind: ExploreButtonKind;
  source?: ImageSourcePropType;
};

export function ExploreButton({ href, kind, source }: ExploreButtonConfig) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
        <View style={[styles.card, variantCard[kind]]}>
          {source ? <Image source={source} style={styles.photo} contentFit="cover" /> : null}
          <View style={[styles.overlay, variantOverlay[kind]]} />
          {renderExploreContent(kind)}
        </View>
      </Pressable>
    </Link>
  );
}

function renderExploreContent(kind: ExploreButtonKind) {
  switch (kind) {
    case 'lifeGoals':
      return (
        <>
          <View style={styles.lifeGoalsCopy}>
            <Text style={styles.lifeGoalsMain}>Life Goals</Text>
            <Text style={styles.lifeGoalsSub}>
              Deserve all of the <Text style={styles.amazing}>amazing</Text> things.
            </Text>
          </View>
          <Text style={styles.sunMark}>☉</Text>
        </>
      );
    case 'couples':
      return (
        <View style={styles.couplesGroup}>
          <Text style={styles.couplesScript}>Cosmic</Text>
          <Text style={styles.couplesLead}>Together</Text>
          <Text style={styles.couplesMain}>Couple</Text>
        </View>
      );
    case 'myChart':
      return (
        <View style={styles.chartGroup}>
          <Text style={styles.stars}>✦  ✦  ✦</Text>
          <Text style={styles.chartGuide}>Your Guide</Text>
          <View style={styles.chartTitle}>
            <Text style={styles.chartScript}>My</Text>
            <Text style={styles.chartMain}>Chart</Text>
          </View>
        </View>
      );
    case 'worldCharts':
      return (
        <View style={styles.worldGroup}>
          <Text style={styles.worldMundane}>Mundane</Text>
          <Text style={styles.worldAstrology}>Astrology</Text>
        </View>
      );
    case 'transits':
      return (
        <View style={styles.transitsGroup}>
          <Text style={styles.transitsKicker}>Current Astro Weather</Text>
          <Text style={styles.transitsMain}>Transits</Text>
          <Text style={styles.transitsSub}>What does the universe have planned for you right now?</Text>
        </View>
      );
    case 'skyWeather':
      return (
        <>
          <Text style={styles.skyKicker}>Dates to Watch · Any Place</Text>
          <View style={styles.skyStack}>
            <Text style={styles.skyLead}>Sky</Text>
            <Text style={styles.skyScript}>weather</Text>
          </View>
          <Text style={styles.skySigils}>☉ ☽ ☿ ♀ ♂ ♃ ♄ ♅ ♆ ♇</Text>
        </>
      );
    case 'learn':
      return (
        <>
          <View style={styles.learnHeader}>
            <Text style={styles.learnPill}>Hub</Text>
          </View>
          <View style={styles.learnGroup}>
            <Text style={styles.learnScript}>Discover</Text>
            <Text style={styles.learnMain}>Learn</Text>
          </View>
        </>
      );
  }
}

const variantCard = StyleSheet.create({
  lifeGoals: {
    alignItems: 'flex-start',
    backgroundColor: colors.acqua,
    justifyContent: 'space-between',
  },
  couples: {
    alignItems: 'center',
    backgroundColor: colors.y2kBlue,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  myChart: {
    alignItems: 'center',
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  worldCharts: {
    alignItems: 'center',
    backgroundColor: colors.spicedLife,
    justifyContent: 'center',
  },
  transits: {
    alignItems: 'flex-start',
    backgroundColor: colors.charcoal,
    justifyContent: 'flex-start',
  },
  skyWeather: {
    alignItems: 'flex-start',
    backgroundColor: '#F1EFE7',
    justifyContent: 'space-between',
  },
  learn: {
    alignItems: 'center',
    backgroundColor: colors.eggshell,
    justifyContent: 'space-between',
  },
});

const variantOverlay = StyleSheet.create({
  lifeGoals: { backgroundColor: 'rgba(202,241,240,0.76)' },
  couples: { backgroundColor: 'rgba(4,86,251,0.86)' },
  myChart: { backgroundColor: 'rgba(0,0,0,0.72)' },
  worldCharts: { backgroundColor: 'rgba(230,122,122,0.9)' },
  transits: { backgroundColor: 'rgba(27,27,27,0.78)' },
  skyWeather: { backgroundColor: 'rgba(241,239,231,0.92)' },
  learn: { backgroundColor: 'rgba(248,245,236,0.76)' },
});

const styles = StyleSheet.create({
  wrap: {
    minHeight: 180,
  },
  card: {
    flex: 1,
    minHeight: 180,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
    ...radius.asymmetric,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  pressed: {
    opacity: 0.76,
  },
  lifeGoalsCopy: {
    maxWidth: '92%',
    zIndex: 2,
  },
  lifeGoalsMain: {
    color: colors.charcoal,
    fontFamily: fonts.bodyHeavy,
    fontSize: 48,
    letterSpacing: 0,
    lineHeight: 43,
    textTransform: 'uppercase',
  },
  lifeGoalsSub: {
    color: 'rgba(27,27,27,0.86)',
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  amazing: {
    color: colors.y2kBlue,
    fontFamily: fonts.script,
    fontSize: 28,
  },
  sunMark: {
    color: colors.y2kBlue,
    fontFamily: fonts.body,
    fontSize: 36,
    lineHeight: 38,
    zIndex: 2,
  },
  couplesGroup: {
    alignItems: 'center',
    zIndex: 2,
  },
  couplesScript: {
    color: colors.acqua,
    fontFamily: fonts.script,
    fontSize: 66,
    lineHeight: 45,
    transform: [{ rotate: '-4deg' }],
  },
  couplesLead: {
    color: colors.eggshell,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3.2,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  couplesMain: {
    color: colors.eggshell,
    fontFamily: fonts.bodyHeavy,
    fontSize: 44,
    letterSpacing: 0,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  chartGroup: {
    alignItems: 'center',
    zIndex: 2,
  },
  stars: {
    color: colors.acqua,
    fontFamily: fonts.bodyHeavy,
    fontSize: 18,
    letterSpacing: 5,
    lineHeight: 22,
  },
  chartGuide: {
    color: 'rgba(248,245,236,0.9)',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  chartTitle: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  chartScript: {
    color: colors.acqua,
    fontFamily: fonts.script,
    fontSize: 68,
    lineHeight: 46,
    marginRight: 28,
  },
  chartMain: {
    color: colors.eggshell,
    fontFamily: fonts.bodyHeavy,
    fontSize: 50,
    letterSpacing: 0,
    lineHeight: 47,
    textTransform: 'uppercase',
  },
  worldGroup: {
    alignItems: 'center',
    zIndex: 2,
  },
  worldMundane: {
    color: colors.charcoal,
    fontFamily: fonts.bodyHeavy,
    fontSize: 43,
    letterSpacing: 0,
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  worldAstrology: {
    color: colors.eggshell,
    fontFamily: fonts.accent,
    fontSize: 43,
    lineHeight: 32,
    marginLeft: 62,
    marginTop: 5,
  },
  transitsGroup: {
    gap: spacing.xs,
    maxWidth: '95%',
    zIndex: 2,
  },
  transitsKicker: {
    color: colors.y2kBlue,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  transitsMain: {
    color: colors.eggshell,
    fontFamily: fonts.bodyHeavy,
    fontSize: 48,
    letterSpacing: 0,
    lineHeight: 45,
    textTransform: 'uppercase',
  },
  transitsSub: {
    color: 'rgba(248,245,236,0.86)',
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  skyKicker: {
    color: colors.y2kBlue,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    lineHeight: 13,
    textTransform: 'uppercase',
    zIndex: 2,
  },
  skyStack: {
    alignItems: 'flex-start',
    zIndex: 2,
  },
  skyLead: {
    color: colors.charcoal,
    fontFamily: fonts.bodyHeavy,
    fontSize: 54,
    letterSpacing: 0,
    lineHeight: 48,
    textTransform: 'uppercase',
  },
  skyScript: {
    color: colors.y2kBlue,
    fontFamily: fonts.script,
    fontSize: 64,
    lineHeight: 42,
    marginLeft: 24,
    marginTop: -8,
    transform: [{ rotate: '-3deg' }],
  },
  skySigils: {
    alignSelf: 'flex-end',
    color: 'rgba(27,27,27,0.58)',
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 24,
    zIndex: 2,
  },
  learnHeader: {
    alignItems: 'flex-end',
    width: '100%',
    zIndex: 2,
  },
  learnPill: {
    borderColor: colors.charcoal,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.charcoal,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1.6,
    lineHeight: 13,
    paddingHorizontal: 13,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  learnGroup: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    zIndex: 2,
  },
  learnScript: {
    color: colors.y2kBlue,
    fontFamily: fonts.script,
    fontSize: 62,
    lineHeight: 42,
    marginRight: 34,
    transform: [{ rotate: '-5deg' }],
  },
  learnMain: {
    color: colors.charcoal,
    fontFamily: fonts.accent,
    fontSize: 54,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
});
