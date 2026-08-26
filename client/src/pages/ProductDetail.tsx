import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { formatKes } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Box, Check, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

type PublicReview = { review: { id: string | number; rating: number; comment: string | null }; reviewer: { displayName: string } };

export default function ProductDetail() {
  const [, params] = useRoute("/products/:slug");
  const result = trpc.marketplace.productBySlug.useQuery({ slug: params?.slug || "" }, { enabled: Boolean(params?.slug) });
  const { addItem } = useCart(); const [quantity, setQuantity] = useState(1);
  const entry = result.data;
  const reviewQuery = trpc.marketplace.reviewsByProduct.useQuery(
    { productId: entry?.product.id || 1 },
    { enabled: Boolean(entry?.product.id) },
  );
  if (result.isLoading) return <MarketplaceLayout><div className="page-loading">Loading product…</div></MarketplaceLayout>;
  if (!entry) return <MarketplaceLayout><div className="not-found-market"><Box /><h1>That product is not available.</h1><Link href="/">Return to discovery</Link></div></MarketplaceLayout>;
  const { product, category } = entry;
  const add = () => {
    if (typeof product.id !== "number") {
      toast.message("Online ordering is being activated. Please use the Request Desk and MtaaMarket will confirm the next step.");
      return;
    }
    for (let index = 0; index < quantity; index++) addItem({ id: product.id, slug: product.slug, title: product.title, price: Number(product.price), category: category.slug });
    toast.success(`${quantity} item${quantity > 1 ? "s" : ""} added to your basket`);
  };
  const availabilityMessage = product.availabilityStatus === "ready" ? "This listing is marked ready. MtaaMarket confirms the final fulfilment instruction after your order request." : product.availabilityStatus === "seller_confirmed" ? "This item needs a seller availability check. MtaaMarket will confirm before you are asked to pay." : "This is a special-order item. MtaaMarket will confirm the genuine availability and next step first.";
  const paymentMessage = product.paymentTiming === "pay_before" ? "Payment is required only after MtaaMarket confirms preparation." : product.paymentTiming === "pay_on_collection" ? "Payment timing is set for collection after MtaaMarket confirmation." : product.paymentTiming === "pay_on_delivery" ? "Payment timing is set for delivery after MtaaMarket confirmation." : "MtaaMarket confirms the correct payment instruction before collection or delivery.";
  const reviews = (reviewQuery.data || []) as PublicReview[];
  return <MarketplaceLayout><div className="detail-page"><Link href="/" className="back-link"><ArrowLeft size={17} /> Back to Siaya market</Link><div className="detail-grid"><ProductVisual category={category.slug} title={product.title} imageUrl={product.imageUrl} large /><div className="detail-info"><p className="product-category">{category.name}{entry.vendor?.storeName ? ` · ${entry.vendor.storeName}` : " · MtaaMarket Select"}</p><h1>{product.title}</h1><p className="detail-price">{formatKes(product.price)}</p><p className="sample-banner"><ShieldCheck size={17} /> {availabilityMessage}</p><p className="detail-description">{product.description}</p><div className="detail-quantity"><span>Quantity</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button><strong>{quantity}</strong><button onClick={() => setQuantity(Math.min(product.stockQuantity || 1, quantity + 1))}><Plus size={16} /></button></div></div><button className="basket-button" onClick={add}><ShoppingBag size={18} /> {typeof product.id === "number" ? `Add to basket · ${formatKes(Number(product.price) * quantity)}` : "Request through MtaaMarket"}</button><div className="detail-reassurance"><span><MapPin size={17} /> Choose your Siaya fulfilment preference</span><span><Check size={17} /> {paymentMessage}</span></div></div></div><section className="verified-reviews"><div><p className="eyebrow">Verified purchase feedback</p><h2>Reviews</h2></div>{reviewQuery.isLoading ? <p className="review-status">Loading verified purchase feedback…</p> : reviews.length ? <div className="review-list">{reviews.map(({ review, reviewer }) => <article key={review.id} className="review-card"><div><strong>{reviewer.displayName}</strong><span>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</span></div>{review.comment && <p>{review.comment}</p>}<small>Verified order review</small></article>)}</div> : <div className="review-empty"><Star size={21} /><div><strong>No verified purchase reviews yet.</strong><p>Reviews can only be added after a completed marketplace order.</p></div></div>}</section></div></MarketplaceLayout>;
}
