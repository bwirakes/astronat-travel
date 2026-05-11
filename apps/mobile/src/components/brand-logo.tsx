import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { astronatAssets } from '@/design/assets';

export function BrandLogo({
  mode = 'dark',
  size = 'sm',
}: {
  mode?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Image
      source={mode === 'dark' ? astronatAssets.logoStackedDark : astronatAssets.logoStacked}
      style={logoSize[size]}
      contentFit="contain"
    />
  );
}

const logoSize = StyleSheet.create({
  sm: {
    height: 58,
    width: 76,
  },
  md: {
    height: 78,
    width: 104,
  },
  lg: {
    height: 104,
    width: 140,
  },
});
