import { ArrowRight, BadgeCheck, ClipboardCheck, MapPin, Search, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { Link } from "wouter";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";

const steps = [
  {
    number: "01",
    title: "Browse the market",
    copy: "Find everyday products from local Siaya sellers and the wider Jumia selection.",
    icon: Search,
  },
  {
    number: "02",
    title: "Build your basket",
    copy: "Choose your items, options, and quantities in one simple shopping basket.",
    icon: ShoppingBag,
  },
  {
    number: "03",
    title: "Choose your location",
    copy: "Select collection in Siaya, a collection point, or home delivery.",
    icon: MapPin,
  },
  {
    number: "04",
    title: "Receive your order",
    copy: "Follow your order from preparation to collection or delivery.",
    icon: Truck,
  },
];

export default function AssistedSourcingPage() {
  return (
    <MarketplaceLayout>
      <div className="assisted-guide-page">
        <section className="assisted-guide-hero">
          <div className="assisted-guide-copy">
            <p className="eyebrow">Shopping in Siaya</p>
            <h1>Everything you need.<br /><em>Closer to home.</em></h1>
            <p>Shop local products and explore a wider selection through MtaaMarket. Choose where you want your order delivered or collected, then follow it from your account.</p>
            <div className="guide-actions">
              <Link href="/" className="primary-cta">Browse the market <ArrowRight size={17} /></Link>
              <Link href="/jumia" className="secondary-cta">Shop Jumia <Search size={16} /></Link>
            </div>
          </div>
          <div className="assisted-guide-card" aria-label="Shopping summary">
            <span>SIMPLE SHOPPING</span>
            <div className="guide-card-icon"><ShieldCheck size={27} /></div>
            <strong>One place for local shopping.</strong>
            <p>Discover, order, and keep up with delivery from MtaaMarket.</p>
            <div className="guide-card-rule"><BadgeCheck size={15} /> Made for Siaya buyers</div>
          </div>
        </section>

        <section className="guide-intro">
          <div>
            <p className="eyebrow">A better way to shop</p>
            <h2>Simple from the first search to the final hand-off.</h2>
          </div>
          <p>Browse what is available, choose what you need, and keep your order details in one clear place.</p>
        </section>

        <section className="guide-step-grid" aria-label="How MtaaMarket shopping works">
          {steps.map(({ number, title, copy, icon: Icon }) => (
            <article key={number}>
              <div className="guide-step-top"><span>{number}</span><Icon size={19} /></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="guide-confirmation">
          <div className="guide-confirmation-symbol"><ShieldCheck size={31} /></div>
          <div>
            <p className="eyebrow">Designed around you</p>
            <h2>Local shopping, with more choice.</h2>
            <p>Start with products listed by Siaya sellers or open the Jumia channel when you need a wider range. Your order, location, and progress stay together in your MtaaMarket account.</p>
          </div>
          <Link href="/jumia" className="secondary-cta">Shop Jumia <ArrowRight size={17} /></Link>
        </section>

        <section className="guide-closing">
          <div>
            <p className="eyebrow">Start shopping</p>
            <h2>Find your next purchase today.</h2>
            <p>Explore the market or search the Jumia selection for something specific.</p>
          </div>
          <div className="guide-closing-actions">
            <Link href="/" className="primary-cta">Open the market <ArrowRight size={17} /></Link>
            <span><MapPin size={15} /> Serving Siaya and nearby areas</span>
          </div>
        </section>
      </div>
    </MarketplaceLayout>
  );
}
