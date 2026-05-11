import { Redirect, Slot, router, usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { useAuth } from '@/data/auth';
import { appNavItems, colors, fonts, spacing, titleForPath } from '@/design/tokens';

export function AppChrome() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { loading, session, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <BrandLogo />
        <Text style={styles.loadingText}>Loading Astronat</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/dashboard')} style={styles.logoButton}>
            <BrandLogo />
          </Pressable>

          <Text numberOfLines={1} style={styles.title}>
            {titleForPath(pathname)}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open navigation"
            onPress={() => setMenuOpen(true)}
            style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.slot}>
        <Slot />
      </View>

      {menuOpen ? (
        <View style={styles.menuLayer}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <SafeAreaView edges={['top', 'bottom']} style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <BrandLogo mode="light" />
              <Pressable onPress={() => setMenuOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.drawerNav}>
              {appNavItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Pressable
                    key={item.href}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push(item.href);
                    }}
                    style={[styles.drawerItem, active && styles.drawerItemActive]}>
                    <Text style={[styles.drawerItemText, active && styles.drawerItemTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={async () => {
                  setMenuOpen(false);
                  await signOut();
                  router.replace('/login');
                }}
                style={styles.drawerItem}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.charcoal,
    flex: 1,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSafe: {
    backgroundColor: colors.charcoal,
    borderBottomColor: colors.appBorder,
    borderBottomWidth: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 82,
    paddingHorizontal: spacing.lg,
  },
  logoButton: {
    alignItems: 'flex-start',
    height: 56,
    justifyContent: 'center',
    width: 58,
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
  },
  menuButton: {
    alignItems: 'flex-end',
    gap: 7,
    justifyContent: 'center',
    minHeight: 56,
    width: 58,
  },
  menuLine: {
    backgroundColor: colors.eggshell,
    borderRadius: 999,
    height: 4,
    width: 35,
  },
  slot: {
    flex: 1,
  },
  menuLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  drawer: {
    alignSelf: 'flex-end',
    backgroundColor: colors.eggshell,
    borderLeftColor: 'rgba(0,0,0,0.16)',
    borderLeftWidth: 1,
    flex: 1,
    maxWidth: 340,
    paddingHorizontal: spacing.lg,
    width: '82%',
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  closeButton: {
    borderColor: colors.charcoal,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  closeText: {
    color: colors.charcoal,
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  drawerNav: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  drawerItem: {
    borderBottomColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  drawerItemActive: {
    borderBottomColor: colors.y2kBlue,
  },
  drawerItemText: {
    color: colors.charcoal,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 38,
  },
  drawerItemTextActive: {
    color: colors.y2kBlue,
  },
  signOutText: {
    color: colors.spicedLife,
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
