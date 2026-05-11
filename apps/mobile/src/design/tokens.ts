import { astroBrand } from '@astronat/core';

export const colors = {
  ...astroBrand.colors,
  textPrimary: astroBrand.colors.eggshell,
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  appBorder: 'rgba(255,255,255,0.12)',
  appSurface: '#181818',
  appRaised: '#212121',
  mutedSurface: 'rgba(255,255,255,0.055)',
  blackSoft: '#0F0F0F',
};

export const fonts = {
  body: 'GaretBook',
  bodyHeavy: 'GaretHeavy',
  display: 'PerfectlyNineties',
  accent: 'Monigue',
  script: 'PinyonScript',
  mono: 'GaretHeavy',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  pageX: 40,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  asymmetric: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 8,
  },
  cut: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 18,
  },
};

export const appNavItems = [
  { href: '/dashboard', label: 'Home' },
  { href: '/chart', label: 'My Chart' },
  { href: '/readings', label: 'Readings' },
  { href: '/reading/new', label: 'New Reading' },
  { href: '/profile', label: 'Profile' },
] as const;

export function titleForPath(pathname: string) {
  if (pathname.startsWith('/chart')) return 'ASTRO-NAT | CHART ANALYSIS';
  if (pathname.startsWith('/readings')) return 'ASTRO-NAT | READINGS';
  if (pathname.startsWith('/reading/new')) return 'ASTRO-NAT | NEW READING';
  if (pathname.startsWith('/reading/')) return 'ASTRO-NAT | READING';
  if (pathname.startsWith('/learn')) return 'ASTRO-NAT | LEARN';
  if (pathname.startsWith('/couples')) return 'ASTRO-NAT | COUPLES';
  if (pathname.startsWith('/mundane')) return 'ASTRO-NAT | MUNDANE';
  if (pathname.startsWith('/profile')) return 'ASTRO-NAT | PROFILE';
  return 'ASTRO-NAT';
}
