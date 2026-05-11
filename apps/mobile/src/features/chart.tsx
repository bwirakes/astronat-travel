import { StyleSheet, Text, View } from 'react-native';

import { useAstronatData } from '@/data/use-astronat-data';
import { colors, fonts, spacing } from '@/design/tokens';
import {
  AppScreen,
  AstronatCard,
  BodyCopy,
  DisplayTitle,
  IdentityStrip,
  MonoLabel,
  SectionHeader,
} from '@/design/primitives';

const planetPlacements = [
  { planet: 'Sun', sign: 'Leo', house: '4th house', note: 'Pride gathers around home, privacy, and inner security.' },
  { planet: 'Moon', sign: 'Libra', house: '6th house', note: 'Emotional balance comes through rhythm, refinement, and useful beauty.' },
  { planet: 'Venus', sign: 'Cancer', house: '3rd house', note: 'Your influence travels through warmth, memory, and careful language.' },
  { planet: 'Mars', sign: 'Aries', house: '12th house', note: 'Drive sharpens in solitude before it becomes visible action.' },
];

const aspects = [
  { title: 'Working For You', accent: colors.sage, body: 'Supportive geometry gives the chart social grace and creative timing.' },
  { title: 'Pushing You', accent: colors.spicedLife, body: 'The sharper angles ask for patience before turning instinct into action.' },
];

export function ChartScreen() {
  const { data } = useAstronatData();
  const { profile, chartEssence } = data;

  return (
    <AppScreen>
      <View style={styles.hero}>
        <MonoLabel>Natal Chart</MonoLabel>
        <DisplayTitle>{profile.firstName}&apos;s Chart</DisplayTitle>
        <Text style={styles.meta}>
          {profile.birthDate} - {profile.birthCity}, {profile.birthCountry}
        </Text>
      </View>

      <IdentityStrip
        items={[
          { label: 'Ascendant', value: profile.ascendant },
          { label: 'Sun', value: profile.sun, glyph: '☉', color: colors.gold },
          { label: 'Moon', value: profile.moon, glyph: '☾', color: colors.eggshell },
        ]}
      />

      <View style={styles.prose}>
        {chartEssence.map((paragraph) => (
          <BodyCopy key={paragraph}>{paragraph}</BodyCopy>
        ))}
      </View>

      <View style={styles.wheelSection}>
        <SectionHeader title="Natal Wheel" />
        <NatalWheelPanel />
        <Text style={styles.wheelCaption}>Select a planet to explore</Text>
      </View>

      <View style={styles.lowerSections}>
        <View style={styles.section}>
          <SectionHeader index="01" title="The Architecture" />
          <View style={styles.architectureGrid}>
            <ArchitectureColumn
              title="Area of Power"
              label="H4 - Home and inner security"
              body="The chart draws strength from private foundations, memory, and the spaces where identity can recover."
              accent={colors.sage}
            />
            <ArchitectureColumn
              title="Area of Growth"
              label="H10 - Visibility and vocation"
              body="Growth comes from making private confidence legible in public without turning the self into performance."
              accent={colors.gold}
            />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            index="02"
            title="Where each planet lands"
            sub="Same planets, sorted by the rooms they occupy in your chart."
          />
          <View style={styles.placementList}>
            {planetPlacements.map((placement) => (
              <AstronatCard key={placement.planet} tone="surface" style={styles.placementCard}>
                <View style={styles.placementHeader}>
                  <Text style={styles.placementPlanet}>{placement.planet}</Text>
                  <Text style={styles.placementHouse}>{placement.house}</Text>
                </View>
                <Text style={styles.placementSign}>{placement.sign}</Text>
                <Text style={styles.placementNote}>{placement.note}</Text>
              </AstronatCard>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader index="03" title="Aspect Geometry" />
          <View style={styles.aspectGrid}>
            {aspects.map((aspect) => (
              <View key={aspect.title} style={[styles.aspectColumn, { borderLeftColor: aspect.accent }]}>
                <Text style={styles.aspectTitle}>{aspect.title}</Text>
                <Text style={styles.aspectBody}>{aspect.body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader index="04" title="Natal Geography" />
          <AstronatCard tone="outline" style={styles.geoCard}>
            <Text style={styles.geoTitle}>{profile.birthCity}</Text>
            <Text style={styles.geoBody}>
              The birth place anchors the angular map. In the native app this panel becomes the gateway into the same geographic reading model used on web.
            </Text>
          </AstronatCard>
        </View>
      </View>
    </AppScreen>
  );
}

function NatalWheelPanel() {
  return (
    <View style={styles.wheelPanel}>
      <View style={styles.outerWheel}>
        <View style={styles.middleWheel}>
          <View style={styles.innerWheel}>
            <Text style={styles.wheelMark}>NATAL</Text>
            <Text style={styles.wheelSubmark}>WHEEL</Text>
          </View>
        </View>
        <Text style={[styles.planetMark, styles.markTop]}>Sun</Text>
        <Text style={[styles.planetMark, styles.markRight]}>Moon</Text>
        <Text style={[styles.planetMark, styles.markBottom]}>Venus</Text>
        <Text style={[styles.planetMark, styles.markLeft]}>ASC</Text>
      </View>
    </View>
  );
}

function ArchitectureColumn({
  title,
  label,
  body,
  accent,
}: {
  title: string;
  label: string;
  body: string;
  accent: string;
}) {
  return (
    <View style={[styles.architectureColumn, { borderLeftColor: accent }]}>
      <Text style={styles.architectureTitle}>{title}</Text>
      <Text style={[styles.architectureLabel, { color: accent }]}>{label}</Text>
      <Text style={styles.architectureBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  meta: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 18,
    letterSpacing: 6,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  prose: {
    gap: spacing.lg,
  },
  wheelSection: {
    gap: spacing.md,
  },
  wheelPanel: {
    borderColor: colors.appBorder,
    borderWidth: 1,
    padding: spacing.lg,
  },
  outerWheel: {
    alignItems: 'center',
    aspectRatio: 1,
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 1.5,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  middleWheel: {
    alignItems: 'center',
    borderColor: colors.appBorder,
    borderRadius: 999,
    borderWidth: 1,
    height: '73%',
    justifyContent: 'center',
    width: '73%',
  },
  innerWheel: {
    alignItems: 'center',
    borderColor: 'rgba(202,241,240,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    height: '58%',
    justifyContent: 'center',
    width: '58%',
  },
  wheelMark: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
  },
  wheelSubmark: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
  },
  planetMark: {
    color: colors.acqua,
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    position: 'absolute',
    textTransform: 'uppercase',
  },
  markTop: { top: 18 },
  markRight: { right: 18 },
  markBottom: { bottom: 18 },
  markLeft: { left: 18 },
  wheelCaption: {
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  lowerSections: {
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  architectureGrid: {
    gap: spacing.lg,
  },
  architectureColumn: {
    borderLeftWidth: 2,
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  architectureTitle: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 32,
    paddingBottom: spacing.xs,
  },
  architectureLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  architectureBody: {
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 28,
  },
  placementList: {
    gap: spacing.sm,
  },
  placementCard: {
    gap: spacing.md,
  },
  placementHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  placementPlanet: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 27,
  },
  placementHouse: {
    color: colors.gold,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  placementSign: {
    backgroundColor: colors.mutedSurface,
    color: colors.textPrimary,
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 1.2,
    padding: spacing.sm,
    textTransform: 'uppercase',
  },
  placementNote: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 24,
  },
  aspectGrid: {
    gap: spacing.lg,
  },
  aspectColumn: {
    borderLeftWidth: 2,
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  aspectTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 27,
  },
  aspectBody: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 25,
  },
  geoCard: {
    gap: spacing.sm,
  },
  geoTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 32,
  },
  geoBody: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 25,
  },
});
