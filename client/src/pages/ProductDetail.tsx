import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { formatKes } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Box, Check, MapPin, Minus, Plus, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link, useRoute } from "wouter";
import { toast } from "sonner";

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
  const add = () => { for (let index = 0; index < quantity; index++) addItem({ id: product.id, slug: product.slug, title: product.title, price: Number(product.price), category: category.slug }); toast.success(`${quantity} item${quantity > 1 ? "s" : ""} added to your basket`); };
  return <MarketplaceLayout><div className="detail-page"><Link href="/" className="back-link"><ArrowLeft size={17} /> Back to discover</Link><div className="detail-grid"><ProductVisual category={category.slug} title={product.title} large /><div className="detail-info"><p className="product-category">{category.name}</p><h1>{product.title.replace("Sample Listing — ", "")}</h1><p className="detail-price">{formatKes(product.price)}</p><p className="sample-banner"><ShieldCheck size={17} /> This collection preview helps you explore the marketplace experience before verified sellers publish live stock.</p><p className="detail-description">{product.description}</p><div className="detail-quantity"><span>Quantity</span><div><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button><strong>{quantity}</strong><button onClick={() => setQuantity(Math.min(product.stockQuantity || 1, quantity + 1))}><Plus size={16} /></button></div></div><button className="basket-button" onClick={add}><ShoppingBag size={18} /> Add to basket · {formatKes(Number(product.price) * quantity)}</button><div className="detail-reassurance"><span><MapPin size={17} /> Choose pickup at checkout</span><span><Check size={17} /> Confirm payment by M-Pesa</span></div></div></div><section className="verified-reviews"><div><p className="eyebrow">Verified purchase feedback</p><h2>Reviews</h2></div>{reviewQuery.isLoading ? <p className="review-status">Loading verified purchase feedback…</p> : reviewQuery.data?.length ? <div className="review-list">{reviewQuery.data.map(({ review, reviewer }) => <article key={review.id} className="review-card"><div><strong>{reviewer.displayName}</strong><span>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</span></div>{review.comment && <p>{review.comment}</p>}<small>Verified order review</small></article>)}</div> : <div className="review-empty"><Star size={21} /><div><strong>No verified purchase reviews yet.</strong><p>Reviews can only be added after a completed marketplace order.</p></div></div>}</section></div></MarketplaceLayout>;
}
