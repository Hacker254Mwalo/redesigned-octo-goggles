import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { getSupabaseAuthCode, getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type CallbackState = "working" | "success" | "error";

export default function SupabaseAuthCallbackPage() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<CallbackState>("working");
  const [message, setMessage] = useState("Completing your secure MtaaMarket sign-in…");

  useEffect(() => {
    let active = true;
    const complete = async () => {
      if (!isSupabaseBrowserConfigured) {
        if (active) { setState("error"); setMessage("MtaaMarket email sign-in is not configured yet. Please return to the market and try later."); }
        return;
      }
      const client = getSupabaseBrowserClient();
      const code = getSupabaseAuthCode(window.location.search);
      const result = code ? await client.auth.exchangeCodeForSession(code) : await client.auth.getSession();
      const session = code ? result.data.session : result.data.session;
      const error = result.error;
      window.history.replaceState({}, document.title, "/auth/callback");
      if (!active) return;
      if (error || !session) {
        setState("error");
        setMessage("We could not complete this sign-in link. Request a new link from MtaaMarket and open the newest email in this same browser.");
        return;
      }
      setState("success");
      setMessage("You are signed in with email. MtaaMarket is preparing your buyer profile; orders, payments, seller actions, and owner access remain unavailable for now.");
    };
    void complete();
    return () => { active = false; };
  }, []);

  return <MarketplaceLayout><div className="mx-auto flex min-h-[55vh] max-w-xl items-center px-4 py-12"><section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-muted">{state === "working" ? <Loader2 className="animate-spin" /> : state === "success" ? <CheckCircle2 className="text-emerald-700" /> : <CircleAlert className="text-amber-700" />}</div><p className="eyebrow">MtaaMarket email sign-in</p><h1 className="mt-2 text-3xl font-semibold">{state === "working" ? "Signing you in" : state === "success" ? "Sign-in complete" : "Link needs attention"}</h1><p className="mt-4 text-muted-foreground">{message}</p><button className="primary-cta mt-7" onClick={() => setLocation("/")}>{state === "success" ? "Continue to MtaaMarket" : "Return to MtaaMarket"}</button></section></div></MarketplaceLayout>;
}
