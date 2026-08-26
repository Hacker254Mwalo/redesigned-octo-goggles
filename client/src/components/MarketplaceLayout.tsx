import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { cn } from "@/lib/utils";
import { Heart, HandHeart, Loader2, MailCheck, Menu, Search, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Market", icon: Search },
  { href: "/request", label: "Request an item", icon: HandHeart },
  { href: "/vendor", label: "Seller Studio", icon: Store },
];

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { configured: supabaseConfigured, session: supabaseSession, requestMagicLink } = useSupabaseAuth();
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");
  const startAccount = () => {
    if (isAuthenticated) return setLocation("/dashboard");
    if (supabaseConfigured) return setEmailOpen(true);
    startLogin();
  };
  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true); setEmailNotice("");
    try { await requestMagicLink(email); setEmailNotice("Check your email for a secure MtaaMarket sign-in link. The link only signs you in; it does not submit a request or activate an order."); }
    catch { setEmailNotice("We could not send the sign-in link. Confirm the email address and try again later."); }
    finally { setSending(false); }
  };

  return (
    <div className="market-shell">
      <div className="top-note"><span className="note-dot" /> Siaya-served market · platform-managed support · physical products</div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Siaya Online MtaaMarket home">
            <span className="brand-mark">M</span>
            <span><small>Siaya Online</small>Mtaa<span>Market</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map(({ href, label }) => <Link key={href} href={href} className={cn("nav-link", location === href && "active")}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/cart" className="icon-action relative" aria-label={`Basket with ${count} items`}>
              <ShoppingBag size={19} />{count > 0 && <span className="cart-count">{count}</span>}
            </Link>
            <button className="account-action" onClick={startAccount} aria-label={isAuthenticated || supabaseSession ? "Account" : "Sign in"}>
              <UserRound size={17} /><span>{isAuthenticated ? (user?.name?.split(" ")[0] || "Account") : supabaseSession ? "Email session" : "Sign in"}</span>
            </button>
            <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && <nav className="mobile-menu">{navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} key={href} href={href} className="mobile-menu-link"><Icon size={18} />{label}</Link>)}<Link onClick={() => setOpen(false)} href="/cart" className="mobile-menu-link"><ShoppingBag size={18} />Basket ({count})</Link></nav>}
      </header>
      {emailOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="mtaamarket-email-title"><form onSubmit={sendMagicLink} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">MtaaMarket email sign-in</p><h2 id="mtaamarket-email-title" className="mt-2 text-2xl font-semibold">Sign in safely</h2></div><button type="button" className="icon-action" onClick={() => setEmailOpen(false)} aria-label="Close sign-in"><X size={18} /></button></div><p className="mt-3 text-sm text-muted-foreground">We send a one-time sign-in link. It does not create an order, publish a listing, or share your contact details.</p><label className="mt-5 block text-sm font-medium">Email address<input className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2" required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>{emailNotice && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{emailNotice}</p>}<button className="primary-cta mt-5 w-full justify-center" disabled={sending}>{sending ? <Loader2 className="animate-spin" size={17} /> : <MailCheck size={17} />}{sending ? "Sending secure link…" : "Email me a sign-in link"}</button><p className="mt-3 text-xs text-muted-foreground">Your protected MtaaMarket workspace will open only after the account and role migration is complete.</p></form></div>}
      <main>{children}</main>
      <footer className="site-footer">
        <div><div className="brand footer-brand"><span className="brand-mark">M</span><span><small>Siaya Online</small>Mtaa<span>Market</span></span></div><p>A local market platform for products, assisted orders, and carefully managed fulfilment.</p></div>
        <div className="footer-links"><Link href="/request">Request an item</Link><Link href="/vendor">Seller Studio</Link><Link href="/cart">Your basket</Link></div>
        <div className="footer-trust"><Heart size={16} fill="currentColor" /> Built to serve Siaya buyers</div>
      </footer>
    </div>
  );
}
