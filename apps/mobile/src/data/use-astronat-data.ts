import { useEffect, useState } from 'react';

import { fetchMobileBootstrap } from '@/lib/api';
import { demoData, type NativeAppData } from '@/data/demo';
import { useAuth } from '@/data/auth';

type BootstrapResponse = {
  profile?: {
    first_name?: string | null;
    birth_date?: string | null;
    birth_time?: string | null;
    birth_city?: string | null;
  } | null;
  access?: NativeAppData['access'];
  readings?: {
    id: string;
    destination: string;
    score: number | null;
    kind: NativeAppData['readings'][number]['kind'];
    createdAt: string;
  }[];
};

export function useAstronatData() {
  const [data, setData] = useState<NativeAppData>(demoData);
  const [status, setStatus] = useState<'demo' | 'loading' | 'api' | 'error'>('demo');
  const { session } = useAuth();

  useEffect(() => {
    const accessToken = session?.access_token || process.env.EXPO_PUBLIC_ACCESS_TOKEN || process.env.EXPO_PUBLIC_DEMO_ACCESS_TOKEN || '';

    if (!accessToken) {
      setStatus('demo');
      setData(demoData);
      return;
    }

    let active = true;
    setStatus('loading');

    fetchMobileBootstrap(accessToken)
      .then((payload: BootstrapResponse) => {
        if (!active) return;
        setData((current) => ({
          ...current,
          profile: {
            ...current.profile,
            firstName: payload.profile?.first_name || current.profile.firstName,
            birthDate: payload.profile?.birth_date || current.profile.birthDate,
            birthTime: payload.profile?.birth_time || current.profile.birthTime,
            birthCity: payload.profile?.birth_city || current.profile.birthCity,
          },
          access: payload.access || current.access,
          readings:
            payload.readings?.map((reading) => ({
              ...reading,
              meta: `${reading.kind} reading - ${formatDate(reading.createdAt)}`,
            })) || current.readings,
        }));
        setStatus('api');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [session?.access_token]);

  return { data, status };
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
