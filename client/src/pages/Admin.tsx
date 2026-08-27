import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { getV3ListingCategory, V3_LISTING_CATEGORIES, type V3ListingCategorySlug } from "@shared/v3-listing";
import { ShieldCheck } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

type ModerationProduct = {
  id: string;
  title: string;
  description: string | null;
  category_slug: string;
  stock_quantity: number;
  image_url: string;
  vendor_id: string | null;
  final_price: string | number;
  allow_pay_on_pickup: boolean;
  livestock_type: string | null;
  livestock_details: string | null;
  livestock_welfare_attested: boolean;
  livestock_movement_acknowledged: boolean;
  status: "PENDING" | "ACTIVE" | "FLAGGED";
};

const statusText = {
  PENDING: "Awaiting review",
  ACTIVE: "Publicly visible",
  FLAGGED: "Hidden for review",
} as const;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 5_000_000;

function OwnerListingIntake({ onSubmitted }: { onSubmitted: () => void }) {
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
  const [imageData, setImageData] = useState("");
  const [imageType, setImageType] = useState<(typeof ACCEPTED_IMAGE_TYPES)[number] | null>(null);
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");
  const submit = trpc.marketplace.submitV3OwnerProduct.useMutation({
    onSuccess: () => {
      setTitle(""); setDescription(""); setCategorySlug(""); setPrice(""); setStockQuantity("1"); setAllowPayOnPickup(true); setLivestockType(""); setLivestockDetails(""); setLivestockWelfareAttested(false); setLivestockMovementAcknowledged(false); setImageData(""); setImageType(null); setFileName(""); setFormError("");
      if (fileInput.current) fileInput.current.value = "";
      onSubmitted();
      toast.success("Owner listing sent to the moderation queue.");
    },
    onError: error => setFormError(error.message),
  });

  function chooseImage(file: File | undefined) {
    setFormError("");
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) return setFormError("Choose an original JPEG, PNG, or WebP image.");
    if (file.size > MAX_IMAGE_BYTES) return setFormError("Choose an image smaller than 5 MB.");
    const reader = new FileReader();
    reader.onload = () => { setImageData(String(reader.result)); setImageType(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]); setFileName(file.name); };
    reader.onerror = () => setFormError("MtaaMarket could not read that image. Please choose another file.");
    reader.readAsDataURL(file);
  }

  function submitListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!categorySlug) return setFormError("Choose a MtaaMarket category.");
    if (!imageData || !imageType) return setFormError("Choose an original product image.");
    const quantity = Number(stockQuantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return setFormError("Enter at least one available item.");
    const isLivestock = categorySlug === "poultry-livestock";
    if (isLivestock && allowPayOnPickup) return setFormError("Poultry and livestock listings use manual MtaaMarket handover confirmation, not hub pickup.");
    submit.mutate({ title, description: description || undefined, categorySlug, price: Number(price), stockQuantity: quantity, allowPayOnPickup, livestockType: isLivestock ? livestockType : undefined, livestockDetails: isLivestock ? livestockDetails : undefined, livestockWelfareAttested: isLivestock ? livestockWelfareAttested : undefined, livestockMovementAcknowledged: isLivestock ? livestockMovementAcknowledged : undefined, imageData, imageType });
  }

  return (
    <section className="mt-8 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <p className="eyebrow">Founder inventory intake</p>
      <h2 className="mt-2 text-2xl font-semibold">Add an owner-provided listing</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Use only facts, price, quantity, and original media you are authorised to publish. This does not seed a catalogue or publish an item: it creates a <strong>PENDING</strong> owner listing for the same review controls below.</p>
      <form className="mt-6 space-y-5" onSubmit={submitListing}>
        <fieldset className="space-y-5" disabled={submit.isPending}>
          <label className="block text-sm font-medium">Original product photo
            <input ref={fileInput} className="mt-2 block w-full rounded-lg border border-border bg-white p-2 text-sm" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => chooseImage(event.target.files?.[0])} />
            <span className="mt-2 block text-xs font-normal text-muted-foreground">JPEG, PNG, or WebP only. Up to 5 MB; no supplier-page or copied media.</span>
          </label>
          {fileName && <p className="rounded-lg bg-muted px-3 py-2 text-sm" aria-live="polite">Selected: {fileName}</p>}
          <label className="block text-sm font-medium">Listing title
            <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" value={title} onChange={event => setTitle(event.target.value)} required minLength={3} maxLength={180} autoComplete="off" />
          </label>
          <label className="block text-sm font-medium">Accurate description <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea className="mt-2 min-h-28 w-full rounded-lg border border-border bg-white p-3 text-base" value={description} onChange={event => setDescription(event.target.value)} maxLength={1600} placeholder="Describe only facts you can confirm." />
          </label>
          <label className="block text-sm font-medium">Category
            <select className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" value={categorySlug} onChange={event => { const nextCategory = event.target.value as V3ListingCategorySlug | ""; setCategorySlug(nextCategory); if (nextCategory === "poultry-livestock") setAllowPayOnPickup(false); else { setLivestockType(""); setLivestockDetails(""); setLivestockWelfareAttested(false); setLivestockMovementAcknowledged(false); } }} required>
              <option value="" disabled>Choose a category</option>
              {V3_LISTING_CATEGORIES.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          </label>
          {categorySlug === "poultry-livestock" && <fieldset className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4"><legend className="px-1 text-sm font-semibold">Poultry &amp; livestock safeguards</legend><p className="text-sm text-muted-foreground">MtaaMarket does not arrange animal transport, confirm permits, or offer hub pickup for live animals. Owner review and separate manual confirmation are required.</p><label className="block text-sm font-medium">Animal type<input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={2} maxLength={80} value={livestockType} onChange={event => setLivestockType(event.target.value)} /></label><label className="block text-sm font-medium">Factual animal details<textarea className="mt-2 min-h-24 w-full rounded-lg border border-border bg-white p-3 text-base" required minLength={10} maxLength={500} value={livestockDetails} onChange={event => setLivestockDetails(event.target.value)} placeholder="Describe only facts you can confirm for owner review." /></label><label className="flex items-start gap-3 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={livestockWelfareAttested} onChange={event => setLivestockWelfareAttested(event.target.checked)} required /><span>I confirm this animal is listed with welfare in mind and the facts provided are accurate to my knowledge.</span></label><label className="flex items-start gap-3 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={livestockMovementAcknowledged} onChange={event => setLivestockMovementAcknowledged(event.target.checked)} required /><span>I understand that MtaaMarket does not arrange animal transport or confirm movement requirements; handover requires separate owner confirmation.</span></label></fieldset>}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">Price (KES)
              <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="decimal" min="1" max="10000000" step="1" value={price} onChange={event => setPrice(event.target.value)} required />
            </label>
            <label className="block text-sm font-medium">Quantity available
              <input className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-base" type="number" inputMode="numeric" min="1" max="100000" step="1" value={stockQuantity} onChange={event => setStockQuantity(event.target.value)} required />
            </label>
          </div>
          {categorySlug === "poultry-livestock" ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong>Manual handover only.</strong> This listing cannot offer pay on pickup or use the hub-order path.</p> : <label className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4 text-sm"><input className="mt-0.5 size-4" type="checkbox" checked={allowPayOnPickup} onChange={event => setAllowPayOnPickup(event.target.checked)} /><span><strong>Offer pay on pickup</strong><br /><span className="text-muted-foreground">MtaaMarket confirms the collection point and payment details before any buyer order.</span></span></label>}
          {formError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{formError}</p>}
          <button className="primary-cta" type="submit" disabled={submit.isPending || !imageData || !imageType}>{submit.isPending ? "Sending for review…" : "Add to moderation queue"}</button>
        </fieldset>
      </form>
    </section>
  );
}

export default function Admin() {
  const { configured, loading: sessionLoading, session } = useSupabaseAuth();
  const moderationQueue = trpc.marketplace.v3ModerationProducts.useQuery();
  const vendorApplications = trpc.marketplace.v3VendorApplications.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const [productToDelete, setProductToDelete] = useState<ModerationProduct | null>(null);
  const bootstrapOwner = trpc.marketplace.bootstrapV3Owner.useMutation({
    onSuccess: () => {
      toast.success("Founder owner access is activated.");
      moderationQueue.refetch();
      vendorApplications.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const updateVendorApproval = trpc.marketplace.updateV3VendorApproval.useMutation({
    onSuccess: result => {
      toast.success(result.isApproved ? "Vendor approved for listings." : "Vendor listing access suspended.");
      vendorApplications.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const moderate = trpc.marketplace.moderateV3Product.useMutation({
    onSuccess: () => {
      toast.success("Product moderation recorded.");
      moderationQueue.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.marketplace.deleteV3Product.useMutation({
    onSuccess: () => {
      setProductToDelete(null);
      toast.success("Product permanently removed.");
      moderationQueue.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const actionPending = moderate.isPending || remove.isPending;

  function updateProduct(productId: string, status: "ACTIVE" | "REJECTED" | "FLAGGED") {
    moderate.mutate({ productId, status });
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-5xl px-5 py-14">
        <p className="eyebrow">Owner operations</p>
        <h1 className="mt-2 text-4xl font-semibold">Product moderation</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Only the verified MtaaMarket owner role can review products. This queue includes listings awaiting review, publicly visible listings, and hidden flagged listings. Only active products appear in public discovery.</p>

        {moderationQueue.isError && <section className="mt-8 rounded-2xl border bg-white p-6"><ShieldCheck className="mb-3" aria-hidden="true" /><h2 className="font-semibold">Owner access required</h2><p className="mt-2 text-sm text-muted-foreground">Sign in with the verified founder email session to review listings. No product data is shown until the server confirms the owner role.</p>{configured && !sessionLoading && !session && <p className="mt-4 text-sm font-medium">Use the Account menu in the header to sign in first.</p>}{configured && !sessionLoading && session && <button className="primary-cta mt-5" disabled={bootstrapOwner.isPending} onClick={() => bootstrapOwner.mutate()}>{bootstrapOwner.isPending ? "Activating…" : "Founder: activate owner access"}</button>}</section>}
        {moderationQueue.isLoading && <section className="mt-8 rounded-2xl border bg-white p-6" aria-live="polite"><h2 className="font-semibold">Loading the moderation queue</h2><p className="mt-2 text-sm text-muted-foreground">Checking your owner access and current listing states.</p></section>}
        {!moderationQueue.isError && !moderationQueue.isLoading && moderationQueue.data && <OwnerListingIntake onSubmitted={() => moderationQueue.refetch()} />}
        {!moderationQueue.isError && !moderationQueue.isLoading && moderationQueue.data?.length === 0 && <section className="mt-8 rounded-2xl border bg-white p-6"><h2 className="font-semibold">No listings need review</h2><p className="mt-2 text-sm text-muted-foreground">New approved-vendor submissions will appear here as awaiting review.</p></section>}

        {!moderationQueue.isError && moderationQueue.data && moderationQueue.data.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {moderationQueue.data.map((product: ModerationProduct) => (
              <article className="rounded-2xl border bg-white p-5 shadow-sm" key={product.id}>
                <img className="h-44 w-full rounded-xl object-cover" src={product.image_url} alt={`${product.title} listing image`} />
                <div className="mt-4 flex items-start justify-between gap-3"><h2 className="font-semibold">{product.title}</h2><span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{statusText[product.status]}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">Vendor: {product.vendor_id ? "Approved vendor listing" : "Owner listing"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Category: {getV3ListingCategory(product.category_slug)?.name ?? "Uncategorised"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Available quantity: {product.stock_quantity.toLocaleString("en-KE")}</p>
                {product.description && <p className="mt-3 text-sm text-muted-foreground">{product.description}</p>}
                {product.category_slug === "poultry-livestock" && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p><strong>Animal type:</strong> {product.livestock_type || "Missing"}</p><p className="mt-1"><strong>Details:</strong> {product.livestock_details || "Missing"}</p><p className="mt-1"><strong>Welfare statement:</strong> {product.livestock_welfare_attested ? "Recorded" : "Missing"}</p><p className="mt-1"><strong>Manual-handover acknowledgement:</strong> {product.livestock_movement_acknowledged ? "Recorded" : "Missing"}</p></div>}
                <p className="mt-1 text-sm text-muted-foreground">Pay on pickup: {product.allow_pay_on_pickup ? "Requested — confirm collection details" : "Not requested"}</p>
                <p className="mt-1 font-medium">KES {Number(product.final_price).toLocaleString("en-KE")}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.status !== "ACTIVE" && <button className="primary-cta" disabled={actionPending} onClick={() => updateProduct(product.id, "ACTIVE")}>{product.status === "FLAGGED" ? "Restore active" : "Approve listing"}</button>}
                  {product.status === "ACTIVE" && <button className="secondary-cta" disabled={actionPending} onClick={() => updateProduct(product.id, "FLAGGED")}>Flag & hide</button>}
                  {product.status !== "ACTIVE" && <button className="secondary-cta" disabled={actionPending} onClick={() => updateProduct(product.id, "REJECTED")}>Reject</button>}
                  <button className="secondary-cta" disabled={actionPending} onClick={() => setProductToDelete(product)}>Delete permanently</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!moderationQueue.isError && !moderationQueue.isLoading && <section className="mt-12 border-t pt-10"><p className="eyebrow">Vendor governance</p><h2 className="mt-2 text-2xl font-semibold">Agreement-backed vendor applications</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Approve vendors only after confirming their identity and agreement outside the public marketplace. Suspending access stops new listing submissions; it does not delete their past listing records.</p>{vendorApplications.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading vendor applications…</p>}{vendorApplications.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No vendor applications have been submitted yet.</p>}{vendorApplications.data && vendorApplications.data.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{vendorApplications.data.map(application => <article className="rounded-2xl border bg-white p-5" key={application.id}><h3 className="font-semibold">{application.fullName || "Vendor application"}</h3><p className="mt-2 text-sm text-muted-foreground">Agreement: {application.agreementAcceptedAt ? "Recorded" : "Missing"}</p><p className="mt-1 text-sm text-muted-foreground">Status: {application.isApproved ? "Approved" : "Pending or suspended"}</p><button className="primary-cta mt-5" disabled={updateVendorApproval.isPending || !application.agreementAcceptedAt} onClick={() => updateVendorApproval.mutate({ profileId: application.id, approved: !application.isApproved })}>{application.isApproved ? "Suspend listing access" : "Approve vendor"}</button></article>)}</div>}</section>}
      </main>

      <AlertDialog open={Boolean(productToDelete)} onOpenChange={open => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>{productToDelete ? `“${productToDelete.title}” will be removed from the owner queue and cannot be restored.` : "This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Keep listing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={remove.isPending} onClick={() => productToDelete && remove.mutate({ productId: productToDelete.id })}>{remove.isPending ? "Deleting…" : "Delete permanently"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MarketplaceLayout>
  );
}
