import { useState, type FormEvent, type RefObject } from "react";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { Link } from "wouter";

type SignUpModalProps = {
  title: string;
  subtitle: string;
  emailInputRef: RefObject<HTMLInputElement | null>;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  phone: string;
  onPhoneChange: (value: string) => void;
  confirmation: string;
  onConfirmationChange: (value: string) => void;
  notice: string;
  submitting: boolean;
  disabledByCooldown: boolean;
  googleEnabled: boolean;
  googleSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onSwitchToSignIn: () => void;
  onGoogleSignIn: () => void;
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M23.49 12.27c0-.78-.07-1.53-.2-2.27H12v4.26h6.46a5.55 5.55 0 0 1-2.39 3.63v2.77h3.87c2.26-2.08 3.55-5.15 3.55-8.39Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.94l-3.87-3.17c-1.08.72-2.46 1.15-4.07 1.15-3.12 0-5.77-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.09a7.2 7.2 0 0 1 0-4.18V6.81H1.27a12 12 0 0 0 0 11.18l4.01-3.9Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.36.61 4.61 1.8l3.44-3.44C17.96 1.2 15.24 0 12 0A12 12 0 0 0 1.27 6.81l4.01 3.1C6.23 7.07 8.88 4.75 12 4.75Z" />
    </svg>
  );
}

export function SignUpModal({
  title,
  subtitle,
  emailInputRef,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  phone,
  onPhoneChange,
  confirmation,
  onConfirmationChange,
  notice,
  submitting,
  disabledByCooldown,
  googleEnabled,
  googleSubmitting,
  onSubmit,
  onClose,
  onSwitchToSignIn,
  onGoogleSignIn,
}: SignUpModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="mtaamarket-account-title">
      <form
        onSubmit={onSubmit}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[24px] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="mtaamarket-account-title" className="text-2xl font-semibold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          </div>
          <button type="button" className="icon-action shrink-0" onClick={onClose} aria-label="Close sign-up modal">
            <X size={18} />
          </button>
        </div>

        <label className="mt-5 block text-sm font-medium text-gray-800" htmlFor="signup-email">Email address
          <input
            ref={emailInputRef}
            id="signup-email"
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={event => onEmailChange(event.target.value)}
            placeholder="Enter your email"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-800" htmlFor="signup-password">Password
          <span className="relative mt-2 block">
            <input
              id="signup-password"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 pr-12"
              required
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={event => onPasswordChange(event.target.value)}
              placeholder="Create a password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(value => !value)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-800" htmlFor="signup-phone">Mobile number
          <input
            id="signup-phone"
            className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={event => onPhoneChange(event.target.value)}
            placeholder="0712 345 678"
          />
        </label>
        <p className="mt-2 text-xs text-gray-600">We use this to contact you about orders.</p>

        <label className="mt-4 block text-sm font-medium text-gray-800" htmlFor="signup-confirm-password">Confirm password
          <span className="relative mt-2 block">
            <input
              id="signup-confirm-password"
              className="w-full rounded-xl border border-border bg-white px-3 py-2 pr-12"
              required
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={event => onConfirmationChange(event.target.value)}
              placeholder="Repeat your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
              aria-label={showConfirmation ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={showConfirmation}
              onClick={() => setShowConfirmation(value => !value)}
            >
              {showConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </span>
        </label>

        {notice && <p className="mt-4 rounded-lg bg-muted p-3 text-sm" role="status">{notice}</p>}

        <button className="primary-cta mt-5 w-full justify-center" disabled={submitting || disabledByCooldown}>
          {submitting ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : "Create account"}
        </button>

        {googleEnabled && <>
          <div className="my-4 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500">or</span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <button type="button" className="secondary-cta w-full justify-center" disabled={googleSubmitting} onClick={onGoogleSignIn}>
            <GoogleLogo />
            {googleSubmitting ? "Connecting to Google…" : "Continue with Google"}
          </button>
        </>}

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button type="button" className="font-medium underline underline-offset-2" onClick={onSwitchToSignIn}>Sign in</button>
        </p>
        <p className="mt-4 text-center text-xs text-gray-500">
          By continuing, you agree to our Terms and <Link className="underline underline-offset-2" href="/privacy">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
