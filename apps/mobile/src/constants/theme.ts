/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';
import { astroBrand } from '@astronat/core/brand';

export const Colors = {
  light: {
    text: astroBrand.colors.charcoal,
    background: astroBrand.colors.eggshell,
    backgroundElement: astroBrand.colors.cream,
    backgroundSelected: '#E6DFCF',
    textSecondary: '#555555',
    accent: astroBrand.colors.y2kBlue,
    border: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    text: astroBrand.colors.eggshell,
    background: astroBrand.colors.charcoal,
    backgroundElement: astroBrand.colors.surface,
    backgroundSelected: astroBrand.colors.raised,
    textSecondary: '#CCCCCC',
    accent: astroBrand.colors.y2kBlue,
    border: astroBrand.colors.border,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'GaretBook',
    serif: 'PerfectlyNineties',
    rounded: 'GaretBook',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'GaretBook',
    serif: 'PerfectlyNineties',
    rounded: 'GaretBook',
    mono: 'monospace',
  },
  web: {
    sans: 'GaretBook',
    serif: 'PerfectlyNineties',
    rounded: 'GaretBook',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
