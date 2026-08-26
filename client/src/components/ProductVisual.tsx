import { Bike, House, Laptop, PackageOpen, Shirt, Smartphone, Sparkles } from "lucide-react";

const visuals: Record<string, { icon: typeof Smartphone; className: string }> = {
  "phones-tablets": { icon: Smartphone, className: "visual-coral" },
  computing: { icon: Laptop, className: "visual-blue" },
  "home-living": { icon: House, className: "visual-gold" },
  fashion: { icon: Shirt, className: "visual-plum" },
  "beauty-care": { icon: Sparkles, className: "visual-rose" },
  "sports-outdoors": { icon: Bike, className: "visual-mint" },
};

export function ProductVisual({ category, title, large = false }: { category: string; title: string; large?: boolean }) {
  const visual = visuals[category] || { icon: PackageOpen, className: "visual-blue" };
  const Icon = visual.icon;
  return <div className={`product-visual ${visual.className} ${large ? "product-visual-large" : ""}`}><span className="visual-glow" /><Icon strokeWidth={1.35} /><span className="visual-title">{title.replace("Sample Listing — ", "")}</span></div>;
}
