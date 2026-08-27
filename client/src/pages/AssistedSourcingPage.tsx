import { ArrowRight, BadgeCheck, ClipboardCheck, HandHeart, Info, MapPin, Search, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";

const steps = [
  {
    number: "01",
    title: "Choose the item you want",
    copy: "Send the item name, quantity or size, preferred condition, and any essential details through the Jumia Assisted Order form.",
    icon: HandHeart,
  },
  {
    number: "02",
    title: "The founder checks JForce",
    copy: "The founder checks the exact item, current availability, amount, and delivery route through the private JForce workflow.",
    icon: Search,
  },
  {
    number: "03",
    title: "Review the confirmed order",
    copy: "MtaaMarket sends you the confirmed item, final amount, and practical fulfilment preference before the Jumia order is placed.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Confirm or cancel",
    copy: "You confirm whether to proceed. If the item is unavailable before purchase, the founder can cancel it; payment is due only at collection or delivery.",
    icon: BadgeCheck,
  },
];

export default function AssistedSourcingPage() {
  return (
    <MarketplaceLayout>
      <div className="assisted-guide-page">
        <section className="assisted-guide-hero">
          <div className="assisted-guide-copy">
            <p className="eyebrow">MtaaMarket assisted sourcing</p>
            <h1>Choose with clarity.<br /><em>Pay at the hand-off.</em></h1>
            <p>MtaaMarket can help you order a Jumia item through the founder’s JForce workflow. You submit the item normally, receive confirmation before purchase, and pay only when the parcel is collected or delivered.</p>
            <div className="guide-actions">
              <Link href="/request" className="primary-cta">Start an item request <ArrowRight size={17} /></Link>
              <Link href="/" className="secondary-cta">Browse current listings <Search size={16} /></Link>
            </div>
          </div>
          <div className="assisted-guide-card" aria-label="Managed request process summary">
            <span>MANAGED REQUEST</span>
            <div className="guide-card-icon"><ShieldCheck size={27} /></div>
            <strong>Founder confirmation before purchase.</strong>
            <p>Every request stays subject to owner review and your confirmation.</p>
            <div className="guide-card-rule"><Info size={15} /> No payment before hand-off</div>
          </div>
        </section>

        <section className="guide-intro">
          <div>
            <p className="eyebrow">A clearer local route</p>
            <h2>Four steps, with no hidden jump to payment.</h2>
          </div>
          <p>Assisted sourcing helps MtaaMarket respond to real Siaya needs while verified listings are added gradually. You decide only after the details are clear.</p>
        </section>

        <section className="guide-step-grid" aria-label="How MtaaMarket assisted sourcing works">
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
            <p className="eyebrow">Before any payment instruction</p>
            <h2>MtaaMarket confirms the decision details first.</h2>
            <p>The founder confirms the actual item, current amount, practical hand-off route, and fulfilment preference with you. You can then choose whether to continue. The founder can cancel before purchase if the item is unavailable, and payment remains due at collection or delivery.</p>
          </div>
          <Link href="/request" className="secondary-cta">Send a managed request <ArrowRight size={17} /></Link>
        </section>

        <section className="guide-boundaries">
          <div className="guide-boundaries-heading">
            <p className="eyebrow">Built on clear boundaries</p>
            <h2>What the Jumia Assisted Order channel does.</h2>
          </div>
          <ul className="guide-boundary-list">
            <li><span><ShieldCheck size={16} /></span><div><strong>Founder-managed fulfilment.</strong> The founder confirms and places the Jumia order through the private JForce workflow.</div></li>
            <li><span><ShieldCheck size={16} /></span><div><strong>No extra MtaaMarket charge.</strong> The customer confirms the final amount before the order is placed.</div></li>
            <li><span><ShieldCheck size={16} /></span><div><strong>Availability confirmation.</strong> The founder checks stock and the final amount before accepting the order.</div></li>
            <li><span><ShieldCheck size={16} /></span><div><strong>Cancellation before purchase.</strong> If the item is unavailable, the order can be cancelled before the founder buys it.</div></li>
          </ul>
        </section>

        <section className="guide-closing">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Tell MtaaMarket what would make your day easier.</h2>
            <p>Use a broad Siaya area or collection suggestion, not an exact address. Your request starts an order confirmation—not a payment or a forced purchase.</p>
          </div>
          <div className="guide-closing-actions">
            <Link href="/request" className="primary-cta">Open Request Desk <ArrowRight size={17} /></Link>
            <span><MapPin size={15} /> Siaya-focused fulfilment preferences</span>
          </div>
        </section>
      </div>
    </MarketplaceLayout>
  );
}
