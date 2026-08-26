import { useCart } from "@/contexts/CartContext";
import { ProductVisual } from "@/components/ProductVisual";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export type ProductCardData = { id: number; slug: string; title: string; price: string | number; category: { slug: string; name: string }; product: { title: string; stockQuantity: number; price: string | number; slug: string; id: number }; };

export function formatKes(value: string | number) { return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(value)); }

export function ProductCard({ entry }: { entry: ProductCardData }) {
  const { addItem } = useCart();
  const product = entry.product;
  const add = () => { addItem({ id: product.id, slug: product.slug, title: product.title, price: Number(product.price), category: entry.category.slug }); toast.success("Added to your basket"); };
  return <article className="product-card">
    <Link href={`/products/${product.slug}`} className="product-image-link"><ProductVisual category={entry.category.slug} title={product.title} /><span className="open-product"><ArrowUpRight size={16} /></span></Link>
    <div className="product-card-body"><p className="product-category">{entry.category.name}</p><Link href={`/products/${product.slug}`} className="product-title">{product.title.replace("Sample Listing — ", "")}</Link><div className="product-price-row"><strong>{formatKes(product.price)}</strong><button className="add-to-basket" onClick={add} aria-label={`Add ${product.title} to basket`}><ShoppingBag size={16} /></button></div><p className="sample-note">Sample catalog item</p></div>
  </article>;
}
