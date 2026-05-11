import type { ImageSourcePropType } from 'react-native';

export const astronatAssets = {
  logoStacked: require('../../assets/astronat/logo-stacked-transparent.png') as ImageSourcePropType,
  logoStackedDark: require('../../assets/astronat/logo-stacked-dark.png') as ImageSourcePropType,
  saturnStars: require('../../assets/astronat/saturn-o-stars.png') as ImageSourcePropType,
  saturn: require('../../assets/astronat/saturn-o.png') as ImageSourcePropType,
  couplesHero: require('../../assets/astronat/couples_flow_hero.png') as ImageSourcePropType,
  dashboardMobile: require('../../assets/astronat/dashboard-mobile.png') as ImageSourcePropType,
  mobileChart: require('../../assets/astronat/mobile-chart.png') as ImageSourcePropType,
  explore: {
    chart: require('../../assets/astronat/explore/retro_moon.png') as ImageSourcePropType,
    couples: require('../../assets/astronat/explore/couples_retro.png') as ImageSourcePropType,
    mundane: require('../../assets/astronat/explore/world_charts_retro.png') as ImageSourcePropType,
    weather: require('../../assets/astronat/explore/transits_retro_generated.png') as ImageSourcePropType,
    learn: require('../../assets/astronat/explore/learn_retro_generated.png') as ImageSourcePropType,
    goals: require('../../assets/astronat/explore/life_goals_retro.png') as ImageSourcePropType,
  },
  learn: {
    zodiac: require('../../assets/astronat/learn-bg/zodiac.png') as ImageSourcePropType,
    houses: require('../../assets/astronat/learn-bg/houses.png') as ImageSourcePropType,
    aspects: require('../../assets/astronat/learn-bg/aspects.png') as ImageSourcePropType,
  },
} as const;
