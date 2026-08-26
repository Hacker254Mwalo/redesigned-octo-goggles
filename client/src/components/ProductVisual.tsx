import { Bike, House, Laptop, PackageOpen, Shirt, Smartphone, Sparkles } from "lucide-react";

const visuals: Record<string, { icon: typeof Smartphone; className: string }> = {
  "phones-electronics": { icon: Smartphone, className: "visual-coral" },
  computing: { icon: Laptop, className: "visual-blue" },
  "home-kitchen": { icon: House, className: "visual-gold" },
  "fashion-accessories": { icon: Shirt, className: "visual-plum" },
  "beauty-personal-care": { icon: Sparkles, className: "visual-rose" },
  "groceries-household": { icon: PackageOpen, className: "visual-mint" },
  "baby-kids-toys": { icon: Bike, className: "visual-mint" },
  "farm-garden": { icon: PackageOpen, className: "visual-gold" },
};

export function ProductVisual({ category, title, imageUrl, large = false }: { category: string; title: string; imageUrl?: string | null; large?: boolean }) {
  const visual = visuals[category] || { icon: PackageOpen, className: "visual-blue" };
  const Icon = visual.icon;
  return <div className={`product-visual ${visual.className} ${large ? "product-visual-large" : ""}`}>{imageUrl ? <img className="product-photo" src={imageUrl} alt={title} /> : <><span className="visual-glow" /><Icon strokeWidth={1.35} /></>}<span className="visual-title">{title}</span></div>;
}
