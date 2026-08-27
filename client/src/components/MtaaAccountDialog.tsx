import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import {
  ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS,
  ACCOUNT_MIN_PASSWORD_LENGTH,
  accountActionErrorMessage,
  accountEmailCooldownNotice,
  passwordRecoveryNotice,
  passwordSignupNotice,
  validateMtaaMarketPassword,
} from "@/lib/auth-account";
import { emailCodeDeliveryNotice } from "@/lib/auth-delivery";
import { CheckCircle2, KeyRound, Loader2, LogOut, MailCheck, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

type AccountMode = "password" | "signup" | "recovery";
type CodeChallenge = "signup" | "recovery" | null;

const modeCopy: Record<AccountMode, { title: string; description: string }> = {
  password: { title: "Sign in to MtaaMarket", description: "Use the email and password for your MtaaMarket account." },
  signup: { title: "Create your account", description: "Create one account with your email and a secure password. We will send a six-digit verification code only for this new account." },
  recovery: { title: "Reset your password", description: "We will send a six-digit code to confirm it is you before you choose a new password." },
};

export function MtaaAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    configured,
    session,
    signUpWithPassword,
    resendSignupVerificationCode,
    verifySignupCode,
    signInWithPassword,
    requestPasswordReset,
    verifyPasswordRecoveryCode,
    signOut,
  } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [mode, setMode] = useState<AccountMode>("password");
  const [challenge, setChallenge] = useState<CodeChallenge>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!cooldownUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => emailInputRef.current?.focus(), 0);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
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

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1_000)) : 0;
  const copy = modeCopy[mode];

  const resetChallenge = () => {
    setChallenge(null);
    setEmailCode("");
    setNotice("");
  };

  const chooseMode = (nextMode: AccountMode) => {
    setMode(nextMode);
    resetChallenge();
    setPassword("");
    setConfirmation("");
  };

  const markEmailSent = (nextChallenge: Exclude<CodeChallenge, null>, nextNotice: string) => {
    setChallenge(nextChallenge);
    setEmailCode("");
    setNotice(nextNotice);
    setCooldownUntil(Date.now() + ACCOUNT_EMAIL_ACTION_COOLDOWN_SECONDS * 1_000);
    setNow(Date.now());
  };

  const resendCode = async () => {
    if (!challenge) return;
    if (cooldownRemaining > 0) {
      setNotice(accountEmailCooldownNotice(cooldownRemaining));
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      if (challenge === "signup") await resendSignupVerificationCode(email);
      else await requestPasswordReset(email);
      markEmailSent(challenge, emailCodeDeliveryNotice(challenge === "signup" ? "account verification" : "password recovery"));
    } catch {
      setNotice(challenge === "recovery" ? passwordRecoveryNotice() : accountActionErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!challenge || !/^\d{6}$/.test(emailCode)) {
      setNotice("Enter the six-digit code from the genuine MtaaMarket email.");
      return;
    }
    setSubmitting(true);
    setNotice("");
    try {
      if (challenge === "signup") await verifySignupCode(email, emailCode);
      else {
        await verifyPasswordRecoveryCode(email, emailCode);
        onClose();
        setLocation("/auth/reset-password");
        return;
      }
      onClose();
    } catch {
      setNotice("That code could not be verified. Check that it is the newest six-digit code, then try again or request another code.");
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!configured) return setNotice("MtaaMarket account sign-in is not configured yet.");
    if (challenge) return verifyCode();

    if (mode === "signup") {
      const passwordIssue = validateMtaaMarketPassword(password);
      if (passwordIssue) return setNotice(passwordIssue);
      if (password !== confirmation) return setNotice("The two passwords do not match.");
    }

    setSubmitting(true);
    setNotice("");
    try {
      if (mode === "password") {
        await signInWithPassword(email, password);
        onClose();
      } else if (mode === "signup") {
        const outcome = await signUpWithPassword(email, password);
        if (outcome.requiresEmailVerification) markEmailSent("signup", passwordSignupNotice());
        else onClose();
      } else {
        await requestPasswordReset(email);
        markEmailSent("recovery", passwordRecoveryNotice());
      }
    } catch {
      setNotice(mode === "recovery" ? passwordRecoveryNotice() : accountActionErrorMessage());
    } finally {
      setSubmitting(false);
    }
  };

  if (session) {
    return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="mtaamarket-account-title"><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">MtaaMarket account</p><h2 id="mtaamarket-account-title" className="mt-2 text-2xl font-semibold">You are signed in</h2></div><button type="button" className="icon-action" onClick={onClose} aria-label="Close account dialog"><X size={18} /></button></div><p className="mt-3 text-sm text-muted-foreground">Your account is ready for browsing and protected buyer actions. Seller access is reviewed separately.</p><div className="mt-5 rounded-xl bg-[#f2f6f1] p-4 text-sm text-[#24463a]"><CheckCircle2 className="mb-2" size={18} />Your email was verified by MtaaMarket. Name and phone details are requested only for a protected hub-pickup request; one Kenyan contact number can be linked to one buyer account.</div><button className="secondary-cta mt-5 w-full justify-center" type="button" onClick={() => void signOut().then(onClose)}><LogOut size={17} />Sign out securely</button><Link href="/privacy" className="mt-4 block text-center text-xs font-medium underline underline-offset-2">How account data is used</Link></section></div>;
  }

  const actionLabel = submitting ? "Please wait…" : challenge ? "Verify code & continue" : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s before another email` : mode === "password" ? "Sign in" : mode === "signup" ? "Create account & send code" : "Send recovery code";
  const challengeTitle = challenge === "signup" ? "Verify your new account" : "Verify your recovery code";

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="mtaamarket-account-title"><form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">MtaaMarket account</p><h2 id="mtaamarket-account-title" className="mt-2 text-2xl font-semibold">{challenge ? challengeTitle : copy.title}</h2></div><button type="button" className="icon-action" onClick={onClose} aria-label="Close account dialog"><X size={18} /></button></div><p className="mt-3 text-sm text-muted-foreground">{challenge ? "Enter the code only here. Never share it with a vendor, support contact, or anyone else." : copy.description}</p><label className="mt-5 block text-sm font-medium">Email address<input ref={emailInputRef} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="email" autoComplete="email" value={email} disabled={Boolean(challenge)} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>{challenge && <><label className="mt-4 block text-sm font-medium">Six-digit code<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 tracking-[0.3em]" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={event => setEmailCode(event.target.value.replace(/\D/g, ""))} placeholder="123456" /></label><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm"><button type="button" className="underline" disabled={submitting || cooldownRemaining > 0} onClick={() => void resendCode()}>{cooldownRemaining > 0 ? `Resend available in ${cooldownRemaining}s` : "Send another code"}</button><button type="button" className="underline" disabled={submitting} onClick={() => { resetChallenge(); setCooldownUntil(null); }}>Use a different email</button></div></>}{!challenge && (mode === "password" || mode === "signup") && <label className="mt-4 block text-sm font-medium">Password<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 8 characters, letters and numbers" : "Your password"} /></label>}{!challenge && mode === "signup" && <label className="mt-4 block text-sm font-medium">Confirm password<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Type the password again" /></label>}{notice && <p className="mt-4 rounded-lg bg-muted p-3 text-sm" role="status">{notice}</p>}<button className="primary-cta mt-5 w-full justify-center" disabled={submitting || (!challenge && cooldownRemaining > 0)}>{submitting ? <Loader2 className="animate-spin" size={17} /> : challenge ? <MailCheck size={17} /> : mode === "password" ? <KeyRound size={17} /> : <ShieldCheck size={17} />}{actionLabel}</button>{!challenge && mode === "password" && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm"><button className="underline" type="button" onClick={() => chooseMode("signup")}>Create an account</button><button className="underline" type="button" onClick={() => chooseMode("recovery")}>Forgot password?</button></div>}{!challenge && mode === "signup" && <><button className="mt-4 text-sm underline" type="button" onClick={() => chooseMode("password")}>Already have an account? Sign in</button><p className="mt-3 text-xs text-muted-foreground">Use your own email for one MtaaMarket account. You can browse without a phone number; a Kenyan contact is requested only for a protected hub-pickup request and can be linked to one buyer account.</p></>}{!challenge && mode === "recovery" && <button className="mt-4 text-sm underline" type="button" onClick={() => chooseMode("password")}>Return to sign in</button>}{(challenge || mode !== "password") && <p className="mt-4 text-xs text-muted-foreground">Check Spam or Junk if the code is not visible after a few minutes. Creating an account does not make you a seller. <Link className="font-medium underline underline-offset-2" href="/privacy">How account data is used</Link></p>}</form></div>;
}
