import { ImageOff } from "lucide-react";

export function ProductVisual({ category, title, imageUrl, large = false }: { category: string; title: string; imageUrl?: string | null; large?: boolean }) {
  const categoryLabel = category.replaceAll("-", " ");
  return (
    <div className={`product-visual ${large ? "product-visual-large" : ""}`}>
      {imageUrl ? (
        <img className="product-photo" src={imageUrl} alt={title} />
      ) : (
        <div className="product-photo-missing" role="img" aria-label="Product photo unavailable">
          <ImageOff size={large ? 46 : 34} strokeWidth={1.25} />
          <strong>Product photo unavailable</strong>
          <small>{categoryLabel}</small>
        </div>
      )}
    </div>
  );
}
