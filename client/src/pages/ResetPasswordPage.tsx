import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { ACCOUNT_MIN_PASSWORD_LENGTH, accountActionErrorMessage, validateMtaaMarketPassword } from "@/lib/auth-account";
import { getSupabaseAuthCode, getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase-browser";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function ResetPasswordPage() {
  const { session, updatePassword } = useSupabaseAuth();
  const [status, setStatus] = useState<"checking" | "ready" | "error" | "complete">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const prepareRecovery = async () => {
      if (!isSupabaseBrowserConfigured) return active && setStatus("error");
      try {
        const code = getSupabaseAuthCode(window.location.search);
        if (code) {
          const { error } = await getSupabaseBrowserClient().auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, document.title, "/auth/reset-password");
        }
        const { data } = await getSupabaseBrowserClient().auth.getSession();
        if (!active) return;
        setStatus(data.session || session ? "ready" : "error");
      } catch {
        if (active) setStatus("error");
      }
    };
    void prepareRecovery();
    return () => { active = false; };
  }, [session]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const issue = validateMtaaMarketPassword(password);
    if (issue) return setNotice(issue);
    if (password !== confirmation) return setNotice("The two passwords do not match.");
    setSubmitting(true); setNotice("");
    try {
      await updatePassword(password);
      setStatus("complete");
    } catch {
      setNotice(accountActionErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  return <MarketplaceLayout><section className="mx-auto max-w-xl px-4 py-16 sm:py-24"><div className="rounded-3xl border border-[#17372f] bg-[#fbfaf7] p-8 text-center shadow-sm"><p className="eyebrow">MtaaMarket account recovery</p>{status === "checking" && <><Loader2 className="mx-auto mt-6 animate-spin text-[#0e2f27]" /><h1 className="mt-5 font-serif text-4xl">Checking your recovery link</h1></>}{status === "error" && <><KeyRound className="mx-auto mt-6 text-[#c9634e]" /><h1 className="mt-5 font-serif text-4xl">Link needs attention</h1><p className="mx-auto mt-4 max-w-md text-muted-foreground">Request a new password recovery email and open only its newest link. For safety, old or already-used links cannot set a password.</p><Link href="/" className="primary-cta mx-auto mt-6 inline-flex">Return to MtaaMarket</Link></>}{status === "ready" && <><h1 className="mt-5 font-serif text-4xl">Choose a new password</h1><p className="mx-auto mt-4 max-w-md text-muted-foreground">Use at least 8 characters with a letter and a number. Do not reuse a password from another service.</p><form onSubmit={submit} className="mx-auto mt-7 max-w-sm text-left"><label className="block text-sm font-medium">New password<input className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-3" required type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label><label className="mt-4 block text-sm font-medium">Confirm new password<input className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-3" required type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>{notice && <p className="mt-4 rounded-xl bg-muted p-3 text-sm" role="status">{notice}</p>}<button className="primary-cta mt-6 w-full justify-center" disabled={submitting}>{submitting ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}{submitting ? "Updating password…" : "Save new password"}</button></form></>}{status === "complete" && <><CheckCircle2 className="mx-auto mt-6 text-[#0e7c5a]" /><h1 className="mt-5 font-serif text-4xl">Password updated</h1><p className="mx-auto mt-4 max-w-md text-muted-foreground">You can now continue to MtaaMarket. Protected marketplace actions remain unavailable until the separate role migration is complete.</p><Link href="/" className="primary-cta mx-auto mt-6 inline-flex">Continue to MtaaMarket</Link></>}</div></section></MarketplaceLayout>;
}
