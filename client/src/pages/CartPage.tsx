import { ProductVisual } from "@/components/ProductVisual";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useCart } from "@/contexts/CartContext";
import { buildCollectionBrief, collectionSafetySteps, saveCollectionBrief } from "@/lib/collection-handoff";
import { ArrowRight, CheckCircle2, MapPin, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const [paymentPreference, setPaymentPreference] = useState<"mpesa" | "pickup">("pickup");
  const [broadLocation, setBroadLocation] = useState("");
  const [preferenceNote, setPreferenceNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [briefReady, setBriefReady] = useState(false);

  const prepareBrief = () => {
    if (!acknowledged) return toast.error("Confirm the safe collection steps before preparing a hand-off brief.");
    saveCollectionBrief(buildCollectionBrief({ items, fulfilmentMethod: "siaya_pickup", broadLocation, preferenceNote: `${paymentPreference === "mpesa" ? "M-Pesa after confirmation" : "Pay on collection after confirmation"}${preferenceNote ? ` — ${preferenceNote}` : ""}` }));
    setBriefReady(true);
    toast.success("Your private collection preference was prepared on this device.");
  };

  return <MarketplaceLayout>
    <div className="basket-page">
      <header className="basket-heading">
        <div className="basket-heading-top">
          <div><p className="eyebrow">Your selections</p><h1>Your basket</h1></div>
          <span className="basket-count-badge"><ShoppingBag size={16} /> {items.length} {items.length === 1 ? "item" : "items"}</span>
        </div>
        <p>Keep your selected local items together, then share a collection preference only when you are ready.</p>
      </header>

      {items.length === 0 ? <section className="empty-basket">
        <div className="empty-basket-icon"><ShoppingBag size={30} /></div>
        <p className="eyebrow">Your basket is clear</p>
        <h2>Start with something useful.</h2>
        <p>Browse current local listings or search the wider selection for a specific item.</p>
        <div className="empty-basket-actions"><Link href="/" className="primary-cta">Browse the market <ArrowRight size={17} /></Link><Link href="/jumia" className="secondary-cta">Explore more choices <ArrowRight size={16} /></Link></div>
      </section> : <div className="checkout-layout">
        <section className="basket-list">
          <div className="basket-section-heading"><div><p className="eyebrow">Review</p><h2>Selected items</h2></div><span>Live local basket</span></div>
          {items.map(item => <article className="basket-item" key={item.id}>
            <ProductVisual category={item.category} title={item.title} />
            <div className="basket-item-copy"><p className="product-category">Marketplace item</p><h2>{item.title.replace("Sample Listing — ", "")}</h2><strong>{formatKes(item.price)}</strong></div>
            <div className="basket-controls"><div className="quantity-control"><button aria-label={`Reduce ${item.title} quantity`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button><span>{item.quantity}</span><button aria-label={`Increase ${item.title} quantity`} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button></div><button className="remove-item" onClick={() => removeItem(item.id)}><Trash2 size={16} /> Remove</button></div>
          </article>)}
          <div className="basket-list-footer"><span>Items subtotal</span><strong>{formatKes(subtotal)}</strong></div>
        </section>

        <aside className="order-summary">
          <div className="order-summary-heading"><span className="summary-icon"><PackageCheck size={19} /></span><div><p className="eyebrow">Next step</p><h2>Collection preference</h2></div></div>
          <p className="summary-lede">Prepare a private preference for MtaaMarket to confirm. This basket does not place an order or collect payment.</p>
          <div className="summary-route"><div><MapPin size={17} /><strong>Collection route</strong></div><p>Confirmed by MtaaMarket</p><small>The actual route and time are confirmed before collection.</small></div>
          <fieldset className="station-select"><legend>Payment preference after confirmation</legend><label><input checked={paymentPreference === "mpesa"} onChange={() => setPaymentPreference("mpesa")} type="radio" name="payment-preference" /> Pay via M-Pesa after confirmation</label><label><input checked={paymentPreference === "pickup"} onChange={() => setPaymentPreference("pickup")} type="radio" name="payment-preference" /> Pay on collection after confirmation</label><small>MtaaMarket does not collect payment from this basket.</small></fieldset>
          <div className="station-select"><label htmlFor="area"><MapPin size={16} /> Broad area or known point</label><input id="area" value={broadLocation} onChange={event => setBroadLocation(event.target.value)} maxLength={180} placeholder="e.g. Siaya Town or a known pickup point" /><small>Do not enter a house number, ID number, payment detail, or live location.</small></div>
          <div className="station-select"><label htmlFor="note">Collection preference <span>(optional)</span></label><textarea id="note" value={preferenceNote} onChange={event => setPreferenceNote(event.target.value)} placeholder="e.g. preferred day or collection suggestion" maxLength={600} /></div>
          <div className="summary-safety"><div><ShieldCheck size={17} /><strong>Safe parcel collection</strong></div><ol>{collectionSafetySteps.map(step => <li key={step}>{step}</li>)}</ol></div>
          <label className="summary-acknowledgement"><input checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} type="checkbox" /> <span>I understand MtaaMarket must confirm the item, hand-off route, collection time, and payment instruction before I act.</span></label>
          <div className="summary-lines"><span>Items <strong>{formatKes(subtotal)}</strong></span><span>Collection route <strong>Confirmed by MtaaMarket</strong></span><span className="total-line">No payment is collected <strong>Yet</strong></span></div>
          <button className="basket-button" onClick={prepareBrief}>Prepare private hand-off brief <ArrowRight size={17} /></button>
          {briefReady && <div className="brief-ready"><div><CheckCircle2 size={17} /><strong>Preference saved on this device</strong></div><p>A protected owner-confirmation workflow is still being migrated. Use the Request Desk for anything else you need; do not act on a parcel or payment until MtaaMarket confirms the next step.</p><Link href="/request">Open Request Desk <ArrowRight size={14} /></Link></div>}
          <p className="summary-note">No collection reference, courier booking, payment acceptance, or collection-point guarantee is issued from this basket.</p>
        </aside>
      </div>}
    </div>
  </MarketplaceLayout>;
}

function formatKes(value: number) {
  return `KES ${value.toLocaleString("en-KE")}`;
}
