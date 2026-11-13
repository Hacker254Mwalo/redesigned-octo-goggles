import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { formatKes } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { useCart } from "@/contexts/CartContext";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Box, Check, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

type PublicReview = { review: { id: string | number; rating: number; comment: string | null }; reviewer: { displayName: string } };

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const result = trpc.marketplace.productBySlug.useQuery({ slug: params?.slug || "" }, { enabled: Boolean(params?.slug) });
  const { addItem } = useCart(); const { session } = useSupabaseAuth(); const [quantity, setQuantity] = useState(1); const [buyerName, setBuyerName] = useState(""); const [buyerPhone, setBuyerPhone] = useState(""); const [orderPlacedId, setOrderPlacedId] = useState<string | null>(null); const [pickupPreference, setPickupPreference] = useState("Siaya Town");
  const entry = result.data;
  const buyerOrderAccess = trpc.marketplace.v3BuyerOrderAccess.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const confirmV3Order = trpc.marketplace.createV3HubOrder.useMutation({ onSuccess: order => { setOrderPlacedId(order.id); toast.success("Your order has been placed."); }, onError: error => toast.error(error.message) });
  const saveBuyerOrderProfile = trpc.marketplace.saveV3BuyerOrderProfile.useMutation({ onSuccess: () => { setBuyerName(""); setBuyerPhone(""); buyerOrderAccess.refetch(); toast.success("Your protected pickup details are saved."); }, onError: error => toast.error(error.message) });
  const reviewQuery = trpc.marketplace.reviewsByProduct.useQuery({ productId: entry?.product.id || 1 }, { enabled: Boolean(entry?.product.id) });
  useEffect(() => {
    if (!entry) {
      if (!result.isLoading) {
        document.title = "Product not available | Siaya Mtaa Market";
        const robotsMeta = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
        if (robotsMeta) robotsMeta.content = "noindex,nofollow";
      }
      return;
    }
    const { product } = entry;
    const title = `${product.title} | Siaya Mtaa Market`;
    const baseDescription = product.description?.trim() || `Browse ${product.title} from local sellers in Siaya.`;
    const fullDescription = `${baseDescription} Confirm availability and hand-off details with Siaya Mtaa Market.`.replace(/\s+/g, " ");
    const description = fullDescription.length > 158 ? `${fullDescription.slice(0, 157).trimEnd()}…` : fullDescription;
    const canonical = `https://www.siayaonlinemarket.online/products/${encodeURIComponent(product.slug)}`;
    const setMeta = (selector: string, attribute: "name" | "property", attributeValue: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, attributeValue);
        document.head.appendChild(element);
      }
      element.content = value;
    };
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", "index,follow");
    setMeta('meta[property="og:type"]', "property", "og:type", "product");
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Siaya Mtaa Market");
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    const imageUrl = product.imageUrl ? new URL(product.imageUrl, window.location.origin).toString() : "";
    if (imageUrl) {
      setMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);
    }
    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.rel = "canonical";
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonical;
  }, [entry, result.isLoading]);
  if (result.isLoading) return <MarketplaceLayout><div className="page-loading">Loading product…</div></MarketplaceLayout>;
  if (!entry) return <MarketplaceLayout><div className="not-found-market"><Box /><h1>That product is not available.</h1><Link href="/">Return to discovery</Link></div></MarketplaceLayout>;
  const { product, category } = entry;
  const add = () => {
    if (typeof product.id !== "number") return;
    for (let index = 0; index < quantity; index++) addItem({ id: product.id, slug: product.slug, title: product.title, price: Number(product.price), category: category.slug });
    toast.success(`${quantity} item${quantity > 1 ? "s" : ""} added to your basket`);
  };
  const confirmHubOrder = () => {
    if (!session) return toast.error("Sign in with your verified email session before placing an order.");
    if (typeof product.id !== "string") return toast.error("This controlled collection request is available for active V3 listings.");
    if (!buyerOrderAccess.data?.hasName || !buyerOrderAccess.data?.hasPhone) return toast.error("Save your name and Kenyan order contact before placing an order.");
    confirmV3Order.mutate({ productId: product.id, quantity, pickupPreference });
  };
  const saveBuyerDetails = () => {
    if (!session) return toast.error("Sign in with your verified email session before saving protected collection details.");
    saveBuyerOrderProfile.mutate({ fullName: buyerOrderAccess.data?.hasName ? undefined : buyerName, phone: buyerOrderAccess.data?.hasPhone ? undefined : buyerPhone });
  };
  const availabilityMessage = product.availabilityStatus === "ready" ? "This listing is marked ready. MtaaMarket confirms the final fulfilment instruction after your order request." : product.availabilityStatus === "seller_confirmed" ? "This item needs a seller availability check. MtaaMarket will confirm before you are asked to pay." : "This is a special-order item. MtaaMarket will confirm the genuine availability and next step first.";
  const paymentMessage = product.paymentTiming === "pay_before" ? "Payment is required only after MtaaMarket confirms preparation." : product.paymentTiming === "pay_on_collection" ? "Payment timing is set for collection after MtaaMarket confirmation." : product.paymentTiming === "pay_on_delivery" ? "Payment timing is set for delivery after MtaaMarket confirmation." : "MtaaMarket confirms the correct payment instruction before collection or delivery.";
  const reviews = (reviewQuery.data || []) as PublicReview[];
  const needsBuyerDetails = !buyerOrderAccess.data?.hasName || !buyerOrderAccess.data?.hasPhone;
  const canSaveBuyerDetails = (!buyerOrderAccess.data?.hasName ? Boolean(buyerName.trim()) : true) && (!buyerOrderAccess.data?.hasPhone ? Boolean(buyerPhone.trim()) : true);
  return <MarketplaceLayout><div className="detail-page"><Link href="/" className="back-link"><ArrowLeft size={17} /> Back to Siaya market</Link><div className="detail-grid"><ProductVisual category={category.slug} title={product.title} imageUrl={product.imageUrl} large /><div className="detail-info"><p className="product-category">{category.name}{entry.vendor?.storeName ? ` · ${entry.vendor.storeName}` : " · MtaaMarket Select"}</p><h1>{product.title}</h1><p className="detail-price">{formatKes(product.price)}</p><p className="sample-banner"><ShieldCheck size={17} /> {availabilityMessage}</p><p className="detail-description">{product.description}</p>{typeof product.id === "string" && <div className="rounded-xl border border-[#d8e3dc] bg-[#f4f8f5] p-4 text-sm"><strong>Preferred Siaya pickup area</strong><p className="mt-2">Choose a town or preferred collection area. MtaaMarket will confirm the actual pickup point after checking your order. No payment is collected here.</p>{orderPlacedId ? <p className="mt-3 font-semibold text-[#0e2f27]">Order placed. Your reference is #{orderPlacedId.slice(0, 8)}. Check your account for updates.</p> : !session ? <p className="mt-3">Sign in with your verified email session before saving your protected order details or placing an order.</p> : buyerOrderAccess.isLoading ? <p className="mt-3" aria-live="polite">Checking your protected collection details…</p> : needsBuyerDetails ? <><p className="mt-3">Add your name and Kenyan contact once so MtaaMarket can manage your order. Your contact is kept private from other buyers and public visitors.</p>{!buyerOrderAccess.data?.hasName && <label className="mt-3 block">Name for this collection request<input className="mt-1 w-full rounded border p-2" value={buyerName} onChange={event => setBuyerName(event.target.value)} placeholder="Your name" autoComplete="name" /></label>}{!buyerOrderAccess.data?.hasPhone && <label className="mt-3 block">Kenyan order contact number<input className="mt-1 w-full rounded border p-2" value={buyerPhone} onChange={event => setBuyerPhone(event.target.value)} placeholder="2547…" inputMode="tel" autoComplete="tel" /></label>}<p className="mt-2 text-xs text-muted-foreground">Saved privately to your verified account for order updates. You can update these details later in your account.</p><button className="basket-button mt-3" disabled={saveBuyerOrderProfile.isPending || !canSaveBuyerDetails} onClick={saveBuyerDetails}>{saveBuyerOrderProfile.isPending ? "Saving details…" : "Save collection details & continue"}</button></> : <><p className="mt-3 text-xs text-muted-foreground">Using your verified order contact ending {buyerOrderAccess.data?.maskedPhone?.slice(-3)}.</p><label className="mt-3 block text-sm">Preferred pickup town or area<input className="mt-1 w-full rounded border p-2" value={pickupPreference} onChange={event => setPickupPreference(event.target.value)} maxLength={180} placeholder="e.g. Siaya Town, Bondo, Ugunja" autoComplete="address-level2" /></label><p className="mt-2 text-xs text-muted-foreground">This is a preference, not a booked collection point. Do not enter your home address.</p><button className="basket-button mt-3" disabled={confirmV3Order.isPending || pickupPreference.trim().length < 2} onClick={confirmHubOrder}>{confirmV3Order.isPending ? "Placing order…" : `Place order · ${formatKes(Number(product.price) * quantity)}`}</button></>}</div>}<div className="detail-quantity"><span>Quantity</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button><strong>{quantity}</strong><button onClick={() => setQuantity(Math.min(product.stockQuantity || 1, quantity + 1))}><Plus size={16} /></button></div></div>{typeof product.id === "number" && <button className="basket-button" onClick={add}><ShoppingBag size={18} /> Add to basket · {formatKes(Number(product.price) * quantity)}</button>}<div className="detail-reassurance"><span><MapPin size={17} /> Choose your Siaya fulfilment preference</span><span><Check size={17} /> {paymentMessage}</span></div></div></div><section className="verified-reviews"><div><p className="eyebrow">Verified purchase feedback</p><h2>Reviews</h2></div>{reviewQuery.isLoading ? <p className="review-status">Loading verified purchase feedback…</p> : reviews.length ? <div className="review-list">{reviews.map(({ review, reviewer }) => <article key={review.id} className="review-card"><div><strong>{reviewer.displayName}</strong><span>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</span></div>{review.comment && <p>{review.comment}</p>}<small>Verified order review</small></article>)}</div> : <div className="review-empty"><Star size={21} /><div><strong>No verified purchase reviews yet.</strong><p>Reviews can only be added after a completed marketplace order.</p></div></div>}</section></div></MarketplaceLayout>;
}
