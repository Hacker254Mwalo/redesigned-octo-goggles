import { getSupabaseBrowserClient, isSupabaseBrowserConfigured, SUPABASE_ACCESS_TOKEN_KEY } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SupabaseAuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  requestMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthState | null>(null);

function mirrorAccessToken(session: Session | null) {
  try {
    if (session?.access_token) sessionStorage.setItem(SUPABASE_ACCESS_TOKEN_KEY, session.access_token);
    else sessionStorage.removeItem(SUPABASE_ACCESS_TOKEN_KEY);
  } catch {
    // Session storage is optional; the Supabase client still retains its own browser session.
  }
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseBrowserConfigured);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured) return;
    const client = getSupabaseBrowserClient();
    client.auth.getSession().then(({ data }) => { setSession(data.session); mirrorAccessToken(data.session); }).finally(() => setLoading(false));
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); mirrorAccessToken(nextSession); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<SupabaseAuthState>(() => ({
    configured: isSupabaseBrowserConfigured,
    loading,
    session,
    async requestMagicLink(email) {
      const redirectTo = `${window.location.origin}/`;
      const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) throw error;
    },
    async signOut() {
      if (isSupabaseBrowserConfigured) await getSupabaseBrowserClient().auth.signOut();
      mirrorAccessToken(null);
    },
  }), [loading, session]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const value = useContext(SupabaseAuthContext);
  if (!value) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider.");
  return value;
}
