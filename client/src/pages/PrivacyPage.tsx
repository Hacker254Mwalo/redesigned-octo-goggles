import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { Link } from "wouter";

export default function PrivacyPage() {
  return (
    <MarketplaceLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="rounded-3xl bg-[#0e2f27] px-6 py-9 text-white shadow-sm sm:px-10">
          <p className="eyebrow text-[#d7a95b]">Privacy and account data</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A clear, limited use of your account details.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">Siaya Mtaa Market uses account details to secure sign-in, support role-scoped marketplace tools, and coordinate requests and orders.</p>
        </header>

        <div className="mt-8 space-y-6 text-sm leading-7 text-[#29443a]">
          <section className="rounded-2xl border border-[#dce5dc] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0e2f27]">What MtaaMarket collects</h2>
            <p className="mt-3">When you create or use an account, MtaaMarket processes your sign-in details, such as email and the provider account identifier, plus the Kenyan mobile number you add for marketplace and order contact. We use that number for relevant follow-up; this flow does not verify it by SMS. Passwords are handled by the authentication provider and are not displayed in the marketplace interface.</p>
          </section>

          <section className="rounded-2xl border border-[#dce5dc] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0e2f27]">Google sign-in</h2>
            <p className="mt-3">If Google sign-in is available, you choose whether to continue with Google. MtaaMarket requests only the basic identity information needed to create or resume a buyer session, including your name, email address, and Google account identifier. It does not request access to your Google Drive, Gmail, contacts, calendar, photos, or payment information.</p>
          </section>

          <section className="rounded-2xl border border-[#dce5dc] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0e2f27]">How MtaaMarket uses and protects it</h2>
            <p className="mt-3">We use account details to authenticate you, prevent misuse, and support role-scoped buyer and seller tools. We do not sell account information or use it for advertising surveillance. Signing in alone does not place an order or take payment; marketplace actions use separate protected workflows and clear user confirmation.</p>
          </section>

          <section className="rounded-2xl border border-[#dce5dc] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#0e2f27]">Your choices</h2>
            <p className="mt-3">You may use an available email sign-in method instead of Google. For an account-data question or deletion request, use the <Link className="font-semibold text-[#0e2f27] underline underline-offset-4" href="/request">Request Desk</Link> and select the account-data topic in your message. Please do not include a password, one-time code, or sign-in link in any request.</p>
          </section>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
