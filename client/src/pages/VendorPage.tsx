import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { BadgeCheck, BarChart3, Boxes, CheckCircle2, ChevronRight, ShieldCheck, Store } from "lucide-react";
import { useLocation } from "wouter";

export default function VendorPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  return <MarketplaceLayout><div className="vendor-page"><section className="vendor-hero"><div><p className="eyebrow">For ambitious local sellers</p><h1>Your storefront, made simpler.</h1><p>Create clear listings, follow order states, and keep buyers informed from payment to pickup.</p><button className="primary-cta" onClick={() => isAuthenticated ? setLocation("/dashboard") : startLogin()}>{isAuthenticated ? "Open vendor workspace" : "Start selling"} <ChevronRight size={17} /></button></div><div className="vendor-illustration"><div><Store size={30} /><span>YOUR STORE</span><strong>Ready to grow</strong></div><div className="vendor-stat"><BarChart3 size={19} /> Order visibility</div><div className="vendor-stat lower"><Boxes size={19} /> Listing tools</div></div></section><section className="seller-benefits"><article><BadgeCheck /><h2>Build buyer confidence</h2><p>Give customers product details, pickup options, and clear updates at every stage.</p></article><article><ShieldCheck /><h2>Stay in control</h2><p>Use an order workspace designed around payment, fulfilment, and release states.</p></article><article><CheckCircle2 /><h2>Grow responsibly</h2><p>Seller verification and listing review are part of the live marketplace rollout.</p></article></section><section className="vendor-callout"><p className="eyebrow">Designed for your next sale</p><h2>Manage listings with secure, mobile-friendly image uploads.</h2><p>Your product photos are compressed in the browser before upload to reduce storage use and keep the marketplace quick on mobile.</p></section></div></MarketplaceLayout>;
}
