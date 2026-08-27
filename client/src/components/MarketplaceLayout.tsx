import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { useCart } from "@/contexts/CartContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Heart, Menu, Search, ShieldCheck, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Market", icon: Search },
  { href: "/how-it-works", label: "How it works", icon: ShieldCheck },
  { href: "/jumia", label: "Shop Jumia", icon: Search },
  { href: "/vendor", label: "Seller Studio", icon: Store },
];

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const { count } = useCart();
  const { configured: supabaseConfigured, session: supabaseSession } = useSupabaseAuth();
  const vendorAccess = trpc.marketplace.v3VendorAccess.useQuery(undefined, { enabled: Boolean(supabaseSession), retry: false });
  const isJumiaJourney = location.startsWith("/jumia");
  const isOwner = vendorAccess.data?.isOwner === true;

  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const startAccount = () => {
    if (supabaseConfigured) setEmailOpen(true);
  };

  return <div className="market-shell"><a className="skip-link" href="#main-content">Skip to market content</a><div className="top-note"><span className="note-dot" /> Siaya's online market · local sellers · easy delivery</div><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Siaya Online MtaaMarket home"><span className="brand-mark">M</span><span><small>Siaya Online</small>Mtaa<span>Market</span></span></Link><nav className="desktop-nav" aria-label="Main navigation">{navItems.map(({ href, label }) => <Link key={href} href={href} aria-current={location === href ? "page" : undefined} className={cn("nav-link", location === href && "active")}>{label}</Link>)}</nav><div className="header-actions"><Link href={isJumiaJourney ? "/jumia#jumia-basket" : "/cart"} className="icon-action relative" aria-label={isJumiaJourney ? "Jumia basket on this page" : `Basket with ${count} items`}><ShoppingBag size={19} />{!isJumiaJourney && count > 0 && <span className="cart-count">{count}</span>}</Link><button className={cn("account-action", isOwner && "account-action-owner")} onClick={startAccount} aria-label={supabaseSession ? (isOwner ? "MtaaMarket owner account" : "MtaaMarket account") : "Sign in to MtaaMarket"}><UserRound size={17} /><span>{supabaseSession ? (isOwner ? "Owner" : "Account") : "Sign in"}</span></button><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mtaa-market-mobile-menu">{open ? <X /> : <Menu />}</button></div></div>{open && <nav id="mtaa-market-mobile-menu" className="mobile-menu" aria-label="Mobile navigation">{navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} key={href} href={href} aria-current={location === href ? "page" : undefined} className="mobile-menu-link"><Icon size={18} />{label}</Link>)}<Link onClick={() => setOpen(false)} href={isJumiaJourney ? "/jumia#jumia-basket" : "/cart"} className="mobile-menu-link"><ShoppingBag size={18} />{isJumiaJourney ? "Jumia basket" : `Basket (${count})`}</Link>{isOwner && <Link onClick={() => setOpen(false)} href="/admin" className="mobile-menu-link"><ShieldCheck size={18} />Owner console</Link>}</nav>}</header><MtaaAccountDialog open={emailOpen} onClose={() => setEmailOpen(false)} /><main id="main-content" tabIndex={-1}>{children}</main><footer className="site-footer"><div><div className="brand footer-brand"><span className="brand-mark">M</span><span><small>Siaya Online</small>Mtaa<span>Market</span></span></div><p>Shop local products and more, delivered across Siaya.</p></div><div className="footer-links"><Link href="/how-it-works">How shopping works</Link><Link href="/jumia">Shop Jumia</Link><Link href="/vendor">Seller Studio</Link><Link href={isJumiaJourney ? "/jumia#jumia-basket" : "/cart"}>{isJumiaJourney ? "Jumia basket" : "Your basket"}</Link><Link href="/privacy">Privacy and account data</Link></div><div className="footer-trust"><Heart size={16} fill="currentColor" /> Built to serve Siaya buyers</div></footer></div>;
}
