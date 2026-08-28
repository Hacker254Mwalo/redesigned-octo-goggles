import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { ArrowRight, BadgeCheck, Camera, CheckCircle2, ChevronRight, ShieldCheck, Store } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const sellerSteps = [
  {
    number: "01",
    title: "Create your seller profile",
    copy: "Use one verified MtaaMarket account and tell us what you sell.",
    icon: Store,
  },
  {
    number: "02",
    title: "Get approved once",
    copy: "The MtaaMarket owner checks the seller account and records the agreement.",
    icon: BadgeCheck,
  },
  {
    number: "03",
    title: "Publish with confidence",
    copy: "Add clear listings, honest availability, and original product photos.",
    icon: Camera,
  },
];

export default function VendorPage() {
  const { session } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const enterSellerStudio = () => session ? setLocation("/vendor/upload") : setAccountOpen(true);

  return (
    <MarketplaceLayout>
      <div className="vendor-page">
        <section className="vendor-hero">
          <div>
            <p className="eyebrow">Seller Studio</p>
            <h1>Put your products<br /><em>in front of Siaya.</em></h1>
            <p>List what you genuinely have, reach local buyers, and keep your product details in one simple workspace.</p>
            <button className="primary-cta" type="button" onClick={enterSellerStudio}>
              {session ? "Open Seller Studio" : "Start as a seller"} <ArrowRight size={17} />
            </button>
            <p className="vendor-hero-note">Seller access is approved once. After approval, you can publish listings normally.</p>
          </div>
          <div className="vendor-illustration" aria-label="Seller Studio overview">
            <div>
              <Store size={30} />
              <span>SELLER STUDIO</span>
              <strong>Simple tools for serious listings.</strong>
              <div className="vendor-mini-line"><CheckCircle2 size={15} /> One seller account</div>
              <div className="vendor-mini-line"><CheckCircle2 size={15} /> Clear product details</div>
            </div>
          </div>
        </section>

        <section className="seller-benefits" aria-label="Seller benefits">
          <article>
            <BadgeCheck />
            <h2>Approved once</h2>
            <p>Your seller account goes through one owner review. Product uploads do not wait in a separate approval queue.</p>
          </article>
          <article>
            <ShieldCheck />
            <h2>Built on trust</h2>
            <p>Use accurate prices, availability, condition, and photos so buyers know what they are choosing.</p>
          </article>
          <article>
            <CheckCircle2 />
            <h2>Made for local reach</h2>
            <p>Serve buyers in Siaya and nearby areas with the collection or delivery details you can actually support.</p>
          </article>
        </section>

        <section className="seller-steps-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A clear start</p>
              <h2>From account to first listing.</h2>
            </div>
            <p>Everything important is visible before you publish.</p>
          </div>
          <div className="seller-step-grid">
            {sellerSteps.map(({ number, title, copy, icon: Icon }) => (
              <article key={number}>
                <div className="seller-step-top"><span>{number}</span><Icon size={19} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="vendor-callout">
          <div>
            <p className="eyebrow">Listing standard</p>
            <h2>Clear photos. Useful details. Honest availability.</h2>
            <p>Seller Studio guides you through the information buyers need. Some categories may ask for additional handover details before they can be listed.</p>
          </div>
          <button className="secondary-cta" type="button" onClick={enterSellerStudio}>
            {session ? "Open your studio" : "See the seller form"} <ChevronRight size={17} />
          </button>
        </section>
      </div>
      <MtaaAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </MarketplaceLayout>
  );
}
