import { trpc } from "@/lib/trpc";
import { prepareListingImageForSubmission } from "@/lib/ai-listing";
import { V3_LISTING_CATEGORIES, type V3ListingCategorySlug } from "@shared/v3-listing";
import { PencilLine, Save, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 5_000_000;
type ImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];
type ListingStatus = "ACTIVE" | "PENDING" | "FLAGGED" | "REJECTED";
type VendorListing = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  image_url: string;
  base_price: number | string;
  final_price: number | string;
  stock_quantity: number;
  allow_pay_on_pickup: boolean;
  livestock_type: string | null;
  livestock_details: string | null;
  livestock_welfare_attested: boolean;
  livestock_movement_acknowledged: boolean;
  status: ListingStatus;
};

const statusCopy: Record<ListingStatus, string> = {
  ACTIVE: "Live in the market",
  PENDING: "Waiting for owner action",
  FLAGGED: "Hidden by the market team",
  REJECTED: "Removed by the market team",
};

export default function VendorListingsManager() {
  const utils = trpc.useUtils();
  const fileInput = useRef<HTMLInputElement>(null);
  const listingsQuery = trpc.marketplace.v3VendorProducts.useQuery(undefined, { retry: false });
  const [editing, setEditing] = useState<VendorListing | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState<V3ListingCategorySlug | "">("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [allowPayOnPickup, setAllowPayOnPickup] = useState(true);
  const [livestockType, setLivestockType] = useState("");
  const [livestockDetails, setLivestockDetails] = useState("");
  const [livestockWelfareAttested, setLivestockWelfareAttested] = useState(false);
  const [livestockMovementAcknowledged, setLivestockMovementAcknowledged] = useState(false);
  const [imageData, setImageData] = useState("");
  const [imageType, setImageType] = useState<ImageType | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imageMessage, setImageMessage] = useState("Your current product photo stays in place until you choose a replacement.");
  const [errorMessage, setErrorMessage] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [draftReview, setDraftReview] = useState<{ checklist: string[]; safetyNote: string } | null>(null);
  const listings = (listingsQuery.data ?? []) as VendorListing[];

  const updateListing = trpc.marketplace.updateV3VendorProduct.useMutation({
    onSuccess: async result => {
      await Promise.all([utils.marketplace.v3VendorProducts.invalidate(), utils.marketplace.products.invalidate()]);
      setEditing(null);
      setTitle("");
      setDescription("");
      setCategorySlug("");
      setPrice("");
      setStockQuantity("1");
      setAllowPayOnPickup(true);
      setLivestockType("");
      setLivestockDetails("");
      setLivestockWelfareAttested(false);
      setLivestockMovementAcknowledged(false);
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      setImageMessage("Your current product photo stays in place until you choose a replacement.");
      setErrorMessage("");
      setDraftReview(null);
      if (fileInput.current) fileInput.current.value = "";
      toast.success(result.status === "ACTIVE" ? "Your changes are saved and the listing remains live." : "Your changes are saved; the listing remains hidden until the market team restores it.");
    },
    onError: error => {
      setErrorMessage(error.message);
      toast.error(error.message);
    },
  });

  const draftCopy = trpc.marketplace.draftListingCopy.useMutation({
    onSuccess: draft => {
      setDescription(draft.description);
      setDraftReview({ checklist: draft.checklist, safetyNote: draft.safetyNote });
      setShowGuide(true);
      toast.success("Draft added for review. Check every product detail before saving.");
    },
    onError: error => toast.error(error.message),
  });

  function beginEdit(listing: VendorListing) {
    setEditing(listing);
    setTitle(listing.title);
    setDescription(listing.description || "");
    setCategorySlug(listing.category_slug as V3ListingCategorySlug);
    setPrice(String(listing.final_price));
    setStockQuantity(String(listing.stock_quantity));
    setAllowPayOnPickup(listing.allow_pay_on_pickup);
    setLivestockType(listing.livestock_type || "");
    setLivestockDetails(listing.livestock_details || "");
    setLivestockWelfareAttested(listing.livestock_welfare_attested);
    setLivestockMovementAcknowledged(listing.livestock_movement_acknowledged);
    setImageData("");
    setImageType(null);
    setSelectedFileName("");
    setImageMessage("Your current product photo stays in place until you choose a replacement.");
    setErrorMessage("");
    setDraftReview(null);
    setShowGuide(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCategorySlug("");
    setPrice("");
    setStockQuantity("1");
    setAllowPayOnPickup(true);
    setLivestockType("");
    setLivestockDetails("");
    setLivestockWelfareAttested(false);
    setLivestockMovementAcknowledged(false);
    setImageData("");
    setImageType(null);
    setSelectedFileName("");
    setImageMessage("Your current product photo stays in place until you choose a replacement.");
    setErrorMessage("");
    setDraftReview(null);
    setShowGuide(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function chooseReplacement(file: File | undefined) {
    setErrorMessage("");
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as ImageType)) {
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      return setErrorMessage("Choose a JPEG, PNG, or WebP image.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      return setErrorMessage("Choose an image smaller than 5 MB.");
    }
    const reader = new FileReader();
    reader.onerror = () => setErrorMessage("MtaaMarket could not read that image. Please choose another file.");
    reader.onload = async () => {
      try {
        const prepared = await prepareListingImageForSubmission({ imageData: String(reader.result), imageType: file.type as ImageType });
        setImageData(prepared.imageData);
        setImageType(prepared.imageType);
        setSelectedFileName(file.name);
        setImageMessage(prepared.message);
      } catch {
        setErrorMessage("MtaaMarket could not prepare that image. Please choose another file.");
      }
    };
    reader.readAsDataURL(file);
  }

  function saveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setErrorMessage("");
    if (!categorySlug) return setErrorMessage("Choose a product category before saving.");
    const quantity = Number(stockQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return setErrorMessage("Enter at least one available item.");
    const isLivestock = categorySlug === "poultry-livestock";
    if (isLivestock && allowPayOnPickup) return setErrorMessage("Poultry and livestock listings use manual MtaaMarket handover confirmation, not hub pickup.");
    updateListing.mutate({
      productId: editing.id,
      title,
      description: description || undefined,
      categorySlug,
      price: Number(price),
      stockQuantity: quantity,
      allowPayOnPickup,
      livestockType: isLivestock ? livestockType : undefined,
      livestockDetails: isLivestock ? livestockDetails : undefined,
      livestockWelfareAttested: isLivestock ? livestockWelfareAttested : undefined,
      livestockMovementAcknowledged: isLivestock ? livestockMovementAcknowledged : undefined,
      ...(imageData && imageType ? { imageData, imageType } : {}),
    });
  }

  return (
    <section className="seller-listings-panel" aria-labelledby="seller-listings-heading">
      <div className="seller-panel-heading">
        <div>
          <p className="eyebrow">Your catalogue</p>
          <h2 id="seller-listings-heading">Manage your listings</h2>
          <p>Update price, availability, details, or photo for the products you own.</p>
        </div>
        <span className="seller-listing-count">{listings.length} {listings.length === 1 ? "listing" : "listings"}</span>
      </div>

      {listingsQuery.isLoading && <p className="seller-listing-message" aria-live="polite">Loading your listings…</p>}
      {listingsQuery.isError && <p className="seller-listing-message seller-listing-error" role="alert">Your listings could not be loaded. Refresh the page and try again.</p>}
      {!listingsQuery.isLoading && !listingsQuery.isError && listings.length === 0 && <p className="seller-listing-message">You have not published a product yet. Approved vendors’ listings go live as soon as the details pass the secure checks.</p>}

      {editing && (
        <form className="seller-edit-form" onSubmit={saveChanges}>
          <div className="seller-edit-heading"><div><p className="eyebrow">Edit listing</p><h3>{editing.title}</h3></div><button type="button" className="secondary-cta" onClick={cancelEdit}><X size={15} />Cancel</button></div>
          <p className="seller-edit-note">Your changes apply only to this listing. If the market team has hidden it, saving edits will not put it back online.</p>
          <label className="block text-sm font-medium">Product photo
            <input ref={fileInput} className="mt-2 block w-full rounded-lg border border-border bg-white p-2 text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void chooseReplacement(event.target.files?.[0])} />
            <span className="mt-2 block text-xs font-normal text-muted-foreground">Optional replacement: JPEG, PNG, or WebP, up to 5 MB. Maximum image size is 6,000 pixels per side.</span>
          </label>
          <div className="seller-edit-photo-preview">
            <img src={imageData || editing.image_url} alt={`Preview for ${title || editing.title}`} />
            <div><strong>{selectedFileName || "Current product photo"}</strong><span>{imageMessage}</span></div>
          </div>
          <label className="block text-sm font-medium">Listing title<input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={3} maxLength={180} value={title} onChange={event => setTitle(event.target.value)} /></label>
          <div className="seller-description-card">
            <div className="seller-edit-helper-row"><strong>Listing description</strong><div><button type="button" onClick={() => setShowGuide(value => !value)}>Writing guide</button><button type="button" className="listing-ai-button" disabled={draftCopy.isPending || title.trim().length < 4 || !categorySlug} onClick={() => { const categoryName = V3_LISTING_CATEGORIES.find(item => item.slug === categorySlug)?.name || "physical product"; draftCopy.mutate({ title, categoryName, itemCondition: "new", facts: description || undefined }); }}><Sparkles size={14} />{draftCopy.isPending ? "Drafting…" : "Improve with assistant"}</button></div></div>
            {showGuide && <p className="seller-edit-guide">Use clear, factual wording. Mention size, condition, and what is included; do not add claims you cannot verify.</p>}
            <textarea className="mt-3 min-h-28 w-full rounded-lg border border-border bg-white p-3 text-base" maxLength={1600} value={description} onChange={event => { setDescription(event.target.value); setDraftReview(null); }} placeholder="Add accurate product facts." />
            {draftReview && <div className="mt-3 rounded-lg border border-[#d5e8de] bg-[#f1f8f4] p-3 text-sm text-[#275847]"><strong>Review before saving</strong><ul className="mt-2 list-disc space-y-1 pl-5">{draftReview.checklist.map(item => <li key={item}>{item}</li>)}</ul><p className="mt-2 text-xs">{draftReview.safetyNote}</p></div>}
          </div>
          <label className="block text-sm font-medium">Category<select className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required value={categorySlug} onChange={event => { const nextCategory = event.target.value as V3ListingCategorySlug | ""; setCategorySlug(nextCategory); if (nextCategory === "poultry-livestock") setAllowPayOnPickup(false); else { setLivestockType(""); setLivestockDetails(""); setLivestockWelfareAttested(false); setLivestockMovementAcknowledged(false); } }}><option value="" disabled>Choose a category</option>{V3_LISTING_CATEGORIES.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
          {categorySlug === "poultry-livestock" && <fieldset className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4"><legend className="px-1 text-sm font-semibold">Poultry &amp; livestock safeguards</legend><p className="text-sm text-muted-foreground">State verifiable facts only. MtaaMarket confirms the manual handover separately; live animals do not use hub pickup.</p><label className="block text-sm font-medium">Animal type<input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={2} maxLength={80} value={livestockType} onChange={event => setLivestockType(event.target.value)} /></label><label className="block text-sm font-medium">Factual animal details<textarea className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={10} maxLength={500} value={livestockDetails} onChange={event => setLivestockDetails(event.target.value)} /></label><label className="flex items-start gap-3 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={livestockWelfareAttested} onChange={event => setLivestockWelfareAttested(event.target.checked)} required /><span>I confirm the welfare statement and the facts are accurate to my knowledge.</span></label><label className="flex items-start gap-3 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={livestockMovementAcknowledged} onChange={event => setLivestockMovementAcknowledged(event.target.checked)} required /><span>I understand MtaaMarket does not arrange animal transport or confirm movement requirements.</span></label></fieldset>}
          <label className="block text-sm font-medium">Price (KES)<input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="decimal" min="1" max="10000000" step="1" required value={price} onChange={event => setPrice(event.target.value)} /></label>
          <label className="block text-sm font-medium">Quantity available<input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="numeric" min="1" max="100000" step="1" required value={stockQuantity} onChange={event => setStockQuantity(event.target.value)} /></label>
          {categorySlug !== "poultry-livestock" && <label className="flex items-start gap-3 rounded-xl border bg-white p-4 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={allowPayOnPickup} onChange={event => setAllowPayOnPickup(event.target.checked)} /><span><strong>Available for pay on pickup</strong><br /><span className="text-muted-foreground">MtaaMarket confirms collection and payment details before an order.</span></span></label>}
          {errorMessage && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{errorMessage}</p>}
          <button className="primary-cta" type="submit" disabled={updateListing.isPending}>{updateListing.isPending ? "Saving securely…" : <><Save size={16} />Save listing changes</>}</button>
        </form>
      )}

      {!listingsQuery.isLoading && !listingsQuery.isError && listings.length > 0 && (
        <div className="seller-listing-grid">
          {listings.map(listing => (
            <article className="seller-listing-card" key={listing.id}>
              <img src={listing.image_url} alt={`${listing.title} product photo`} />
              <div className="seller-listing-card-body">
                <div className="seller-listing-title-row"><h3>{listing.title}</h3><span className={`seller-listing-status status-${listing.status.toLowerCase()}`}>{statusCopy[listing.status] || listing.status}</span></div>
                <p>{V3_LISTING_CATEGORIES.find(category => category.slug === listing.category_slug)?.name || "Product"} · KES {Number(listing.final_price).toLocaleString("en-KE")} · {listing.stock_quantity} available</p>
                {listing.description && <small>{listing.description}</small>}
                <button type="button" className="secondary-cta" onClick={() => beginEdit(listing)}><PencilLine size={15} />Edit listing</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
