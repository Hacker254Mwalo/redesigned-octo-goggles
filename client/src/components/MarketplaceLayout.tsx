import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { Heart, MapPin, Menu, Search, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "Discover", icon: Search },
  { href: "/stations", label: "Pickup stations", icon: MapPin },
  { href: "/vendor", label: "Sell with us", icon: Store },
];

export function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="market-shell">
      <div className="top-note"><span className="note-dot" /> Simple pickup. Protected payments. Kenyan sellers.</div>
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="MtaaMarket home">
            <span className="brand-mark">M</span>
            <span>Mtaa<span>Market</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navItems.map(({ href, label }) => <Link key={href} href={href} className={cn("nav-link", location === href && "active")}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link href="/cart" className="icon-action relative" aria-label={`Basket with ${count} items`}>
              <ShoppingBag size={19} />{count > 0 && <span className="cart-count">{count}</span>}
            </Link>
            <button className="account-action" onClick={() => isAuthenticated ? setLocation("/dashboard") : startLogin()} aria-label={isAuthenticated ? "Account" : "Sign in"}>
              <UserRound size={17} /><span>{isAuthenticated ? (user?.name?.split(" ")[0] || "Account") : "Sign in"}</span>
            </button>
            <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
          </div>
        </div>
        {open && <nav className="mobile-menu">{navItems.map(({ href, label, icon: Icon }) => <Link onClick={() => setOpen(false)} key={href} href={href} className="mobile-menu-link"><Icon size={18} />{label}</Link>)}<Link onClick={() => setOpen(false)} href="/cart" className="mobile-menu-link"><ShoppingBag size={18} />Basket ({count})</Link></nav>}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div><div className="brand footer-brand"><span className="brand-mark">M</span><span>Mtaa<span>Market</span></span></div><p>Built for easier discovery, clear pickup, and safer selling.</p></div>
        <div className="footer-links"><Link href="/stations">Pickup stations</Link><Link href="/vendor">Sell with us</Link><Link href="/cart">Your basket</Link></div>
        <div className="footer-trust"><Heart size={16} fill="currentColor" /> No hidden fees at checkout</div>
      </footer>
    </div>
  );
}
