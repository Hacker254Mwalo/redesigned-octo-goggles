import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { useCart } from "@/contexts/CartContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { cn } from "@/lib/utils";
import { Heart, HandHeart, Menu, Search, ShieldCheck, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Market", icon: Search },
  { href: "/how-it-works", label: "How it works", icon: ShieldCheck },
  { href: "/request", label: "Request an item", icon: HandHeart },
  { href: "/vendor", label: "Seller Studio", icon: Store },
];

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { configured: supabaseConfigured, session: supabaseSession } = useSupabaseAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [location]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);
  const startAccount = () => {
    if (isAuthenticated) return setLocation("/dashboard");
    if (supabaseConfigured) return setEmailOpen(true);
    startLogin();
  };
  return (
    <div className="market-shell">
      <a className="skip-link" href="#main-content">Skip to market content</a>
      <div className="top-note"><span className="note-dot" /> Siaya-served market · platform-managed support · physical products</div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Siaya Online MtaaMarket home">
            <span className="brand-mark">M</span>
            <span><small>Siaya Online</small>Mtaa<span>Market</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map(({ href, label }) => <Link key={href} href={href} aria-current={location === href ? "page" : undefined} className={cn("nav-link", location === href && "active")}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/cart" className="icon-action relative" aria-label={`Basket with ${count} items`}>
              <ShoppingBag size={19} />{count > 0 && <span className="cart-count">{count}</span>}
            </Link>
            <button className="account-action" onClick={startAccount} aria-label={isAuthenticated || supabaseSession ? "Account" : "Sign in"}>
              <UserRound size={17} /><span>{isAuthenticated ? (user?.name?.split(" ")[0] || "Account") : supabaseSession ? "Email session" : "Sign in"}</span>
            </button>
            <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mtaa-market-mobile-menu">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && <nav id="mtaa-market-mobile-menu" className="mobile-menu" aria-label="Mobile navigation">{navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} key={href} href={href} aria-current={location === href ? "page" : undefined} className="mobile-menu-link"><Icon size={18} />{label}</Link>)}<Link onClick={() => setOpen(false)} href="/cart" className="mobile-menu-link"><ShoppingBag size={18} />Basket ({count})</Link></nav>}
      </header>
      <MtaaAccountDialog open={emailOpen} onClose={() => setEmailOpen(false)} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div><div className="brand footer-brand"><span className="brand-mark">M</span><span><small>Siaya Online</small>Mtaa<span>Market</span></span></div><p>A local market platform for products, assisted orders, and carefully managed fulfilment.</p></div>
        <div className="footer-links"><Link href="/how-it-works">How assisted sourcing works</Link><Link href="/request">Request an item</Link><Link href="/vendor">Seller Studio</Link><Link href="/cart">Your basket</Link><Link href="/privacy">Privacy and account data</Link></div>
        <div className="footer-trust"><Heart size={16} fill="currentColor" /> Built to serve Siaya buyers</div>
      </footer>
    </div>
  );
}
