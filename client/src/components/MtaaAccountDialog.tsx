import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS, ACCOUNT_MIN_PASSWORD_LENGTH, accountActionErrorMessage, accountEmailCooldownNotice, passwordRecoveryNotice, passwordSignupNotice, validateMtaaMarketPassword } from "@/lib/auth-account";
import { magicLinkDeliveryNotice } from "@/lib/auth-delivery";
import { KeyRound, Loader2, MailCheck, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

type AccountMode = "link" | "password" | "signup" | "recovery";

const modeCopy: Record<AccountMode, { label: string; title: string; description: string }> = {
  link: { label: "Email link", title: "Sign in safely", description: "Recommended: email link is ready now. It signs you in only; it does not create an order, publish a listing, or share your contact details." },
  password: { label: "Password", title: "Password account", description: "Use this only after you create and verify a MtaaMarket password account. Your account remains buyer-only." },
  signup: { label: "Create account", title: "Create a password account", description: "Verify your email before you can sign in with this password. A new account remains buyer-only." },
  recovery: { label: "Recover password", title: "Reset your password", description: "Enter your email. The same confirmation is shown whether or not an account exists." },
};

export function MtaaAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { configured, requestMagicLink, signInWithPassword, signUpWithPassword, requestPasswordReset } = useSupabaseAuth();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [mode, setMode] = useState<AccountMode>("link");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => emailInputRef.current?.focus(), 0);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleEscape);
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const isEmailAction = mode === "link" || mode === "signup" || mode === "recovery";

  const chooseMode = (nextMode: AccountMode) => {
    setMode(nextMode);
    setNotice("");
    setPassword("");
    setConfirmation("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    if (!configured) return setNotice("MtaaMarket account sign-in is not configured yet.");
    if (isEmailAction && cooldownRemaining > 0) return setNotice(accountEmailCooldownNotice(cooldownRemaining));
    if (mode === "signup") {
      const passwordIssue = validateMtaaMarketPassword(password);
      if (passwordIssue) return setNotice(passwordIssue);
      if (password !== confirmation) return setNotice("The two passwords do not match.");
    }
    setSubmitting(true);
    try {
      if (mode === "link") {
        await requestMagicLink(email);
        setNotice(magicLinkDeliveryNotice());
      } else if (mode === "password") {
        await signInWithPassword(email, password);
        onClose();
      } else if (mode === "signup") {
        await signUpWithPassword(email, password);
        setNotice(passwordSignupNotice());
      } else {
        await requestPasswordReset(email);
        setNotice(passwordRecoveryNotice());
      }
      if (isEmailAction) {
        setCooldownUntil(Date.now() + ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS * 1000);
        setNow(Date.now());
      }
    } catch {
      setNotice(accountActionErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  const copy = modeCopy[mode];
  const actionLabel = submitting ? "Please wait…" : cooldownRemaining > 0 && isEmailAction ? `Wait ${cooldownRemaining}s before another email` : mode === "link" ? "Send secure sign-in link" : mode === "password" ? "Sign in with password" : mode === "signup" ? "Create and verify account" : "Send password recovery link";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="mtaamarket-account-title"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">MtaaMarket secure account</p><h2 id="mtaamarket-account-title" className="mt-2 text-2xl font-semibold">{copy.title}</h2></div><button type="button" className="icon-action" onClick={onClose} aria-label="Close account dialog"><X size={18} /></button></div><p className="mt-3 text-sm text-muted-foreground">{copy.description}</p><div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Account method"><button type="button" role="tab" aria-selected={mode === "link"} onClick={() => chooseMode("link")} className={mode === "link" ? "rounded-full bg-[#0e2f27] px-3 py-2 text-sm font-semibold text-white" : "rounded-full border border-border px-3 py-2 text-sm"}>Email link</button><button type="button" role="tab" aria-selected={mode === "password"} onClick={() => chooseMode("password")} className={mode === "password" ? "rounded-full bg-[#0e2f27] px-3 py-2 text-sm font-semibold text-white" : "rounded-full border border-border px-3 py-2 text-sm"}>Email & password</button></div><label className="mt-5 block text-sm font-medium">Email address<input ref={emailInputRef} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>{(mode === "password" || mode === "signup") && <label className="mt-4 block text-sm font-medium">Password<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 8 characters, letters and numbers" : "Your password"} /></label>}{mode === "signup" && <label className="mt-4 block text-sm font-medium">Confirm password<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Type the password again" /></label>}{notice && <p className="mt-4 rounded-lg bg-muted p-3 text-sm" role="status">{notice}</p>}<button className="primary-cta mt-5 w-full justify-center" disabled={submitting || (isEmailAction && cooldownRemaining > 0)}>{submitting ? <Loader2 className="animate-spin" size={17} /> : mode === "password" ? <KeyRound size={17} /> : mode === "signup" ? <ShieldCheck size={17} /> : <MailCheck size={17} />}{actionLabel}</button>{mode === "password" && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm"><button className="underline" type="button" onClick={() => chooseMode("signup")}>Create an account</button><button className="underline" type="button" onClick={() => chooseMode("recovery")}>Forgot password?</button></div>}{mode === "signup" && <button className="mt-4 text-sm underline" type="button" onClick={() => chooseMode("password")}>Already verified? Sign in with password</button>}{mode === "recovery" && <button className="mt-4 text-sm underline" type="button" onClick={() => chooseMode("password")}>Return to password sign-in</button>}<p className="mt-4 text-xs text-muted-foreground">Google sign-in will appear only after the MtaaMarket Google provider is securely configured. Your protected workspace remains unavailable until the separate account and role migration is complete. <Link className="font-medium underline underline-offset-2" href="/privacy">How account data is used</Link></p></form></div>;
}
