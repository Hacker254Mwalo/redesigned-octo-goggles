import { getSupabaseBrowserClient, isSupabaseBrowserConfigured, SUPABASE_ACCESS_TOKEN_KEY } from "@/lib/supabase-browser";
import { trpc } from "@/lib/trpc";
import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SupabaseAuthState = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  requestMagicLink: (email: string) => Promise<void>;
  requestEmailCode: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, token: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
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
  trpc.auth.supabaseSession.useQuery(undefined, {
    enabled: Boolean(session?.access_token),
    retry: false,
    refetchOnWindowFocus: false,
  });

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
      const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    },
    async requestEmailCode(email) {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({ email });
      if (error) throw error;
    },
    async verifyEmailCode(email, token) {
      const { data, error } = await getSupabaseBrowserClient().auth.verifyOtp({ email, token, type: "email" });
      if (error || !data.session) throw error || new Error("MtaaMarket could not verify this code.");
      mirrorAccessToken(data.session);
      setSession(data.session);
    },
    async signInWithGoogle() {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    },
    async signUpWithPassword(email, password) {
      const { error } = await getSupabaseBrowserClient().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    },
    async signInWithPassword(email, password) {
      const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({ email, password });
      if (error || !data.session) throw error || new Error("MtaaMarket could not start a session.");
      mirrorAccessToken(data.session);
      setSession(data.session);
    },
    async requestPasswordReset(email) {
      const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    },
    async updatePassword(password) {
      const { data, error } = await getSupabaseBrowserClient().auth.updateUser({ password });
      if (error || !data.user) throw error || new Error("MtaaMarket could not update the password.");
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
