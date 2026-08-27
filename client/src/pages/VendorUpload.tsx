import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { AI_LISTING_MANUAL_FALLBACK, getManualListingCopyGuidance, prepareListingImageForSubmission } from "@/lib/ai-listing";
import { trpc } from "@/lib/trpc";
import { V3_LISTING_CATEGORIES, type V3ListingCategorySlug } from "@shared/v3-listing";
import { useRef, useState } from "react";
import { toast } from "sonner";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 5_000_000;

export default function VendorUpload() {
  const { configured, loading, session } = useSupabaseAuth();
  const fileInput = useRef<HTMLInputElement>(null);
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
  const [showDescriptionGuidance, setShowDescriptionGuidance] = useState(false);
  const [imageData, setImageData] = useState("");
  const [imageType, setImageType] = useState<(typeof ACCEPTED_IMAGE_TYPES)[number] | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imagePreparationMessage, setImagePreparationMessage] = useState<string>(AI_LISTING_MANUAL_FALLBACK.image);
  const [formError, setFormError] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const vendorAccess = trpc.marketplace.v3VendorAccess.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const applyForVendor = trpc.marketplace.applyForV3Vendor.useMutation({
    onSuccess: () => {
      setAgreementAccepted(false);
      vendorAccess.refetch();
      toast.success("Your agreement and vendor request are recorded for owner review.");
    },
    onError: error => toast.error(error.message),
  });

  const submit = trpc.marketplace.submitV3VendorProduct.useMutation({
    onSuccess: () => {
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
      setShowDescriptionGuidance(false);
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      setImagePreparationMessage(AI_LISTING_MANUAL_FALLBACK.image);
      if (fileInput.current) fileInput.current.value = "";
      toast.success("Listing submitted for owner review.");
    },
    onError: error => {
      setFormError(error.message);
      toast.error(error.message);
    },
  });

  function chooseImage(file: File | undefined) {
    setFormError("");
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      return setFormError("Choose a JPEG, PNG, or WebP image.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageData("");
      setImageType(null);
      setSelectedFileName("");
      return setFormError("Choose an image smaller than 5 MB.");
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const prepared = await prepareListingImageForSubmission({ imageData: String(reader.result), imageType: file.type as (typeof ACCEPTED_IMAGE_TYPES)[number] });
      setImageData(prepared.imageData);
      setImageType(prepared.imageType);
      setSelectedFileName(file.name);
      setImagePreparationMessage(prepared.message);
    };
    reader.onerror = () => setFormError("MtaaMarket could not read that image. Please choose another file.");
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!imageData || !imageType) return setFormError("Choose a supported product image before submitting.");
    if (!categorySlug) return setFormError("Choose the product category before submitting.");
    const quantity = Number(stockQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return setFormError("Enter at least one available item.");
    const isLivestock = categorySlug === "poultry-livestock";
    if (isLivestock && allowPayOnPickup) return setFormError("Poultry and livestock listings use manual MtaaMarket handover confirmation, not hub pickup.");
    submit.mutate({ title, description: description || undefined, categorySlug, price: Number(price), stockQuantity: quantity, allowPayOnPickup, livestockType: isLivestock ? livestockType : undefined, livestockDetails: isLivestock ? livestockDetails : undefined, livestockWelfareAttested: isLivestock ? livestockWelfareAttested : undefined, livestockMovementAcknowledged: isLivestock ? livestockMovementAcknowledged : undefined, imageData, imageType });
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-xl px-5 py-14">
        <p className="eyebrow">Approved vendor workspace</p>
        <h1 className="mt-2 text-4xl font-semibold">Submit a product</h1>
        <p className="mt-3 text-muted-foreground">Every listing is owner-reviewed before it can appear publicly. Add an original product photo, accurate category, price, and available quantity for Siaya buyers.</p>

        {!configured && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Vendor access is being prepared</h2><p className="mt-2 text-sm text-muted-foreground">Email account access is not available in this environment yet. Please return after it has been configured.</p></section>}
        {configured && loading && <section className="mt-8 rounded-2xl border bg-white p-6" aria-live="polite"><h2 className="font-semibold">Checking your email session</h2><p className="mt-2 text-sm text-muted-foreground">Your Vendor Studio will open once the secure session check is complete.</p></section>}
        {configured && !loading && !session && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Sign in before submitting</h2><p className="mt-2 text-sm text-muted-foreground">Use the Account menu in the header to sign in with your verified MtaaMarket email. After the owner approves your vendor profile and records your agreement, return here to submit a listing.</p></section>}

        {configured && !loading && session && vendorAccess.isLoading && <section className="mt-8 rounded-2xl border bg-white p-6" aria-live="polite"><h2 className="font-semibold">Checking your vendor access</h2><p className="mt-2 text-sm text-muted-foreground">We are confirming your agreement and owner approval before showing the secure submission form.</p></section>}
        {configured && !loading && session && vendorAccess.isError && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">Vendor access could not be checked</h2><p className="mt-2 text-sm text-muted-foreground">Refresh the page and try again. No listing has been created.</p></section>}
        {configured && !loading && session && vendorAccess.data && !vendorAccess.data.canSubmitListings && (
          <section className="mt-8 rounded-2xl border bg-white p-6">
            <h2 className="font-semibold">{vendorAccess.data.isVendor ? "Vendor approval is pending" : "Request vendor approval"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{vendorAccess.data.isVendor ? "Your agreement is recorded. The MtaaMarket owner must approve your vendor profile before you can submit a listing." : "Vendor access starts with an explicit agreement and an owner review. Your contact details remain platform-managed."}</p>
            {!vendorAccess.data.isVendor && <label className="mt-5 flex items-start gap-3 rounded-xl bg-muted p-4 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={agreementAccepted} onChange={event => setAgreementAccepted(event.target.checked)} /><span>I confirm I will provide original product information, use the platform-managed buyer communication process, and follow MtaaMarket’s physical-products rules for Siaya buyers.</span></label>}
            {!vendorAccess.data.isVendor && <button className="primary-cta mt-5" type="button" disabled={!agreementAccepted || applyForVendor.isPending} onClick={() => applyForVendor.mutate({ agreementAccepted: true })}>{applyForVendor.isPending ? "Sending request…" : "Accept agreement & request approval"}</button>}
          </section>
        )}

        {configured && !loading && session && vendorAccess.data?.canSubmitListings && (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <fieldset disabled={submit.isPending} className="space-y-5 disabled:cursor-not-allowed disabled:opacity-70">
              <label className="block text-sm font-medium">Product photo
                <input ref={fileInput} className="mt-2 block w-full rounded-lg border border-border bg-white p-2 text-sm" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => chooseImage(event.target.files?.[0])} />
                <span className="mt-2 block text-xs font-normal text-muted-foreground">JPEG, PNG, or WebP only. Up to 5 MB; maximum 6,000 pixels per side.</span>
              </label>
              {selectedFileName && <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground" aria-live="polite">Selected: {selectedFileName}</p>}
              <p className="rounded-xl border border-[#d5e8de] bg-[#f1f8f4] p-4 text-sm text-[#275847]" aria-live="polite">{imagePreparationMessage}</p>
              <label className="block text-sm font-medium">Listing title
                <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={3} maxLength={180} value={title} onChange={event => setTitle(event.target.value)} autoComplete="off" />
              </label>
              <div className="rounded-xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Listing description</span><button className="text-sm font-medium text-primary underline-offset-4 hover:underline" type="button" onClick={() => setShowDescriptionGuidance(current => !current)}>{showDescriptionGuidance ? "Hide writing guide" : "Show writing guide"}</button></div>
                {showDescriptionGuidance && <div className="mt-3 space-y-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><p><strong className="text-foreground">English:</strong> {getManualListingCopyGuidance().english}</p><p><strong className="text-foreground">Local wording:</strong> {getManualListingCopyGuidance().localTone}</p></div>}
                <textarea className="mt-3 min-h-28 w-full rounded-lg border border-border bg-white p-3 text-base" maxLength={1600} value={description} onChange={event => setDescription(event.target.value)} placeholder="Optional: add only accurate product facts for owner review." />
              </div>
              <label className="block text-sm font-medium">Category
                <select className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required value={categorySlug} onChange={event => { const nextCategory = event.target.value as V3ListingCategorySlug | ""; setCategorySlug(nextCategory); if (nextCategory === "poultry-livestock") setAllowPayOnPickup(false); else { setLivestockType(""); setLivestockDetails(""); setLivestockWelfareAttested(false); setLivestockMovementAcknowledged(false); } }}>
                  <option value="" disabled>Choose a category</option>
                  {V3_LISTING_CATEGORIES.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                </select>
              </label>
              {categorySlug === "poultry-livestock" && <fieldset className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4"><legend className="px-1 text-sm font-semibold">Poultry &amp; livestock safeguards</legend><p className="text-sm text-muted-foreground">State only verifiable animal facts. MtaaMarket does not arrange animal transport, confirm permits, or offer hub pickup for live animals. Owner review and manual confirmation are required.</p><label className="block text-sm font-medium">Animal type<input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={2} maxLength={80} value={livestockType} onChange={event => setLivestockType(event.target.value)} placeholder="For example: improved kienyeji chicken" /></label><label className="block text-sm font-medium">Factual animal details<textarea className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={10} maxLength={500} value={livestockDetails} onChange={event => setLivestockDetails(event.target.value)} placeholder="Describe only facts you can confirm for owner review." /></label><label className="flex items-start gap-3 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={livestockWelfareAttested} onChange={event => setLivestockWelfareAttested(event.target.checked)} required /><span>I confirm this animal is listed with welfare in mind and the facts I have provided are accurate to my knowledge.</span></label><label className="flex items-start gap-3 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={livestockMovementAcknowledged} onChange={event => setLivestockMovementAcknowledged(event.target.checked)} required /><span>I understand that MtaaMarket does not arrange animal transport or confirm movement requirements; any handover needs separate owner confirmation.</span></label></fieldset>}
              <label className="block text-sm font-medium">Price (KES)
                <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="decimal" min="1" max="10000000" step="1" required value={price} onChange={event => setPrice(event.target.value)} />
              </label>
              <label className="block text-sm font-medium">Quantity available
                <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="numeric" min="1" max="100000" step="1" required value={stockQuantity} onChange={event => setStockQuantity(event.target.value)} />
              </label>
              {categorySlug === "poultry-livestock" ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Manual handover only.</strong> This listing cannot offer pay on pickup or use the hub-order path. The owner confirms any permitted next step after review.</p> : <label className="flex items-start gap-3 rounded-xl border bg-white p-4 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={allowPayOnPickup} onChange={event => setAllowPayOnPickup(event.target.checked)} /><span><strong>Available for pay on pickup</strong><br /><span className="text-muted-foreground">MtaaMarket confirms the collection point and payment details before an order. Do not promise a specific hub or collection time in your listing.</span></span></label>}
              <p className="rounded-xl border border-[#d5e8de] bg-[#f1f8f4] p-4 text-sm text-[#275847]">Your profile, owner approval, and vendor agreement are checked securely when you submit. The original photo and manual listing facts create a <strong>PENDING</strong> record for owner review; image cleanup and automatic Sheng/English copy are not active.</p>
              {formError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{formError}</p>}
              <button className="primary-cta" type="submit" disabled={submit.isPending || !imageData || !imageType}>{submit.isPending ? "Submitting securely…" : "Submit for owner review"}</button>
            </fieldset>
          </form>
        )}
      </main>
    </MarketplaceLayout>
  );
}
