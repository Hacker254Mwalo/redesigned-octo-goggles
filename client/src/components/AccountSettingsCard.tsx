import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { ACCOUNT_MIN_PASSWORD_LENGTH, accountActionErrorMessage, validateMtaaMarketPassword } from "@/lib/auth-account";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, KeyRound, Loader2, Mail, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

export default function AccountSettingsCard() {
  const { session, updateEmail, updatePassword } = useSupabaseAuth();
  const profile = trpc.marketplace.v3AccountProfile.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const utils = trpc.useUtils();
  const updateProfile = trpc.marketplace.updateV3AccountProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.marketplace.v3AccountProfile.invalidate(), utils.marketplace.v3BuyerOrderAccess.invalidate()]);
      setProfileNotice("Your account details are saved.");
    },
    onError: error => setProfileNotice(error.message),
  });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.fullName ?? "");
    setPhone(profile.data.phoneNumber ?? "");
  }, [profile.data]);

  useEffect(() => {
    setNewEmail(session?.user.email ?? "");
  }, [session?.user.email]);

  if (!session) return null;

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileNotice("");
    updateProfile.mutate({ fullName: fullName.trim() || null, phone: phone.trim() || null });
  };

  const saveEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || email === (session.user.email ?? "").toLowerCase()) {
      setEmailNotice("Enter a different email address to start an email change.");
      return;
    }
    setEmailSaving(true);
    setEmailNotice("");
    try {
      await updateEmail(email);
      setEmailNotice("Check the new email inbox and confirm the change before signing in with it.");
    } catch (error) {
      setEmailNotice(accountActionErrorMessage(error));
    } finally {
      setEmailSaving(false);
    }
  };

  const savePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const issue = validateMtaaMarketPassword(newPassword);
    if (issue) return setPasswordNotice(issue);
    if (newPassword !== passwordConfirmation) return setPasswordNotice("The two new passwords do not match.");
    setPasswordSaving(true);
    setPasswordNotice("");
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setPasswordConfirmation("");
      setPasswordNotice("Your password is updated.");
    } catch (error) {
      setPasswordNotice(accountActionErrorMessage(error));
    } finally {
      setPasswordSaving(false);
    }
  };

  return <section id="profile" className="workspace-card profile-settings-card" aria-labelledby="profile-settings-title">
    <div className="card-title"><div><p className="eyebrow">Account settings</p><h2 id="profile-settings-title">Your details, your control</h2></div><UserRound /></div>
    <p className="muted-copy">Keep your name and contact details ready for collection or delivery. These details stay linked to your account and are only used when an order needs them.</p>
    <form className="profile-settings-form" onSubmit={saveProfile}>
      <label>Full name<input value={fullName} onChange={event => setFullName(event.target.value)} autoComplete="name" placeholder="Your full name" maxLength={90} /></label>
      <label>Kenyan phone<input value={phone} onChange={event => setPhone(event.target.value.replace(/[^+\d]/g, ""))} autoComplete="tel" inputMode="tel" placeholder="2547XXXXXXXX" maxLength={13} /></label>
      <div className="profile-settings-actions"><button className="primary-cta" type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{updateProfile.isPending ? "Saving…" : "Save details"}</button>{profileNotice && <p className="settings-notice" role="status">{profileNotice}</p>}</div>
    </form>
    <div className="profile-security-grid">
      <form className="profile-security-card" onSubmit={saveEmail}>
        <div className="profile-security-heading"><Mail size={17} /><div><strong>Email address</strong><span>{session.user.email || "Verified account email"}</span></div></div>
        <label className="sr-only" htmlFor="account-email-change">New email address</label><input id="account-email-change" type="email" value={newEmail} onChange={event => setNewEmail(event.target.value)} autoComplete="email" placeholder="New email address" />
        <button className="secondary-cta" type="submit" disabled={emailSaving}>{emailSaving ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}{emailSaving ? "Updating…" : "Update email"}</button>
        {emailNotice && <p className="settings-notice" role="status">{emailNotice}</p>}
      </form>
      <form className="profile-security-card" onSubmit={savePassword}>
        <div className="profile-security-heading"><KeyRound size={17} /><div><strong>Password</strong><span>Use a fresh password with letters and numbers.</span></div></div>
        <label className="sr-only" htmlFor="account-new-password">New password</label><input id="account-new-password" type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="New password" />
        <label className="sr-only" htmlFor="account-confirm-password">Confirm new password</label><input id="account-confirm-password" type="password" minLength={ACCOUNT_MIN_PASSWORD_LENGTH} value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} autoComplete="new-password" placeholder="Confirm new password" />
        <button className="secondary-cta" type="submit" disabled={passwordSaving}>{passwordSaving ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}{passwordSaving ? "Updating…" : "Update password"}</button>
        {passwordNotice && <p className="settings-notice" role="status"><CheckCircle2 size={14} />{passwordNotice}</p>}
      </form>
    </div>
  </section>;
}
