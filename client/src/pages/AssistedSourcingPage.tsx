import { ArrowRight, BadgeCheck, ClipboardCheck, HandHeart, Info, MapPin, Search, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";

const steps = [
  {
    number: "01",
    title: "Describe the item",
    copy: "Send a focused Request Desk note with the physical product, quantity or size, preferred condition, and any essential details.",
    icon: HandHeart,
  },
  {
    number: "02",
    title: "MtaaMarket checks possible routes",
    copy: "The owner reviews realistic local or external options manually. A request is not a stock reservation, price quote, or purchase.",
    icon: Search,
  },
  {
    number: "03",
    title: "Review the exact offer",
    copy: "Before you decide, MtaaMarket confirms the exact item, current amount, and practical fulfilment preference using clear, original MtaaMarket wording.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Choose the next step",
    copy: "You confirm whether to proceed. Payment instructions and a Siaya pickup, collection-point, or home-delivery preference are discussed only after that confirmation.",
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
            <h1>Ask with clarity.<br /><em>Confirm before you act.</em></h1>
            <p>When a physical product is not in the verified listings, MtaaMarket can review a managed request. It is a local, owner-managed route—not a live supplier catalogue, an automatic checkout, or a promise that an item is available.</p>
            <div className="guide-actions">
              <Link href="/request" className="primary-cta">Start an item request <ArrowRight size={17} /></Link>
              <Link href="/" className="secondary-cta">Browse current listings <Search size={16} /></Link>
            </div>
          </div>
          <div className="assisted-guide-card" aria-label="Managed request process summary">
            <span>MANAGED REQUEST</span>
            <div className="guide-card-icon"><ShieldCheck size={27} /></div>
            <strong>A human check before a commitment.</strong>
            <p>Every request stays subject to owner review and your confirmation.</p>
            <div className="guide-card-rule"><Info size={15} /> No automatic supplier purchase</div>
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
            <p>The owner must confirm the actual item, current amount, practical hand-off route, and fulfilment preference with you. You can then choose whether to continue; no payment or supplier action is triggered by a request alone.</p>
          </div>
          <Link href="/request" className="secondary-cta">Send a managed request <ArrowRight size={17} /></Link>
        </section>

        <section className="guide-boundaries">
          <div className="guide-boundaries-heading">
            <p className="eyebrow">Built on clear boundaries</p>
            <h2>What assisted sourcing does not do.</h2>
          </div>
          <div className="guide-boundary-list">
            <p><span><ShieldCheck size={16} /></span><div><strong>No affiliation claim.</strong> MtaaMarket does not present itself as a partner of another marketplace or supplier unless a real agreement exists.</div></p>
            <p><span><ShieldCheck size={16} /></span><div><strong>No copied catalogue content.</strong> MtaaMarket uses its own original descriptions and does not copy supplier photos, reviews, titles, or prices.</div></p>
            <p><span><ShieldCheck size={16} /></span><div><strong>No live-source promise.</strong> A request does not claim real-time availability or pricing; the owner confirms any current details before you decide.</div></p>
            <p><span><ShieldCheck size={16} /></span><div><strong>No automatic checkout.</strong> A managed request never places a supplier order or sends a payment instruction by itself.</div></p>
          </div>
        </section>

        <section className="guide-closing">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Tell MtaaMarket what would make your day easier.</h2>
            <p>Use a broad Siaya area or collection suggestion, not an exact address. The Request Desk starts a review; it does not commit you to buy.</p>
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
