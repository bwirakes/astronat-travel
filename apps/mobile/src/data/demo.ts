import { astronatAssets } from '@/design/assets';

export type NativeReading = {
  id: string;
  destination: string;
  score: number | null;
  kind: 'travel' | 'relocation' | 'couples' | 'weather';
  createdAt: string;
  meta: string;
};

export type NativeProfile = {
  firstName: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthCountry: string;
  ascendant: string;
  sun: string;
  moon: string;
};

export type NativeAppData = {
  profile: NativeProfile;
  access: {
    hasSubscription: boolean;
    freeUsed: boolean;
    canRead: boolean;
    readingsTotal: number;
  };
  readings: NativeReading[];
  chartEssence: string[];
};

export const demoData: NativeAppData = {
  profile: {
    firstName: 'Brandon',
    birthDate: '1988-08-17',
    birthTime: '12:00',
    birthCity: 'Jakarta, Java',
    birthCountry: 'Indonesia',
    ascendant: 'Taurus',
    sun: 'Leo',
    moon: 'Libra',
  },
  access: {
    hasSubscription: false,
    freeUsed: false,
    canRead: true,
    readingsTotal: 3,
  },
  readings: [
    {
      id: 'sample-london',
      destination: 'London',
      score: 82,
      kind: 'travel',
      createdAt: '2026-05-10',
      meta: 'Travel reading - high energy',
    },
    {
      id: 'sample-tokyo',
      destination: 'Tokyo',
      score: 68,
      kind: 'relocation',
      createdAt: '2026-05-04',
      meta: 'Relocation reading - balanced',
    },
    {
      id: 'sample-jakarta',
      destination: 'Jakarta',
      score: 74,
      kind: 'weather',
      createdAt: '2026-04-28',
      meta: 'Sky weather - dates to watch',
    },
  ],
  chartEssence: [
    'You move through the world with a quiet, grounded persistence that makes others wonder what you are really thinking. With Taurus rising, the sign that governs how you initiate your presence, you project a calm, deliberate aura that refuses to be rushed.',
    'Your Sun in Leo in the 4th house anchors your pride in your private sanctuary. Meanwhile, your Moon in Libra seeks beauty, proportion, and a kind of social grace that makes even difficult conversations feel designed.',
  ],
};

export const exploreCards = [
  {
    href: '/chart',
    kind: 'myChart',
    source: astronatAssets.explore.chart,
  },
  {
    href: '/couples',
    kind: 'couples',
    source: astronatAssets.explore.couples,
  },
  {
    href: '/mundane',
    kind: 'worldCharts',
    source: astronatAssets.explore.mundane,
  },
  {
    href: '/reading/new?type=weather',
    kind: 'skyWeather',
  },
  {
    href: '/learn',
    kind: 'learn',
    source: astronatAssets.explore.learn,
  },
] as const;
