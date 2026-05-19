"use client";

import { useEffect, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  identifyAnalyticsUser,
  resetAnalytics,
} from "@/lib/analytics/client";

function userProperties(user: User) {
  return {
    email: user.email ?? undefined,
    auth_provider: user.app_metadata?.provider ?? undefined,
    onboarded: user.user_metadata?.onboarded === true,
    created_at: user.created_at,
  };
}

export function AnalyticsIdentity() {
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const syncUser = (user: User | null) => {
      if (!mounted) return;

      if (!user) {
        if (identifiedUserId.current) {
          identifiedUserId.current = null;
          resetAnalytics();
        }
        return;
      }

      identifiedUserId.current = user.id;
      identifyAnalyticsUser(user.id, userProperties(user));
    };

    supabase.auth.getUser().then(({ data }) => syncUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
