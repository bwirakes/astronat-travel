import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  message: string;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signInWithOtp: (email: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInAsTestUser: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return false;
    }

    return true;
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return false;
    }

    setMessage('Check your email for the sign-in link.');
    return true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setMessage('');
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return false;
    }

    return true;
  }, []);

  const signInAsTestUser = useCallback(async () => {
    return signInWithPassword('test@astronat.local', 'astronat-test-2026');
  }, [signInWithPassword]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      message,
      signInWithPassword,
      signInWithOtp,
      signInWithGoogle,
      signInAsTestUser,
      signOut,
    }),
    [loading, message, session, signInAsTestUser, signInWithGoogle, signInWithOtp, signInWithPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
