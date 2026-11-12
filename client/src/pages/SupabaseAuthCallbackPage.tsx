import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { getSupabaseAuthCode, getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";
import { normalizeKenyanMobilePhone } from "@/lib/kenyan-phone";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type CallbackState = "working" | "success" | "error";
export default function SupabaseAuthCallbackPage() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<CallbackState>("working");
  const [message, setMessage] = useState("Completing your secure MtaaMarket sign-in…");
  const [phone, setPhone] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const profile = trpc.marketplace.v3AccountProfile.useQuery(undefined, { enabled: hasSession, retry: false });
  const utils = trpc.useUtils();
  const savePhone = trpc.marketplace.updateV3AccountProfile.useMutation({ onSuccess: async () => { await Promise.all([utils.marketplace.v3AccountProfile.invalidate(), utils.marketplace.v3BuyerOrderAccess.invalidate()]); setState("success"); setMessage("Your contact number is saved. You are signed in with buyer access."); }, onError: error => { setState("error"); setMessage(error.message || "That number could not be saved. Try another Kenyan mobile number."); } });
  useEffect(() => {
    let active = true;
    void (async () => {
      if (!isSupabaseBrowserConfigured) { if (active) { setState("error"); setMessage("MtaaMarket sign-in is not configured yet. Please return to the market and try later."); } return; }
      try {
        const client = getSupabaseBrowserClient();
        const code = getSupabaseAuthCode(window.location.search);
        window.history.replaceState({}, document.title, "/auth/callback");
        const result = code ? await client.auth.exchangeCodeForSession(code) : await client.auth.getSession();
        if (!active) return;
        if (result.error || !result.data.session) { setState("error"); setMessage("We could not complete sign-in. Return to MtaaMarket and try a fresh sign-in."); return; }
        setHasSession(true); setState("working"); setMessage("Checking your private contact details…");
      } catch {
        if (active) { setState("error"); setMessage("We could not complete sign-in. Return to MtaaMarket and try a fresh sign-in."); }
      }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!hasSession || profile.isLoading) return;
    if (profile.isError || !profile.data) {
      setState("error");
      setMessage("We could not load your private account details. Retry before continuing.");
      return;
    }
    if (profile.data.phoneNumber) { setState("success"); setMessage("You are signed in. Your buyer profile is ready."); }
    else { setState("working"); setMessage("Add a Kenyan contact number to complete account setup. This is not SMS verification or a login credential."); }
  }, [hasSession, profile.data, profile.isLoading, profile.isError]);
  const needsPhone = hasSession && !profile.isLoading && !profile.isError && Boolean(profile.data) && !profile.data.phoneNumber;
  const retryProfileCheck = async () => { setState("working"); setMessage("Checking your private contact details…"); await profile.refetch(); };
  return <MarketplaceLayout><div className="mx-auto flex min-h-[55vh] max-w-xl items-center px-4 py-12"><section className="w-full rounded-3xl border border-border bg-card p-8 text-center shadow-sm"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-muted">{state === "working" ? <Loader2 className="animate-spin" /> : state === "success" ? <CheckCircle2 className="text-emerald-700" /> : <CircleAlert className="text-amber-700" />}</div><p className="eyebrow">Siaya Mtaa Market secure sign-in</p><h1 className="mt-2 text-3xl font-semibold">{needsPhone ? "Complete your profile" : state === "working" ? "Signing you in" : state === "success" ? "Sign-in complete" : "Sign-in needs attention"}</h1><p className="mt-4 text-muted-foreground" role="status">{message}</p>{needsPhone && <form className="mt-6 space-y-3 text-left" onSubmit={event => { event.preventDefault(); const normalized = normalizeKenyanMobilePhone(phone); if (!normalized) { setState("error"); setMessage("Enter a valid Kenyan mobile number, such as 0712345678."); return; } setState("working"); setMessage("Saving your contact number…"); savePhone.mutate({ phone: normalized }); }}><label className="block text-sm font-medium">Kenyan mobile number<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" type="tel" required inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="0712345678" /></label><p className="text-xs text-muted-foreground">Private contact detail for account and order needs. It is not verified by SMS.</p><button className="primary-cta w-full justify-center" disabled={savePhone.isPending}>{savePhone.isPending ? "Saving…" : "Save contact number"}</button></form>}{hasSession && profile.isError && <button className="primary-cta mt-7" type="button" onClick={() => void retryProfileCheck()}>Retry account check</button>}{state === "success" && <button className="primary-cta mt-7" type="button" onClick={() => setLocation("/")}>Continue to Siaya Mtaa Market</button>}{!hasSession && state === "error" && <button className="primary-cta mt-7" type="button" onClick={() => setLocation("/")}>Return to Siaya Mtaa Market</button>}</section></div></MarketplaceLayout>;
}
