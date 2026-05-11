import { PinyonScript_400Regular } from '@expo-google-fonts/pinyon-script';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { AuthProvider } from '@/data/auth';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GaretBook: require('../../assets/fonts/Garet-Book-300.ttf'),
    GaretHeavy: require('../../assets/fonts/Garet-Heavy-850.ttf'),
    PerfectlyNineties: require('../../assets/fonts/Perfectly-Nineties-Regular.otf'),
    Monigue: require('../../assets/fonts/MoniguedemoRegular-gwlL1.otf'),
    PinyonScript: PinyonScript_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
