import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { ArrowRight, LockKeyhole, Store } from "lucide-react";
import { Link } from "wouter";

export default function DashboardPage() {
  return <MarketplaceLayout><section className="auth-gate"><LockKeyhole aria-hidden="true" /><p className="eyebrow">Private MtaaMarket workspace</p><h1>Workspace access is being prepared.</h1><p>Your account-linked buyer, seller, and owner workspace will return after the protected V3 account and role migration is independently verified. Until then, this route does not open an older profile, order, seller, payment, or operations system.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/vendor" className="primary-cta">Open Seller Studio guide <Store size={17} /></Link><Link href="/" className="secondary-cta">Return to market <ArrowRight size={17} /></Link></div></section></MarketplaceLayout>;
}
