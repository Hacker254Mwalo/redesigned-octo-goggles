import AccountSettingsCard from "@/components/AccountSettingsCard";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, ClipboardList, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag, Store, UserRound } from "lucide-react";
import { Link } from "wouter";

const statusCopy: Record<string, string> = {
  placed: "Order placed",
  confirming: "Checking item",
  accepted: "Accepted for fulfilment",
  sourcing: "Being prepared",
  ready: "Ready for collection",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function DashboardPage() {
  const { configured, loading, session } = useSupabaseAuth();
  const vendorAccess = trpc.marketplace.v3VendorAccess.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const buyerOrders = trpc.marketplace.v3BuyerJumiaOrders.useQuery(undefined, { enabled: Boolean(session), retry: false });

  return (
    <MarketplaceLayout>
      {!configured && (
        <section className="auth-gate">
          <LockKeyhole aria-hidden="true" />
          <p className="eyebrow">MtaaMarket account</p>
          <h1>Account access is being prepared.</h1>
          <p>Email sign-in is not configured in this environment yet. Return to the market after account access has been configured.</p>
          <Link href="/" className="secondary-cta mt-6">Return to market <ArrowRight size={17} /></Link>
        </section>
      )}
      {configured && loading && (
        <section className="auth-gate" aria-live="polite">
          <LockKeyhole aria-hidden="true" />
          <p className="eyebrow">Private workspace</p>
          <h1>Checking your account session.</h1>
          <p>Your account-linked workspace will appear after the secure session check completes.</p>
        </section>
      )}
      {configured && !loading && !session && (
        <section className="auth-gate">
          <LockKeyhole aria-hidden="true" />
          <p className="eyebrow">Private workspace</p>
          <h1>Sign in to open your workspace.</h1>
          <p>Use the Account button in the header. The same verified account can shop, send requests, use Seller Studio when eligible, and access owner controls when it has the founder role.</p>
          <Link href="/" className="primary-cta mt-6">Return to market and sign in <ArrowRight size={17} /></Link>
        </section>
      )}
      {configured && !loading && session && (
        <main className="workspace-page">
          <header className="workspace-header">
            <div>
              <p className="eyebrow">Account workspace</p>
              <h1>Everything in one place.</h1>
              <p>Manage your details, follow orders, and move between shopping and seller tools without creating another account.</p>
            </div>
            <aside className="workspace-summary">
              <UserRound size={19} />
              <span>SIGNED IN</span>
              <strong>{session.user.email || "Verified account"}</strong>
              <small>One account for shopping and protected actions.</small>
            </aside>
          </header>

          <section id="profile" className="workspace-profile">
            <div className="workspace-section-heading">
              <div>
                <p className="eyebrow">Your details</p>
                <h2>Account &amp; profile</h2>
              </div>
              <span>Keep your information current</span>
            </div>
            <AccountSettingsCard />
          </section>

          {vendorAccess.isError && <p className="workspace-permission-note" role="status">Your account is signed in, but workspace permissions could not be checked. Refresh before opening a protected action.</p>}

          <section className="workspace-actions">
            <div className="workspace-section-heading">
              <div>
                <p className="eyebrow">Quick actions</p>
                <h2>Choose your next move.</h2>
              </div>
              <Link href="/" className="text-cta">Back to market <ArrowRight size={15} /></Link>
            </div>
            <div className="workspace-action-grid">
              <Link href="/cart" className="workspace-action-card workspace-action-dark">
                <ShoppingBag size={20} />
                <h3>Your basket</h3>
                <p>Review local products and collection preferences.</p>
                <span>Open basket <ArrowRight size={15} /></span>
              </Link>
              <Link href="/jumia" className="workspace-action-card workspace-action-mint">
                <PackageCheck size={20} />
                <h3>Find more choices</h3>
                <p>Search the live selection and place a request in one flow.</p>
                <span>Explore selection <ArrowRight size={15} /></span>
              </Link>
              <Link href="/request" className="workspace-action-card">
                <ClipboardList size={20} />
                <h3>Request an item</h3>
                <p>Tell MtaaMarket what you need when it is not listed yet.</p>
                <span>Open Request Desk <ArrowRight size={15} /></span>
              </Link>
              <Link href="/vendor/upload" className="workspace-action-card">
                <Store size={20} />
                <h3>Seller Studio</h3>
                <p>Publish listings after your seller account is approved.</p>
                <span>Open Seller Studio <ArrowRight size={15} /></span>
              </Link>
              {vendorAccess.data?.isOwner && <Link href="/admin" className="workspace-action-card workspace-action-owner">
                <ShieldCheck size={20} />
                <h3>Owner console</h3>
                <p>Manage listings, seller access, requests, and fulfilment records.</p>
                <span>Open owner console <ArrowRight size={15} /></span>
              </Link>}
            </div>
          </section>

          {buyerOrders.data && buyerOrders.data.length > 0 && (
            <section className="workspace-orders">
              <div className="workspace-section-heading">
                <div>
                  <p className="eyebrow">Recent activity</p>
                  <h2>Follow your order updates.</h2>
                </div>
                <Link className="text-cta" href="/jumia">Shop again <ArrowRight size={15} /></Link>
              </div>
              <div className="workspace-order-grid">
                {buyerOrders.data.slice(0, 6).map(order => (
                  <article key={order.id} className="workspace-order-card">
                    <div><strong>{order.order_number}</strong><span>{statusCopy[order.status] ?? order.status}</span></div>
                    <p>{order.items.map((item: { title: string; quantity: number }) => `${item.title} × ${item.quantity}`).join(", ")}</p>
                    <small>Payment due at {order.payment_timing === "pay_on_delivery" ? "delivery" : "collection"}</small>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      )}
    </MarketplaceLayout>
  );
}
