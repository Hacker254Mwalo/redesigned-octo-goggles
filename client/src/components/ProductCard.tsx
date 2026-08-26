import { useCart } from "@/contexts/CartContext";
import { ProductVisual } from "@/components/ProductVisual";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export type ProductCardData = { id: string | number; slug: string; title: string; price: string | number; category: { slug: string; name: string }; product: { title: string; stockQuantity: number; price: string | number; slug: string; id: string | number; imageUrl?: string | null; itemCondition?: "new" | "used" | "refurbished"; availabilityStatus?: "ready" | "seller_confirmed" | "special_order"; sourceType?: "mtaa_select" | "approved_seller" | "special_order" }; vendor?: { storeName: string } | null; };

export function formatKes(value: string | number) { return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(value)); }

export function ProductCard({ entry }: { entry: ProductCardData }) {
  const { addItem } = useCart();
  const product = entry.product;
  const add = () => {
    if (typeof product.id !== "number") {
      toast.message("Online ordering is being activated. Please use the Request Desk and MtaaMarket will confirm the next step.");
      return;
    }
    addItem({ id: product.id, slug: product.slug, title: product.title, price: Number(product.price), category: entry.category.slug });
    toast.success("Added to your basket");
  };
  return <article className="product-card">
    <Link href={`/products/${product.slug}`} className="product-image-link"><ProductVisual category={entry.category.slug} title={product.title} imageUrl={product.imageUrl} /><span className="open-product"><ArrowUpRight size={16} /></span></Link>
    <div className="product-card-body"><p className="product-category">{entry.category.name}</p><Link href={`/products/${product.slug}`} className="product-title">{product.title}</Link><div className="product-price-row"><strong>{formatKes(product.price)}</strong><button className="add-to-basket" onClick={add} aria-label={typeof product.id === "number" ? `Add ${product.title} to basket` : `Request ${product.title} through MtaaMarket`}><ShoppingBag size={16} /></button></div><p className="sample-note">{typeof product.id !== "number" ? "Request through MtaaMarket · confirmation first" : entry.vendor?.storeName ? `Approved seller · ${entry.vendor.storeName}` : product.sourceType === "mtaa_select" ? "MtaaMarket Select" : product.availabilityStatus === "special_order" ? "Special order · confirm first" : `${product.itemCondition || "new"} item · fulfilment confirmed by MtaaMarket`}</p></div>
  </article>;
}
