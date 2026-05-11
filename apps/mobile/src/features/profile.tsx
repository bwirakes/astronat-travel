import { StyleSheet, Text, View } from 'react-native';

import { useAstronatData } from '@/data/use-astronat-data';
import { colors, fonts, spacing } from '@/design/tokens';
import { ActionButton, AppScreen, AstronatCard, DisplayTitle, MonoLabel, SectionHeader } from '@/design/primitives';

export function ProfileScreen() {
  const { data, status } = useAstronatData();
  const { profile, access } = data;

  return (
    <AppScreen>
      <View style={styles.hero}>
        <MonoLabel>Profile</MonoLabel>
        <DisplayTitle>Your Profile</DisplayTitle>
        <Text style={styles.deck}>
          The birth record is the source for every chart, reading, and timing layer.
        </Text>
      </View>

      <AstronatCard tone="eggshell" style={styles.identityCard}>
        <Text style={styles.avatar}>{profile.firstName.slice(0, 1)}</Text>
        <View style={styles.identityCopy}>
          <Text style={styles.identityName}>{profile.firstName}</Text>
          <Text style={styles.identityMeta}>
            {profile.birthDate} - {profile.birthCity}, {profile.birthCountry}
          </Text>
        </View>
      </AstronatCard>

      <View style={styles.section}>
        <SectionHeader title="Birth Data" />
        <InfoRow label="Date" value={profile.birthDate} />
        <InfoRow label="Time" value={profile.birthTime} />
        <InfoRow label="Place" value={`${profile.birthCity}, ${profile.birthCountry}`} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Access" />
        <InfoRow label="Source" value={status === 'api' ? 'Authenticated API' : 'Local preview'} />
        <InfoRow label="Readings" value={`${access.readingsTotal}`} />
        <InfoRow label="Status" value={access.canRead ? 'Reading available' : 'Subscription active'} />
      </View>

      <ActionButton href="/flow" variant="outline">
        Update birth record
      </ActionButton>
    </AppScreen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  deck: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 30,
  },
  identityCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  avatar: {
    backgroundColor: colors.y2kBlue,
    borderRadius: 999,
    color: colors.eggshell,
    fontFamily: fonts.display,
    fontSize: 54,
    height: 78,
    lineHeight: 78,
    textAlign: 'center',
    width: 78,
  },
  identityCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  identityName: {
    color: colors.charcoal,
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 40,
  },
  identityMeta: {
    color: '#5a554b',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  section: {
    gap: spacing.sm,
  },
  infoRow: {
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  infoLabel: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 27,
    textAlign: 'right',
  },
});
