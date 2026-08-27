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
import { ArrowRight, CalendarClock, ClipboardList, MapPin, PackageCheck, ShieldCheck, ShoppingCart } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
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

type V3ItemRequest = {
  id: string;
  title: string;
  details: string;
  budget_hint: string | number | null;
  preferred_fulfilment: string;
  preferred_location: string | null;
  status: string;
  source_route: string | null;
  quoted_price: string | number | null;
  platform_reply: string | null;
  created_at: string;
  updated_at: string;
};

type V3JumiaOrderItem = { title: string; details: string; quantity: number };

type V3JumiaOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: "placed" | "confirming" | "accepted" | "sourcing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  payment_status: "not_due" | "paid" | "refund_due" | "refunded";
  payment_timing: "pay_on_collection" | "pay_on_delivery";
  fulfilment_method: "siaya_pickup" | "home_delivery" | "collection_point";
  preferred_location: string | null;
  delivery_schedule: string | null;
  order_note: string | null;
  quoted_amount: string | number | null;
  items: V3JumiaOrderItem[];
  owner_notes: string | null;
  cancellation_reason: string | null;
  refund_due_at: string | null;
  refund_completed_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type V3AssistedOrder = {
  id: string;
  assisted_order_number: string;
  item_request_id: string | null;
  title: string;
  details: string;
  quoted_amount: string | number | null;
  payment_timing: string;
  fulfilment_method: string;
  preferred_location: string | null;
  source_route: string;
  status: "recorded" | "confirmed" | "sourcing" | "ready" | "out_for_delivery" | "completed" | "cancelled";
  platform_notes: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  external_source_disclosure: string | null;
  external_source_confirmed_at: string | null;
  external_source_content_attested_at: string | null;
};

const requestStatusText: Record<string, string> = {
  submitted: "New request",
  reviewing: "Under review",
  quoted: "Quote ready",
  accepted: "Assisted order opened",
  sourcing: "Being sourced",
  completed: "Completed",
  unavailable: "Unavailable",
  cancelled: "Cancelled",
};

const orderStatusText: Record<V3AssistedOrder["status"], string> = {
  recorded: "Recorded",
  confirmed: "Confirmed",
  sourcing: "Sourcing",
  ready: "Ready for collection",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const nextOrderStatuses: Record<V3AssistedOrder["status"], V3AssistedOrder["status"][]> = {
  recorded: ["confirmed", "cancelled"],
  confirmed: ["sourcing", "ready", "cancelled"],
  sourcing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const jumiaOrderStatusText: Record<V3JumiaOrder["status"], string> = {
  placed: "Order placed",
  confirming: "Confirming item",
  accepted: "Accepted",
  sourcing: "Being sourced",
  ready: "Ready for collection",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

const nextJumiaOrderStatuses: Record<V3JumiaOrder["status"], V3JumiaOrder["status"][]> = {
  placed: ["confirming", "cancelled"],
  confirming: ["accepted", "cancelled"],
  accepted: ["sourcing", "cancelled"],
  sourcing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
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

function RequestReviewCard({ item, onRefresh }: { item: V3ItemRequest; onRefresh: () => void }) {
  const [status, setStatus] = useState(item.status);
  const [sourceRoute, setSourceRoute] = useState(item.source_route ?? "");
  const [quotedPrice, setQuotedPrice] = useState(item.quoted_price === null ? "" : String(item.quoted_price));
  const [platformReply, setPlatformReply] = useState(item.platform_reply ?? "");
  const [externalSourceDisclosure, setExternalSourceDisclosure] = useState("");
  const [externalContentAttestation, setExternalContentAttestation] = useState(false);
  const update = trpc.marketplace.updateV3ItemRequest.useMutation({
    onSuccess: () => { toast.success("Request review saved."); onRefresh(); },
    onError: error => toast.error(error.message),
  });
  const convert = trpc.marketplace.createV3AssistedOrderFromRequest.useMutation({
    onSuccess: () => { toast.success("Assisted Market order opened."); onRefresh(); },
    onError: error => toast.error(error.message),
  });
  const sourceChanged = sourceRoute !== (item.source_route ?? "");
  const requestClosed = ["accepted", "completed", "cancelled", "unavailable"].includes(status);
  const isExternalRoute = sourceRoute === "external_marketplace";

  useEffect(() => {
    setStatus(item.status);
    setSourceRoute(item.source_route ?? "");
    setQuotedPrice(item.quoted_price === null ? "" : String(item.quoted_price));
    setPlatformReply(item.platform_reply ?? "");
  }, [item.id, item.status, item.source_route, item.quoted_price, item.platform_reply]);

  function saveReview() {
    update.mutate({
      requestId: item.id,
      status: status as "submitted" | "reviewing" | "quoted" | "accepted" | "sourcing" | "completed" | "unavailable" | "cancelled",
      sourceRoute: sourceRoute ? sourceRoute as "mtaa_select" | "approved_vendor" | "supplier" | "external_marketplace" | "other" : undefined,
      quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
      platformReply: platformReply || undefined,
    });
  }

  function openAssistedOrder() {
    convert.mutate({
      requestId: item.id,
      externalSourceDisclosure: isExternalRoute ? externalSourceDisclosure : undefined,
      externalContentAttestation: isExternalRoute ? externalContentAttestation : undefined,
    });
  }

  return <article className="rounded-2xl border bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div><p className="eyebrow">Jumia order request</p><h3 className="mt-1 font-semibold">{item.title}</h3></div>
      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{requestStatusText[item.status] ?? item.status}</span>
    </div>
    <p className="mt-3 text-sm text-muted-foreground">{item.details}</p>
    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
      {item.budget_hint !== null && <p>Budget hint: <strong className="text-foreground">KES {Number(item.budget_hint).toLocaleString("en-KE")}</strong></p>}
      <p>Preference: <strong className="text-foreground">{item.preferred_fulfilment.replaceAll("_", " ")}</strong></p>
      {item.preferred_location && <p className="sm:col-span-2">Broad location: <strong className="text-foreground">{item.preferred_location}</strong></p>}
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium">Order confirmation status<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={status} onChange={event => setStatus(event.target.value)} disabled={requestClosed}><option value="submitted">New request</option><option value="reviewing">Under review</option><option value="quoted">Quote ready</option><option value="unavailable">Unavailable</option><option value="cancelled">Cancelled</option></select></label>
      <label className="text-sm font-medium">Fulfilment source<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={sourceRoute} onChange={event => setSourceRoute(event.target.value)} disabled={requestClosed}><option value="">Not selected</option><option value="mtaa_select">MtaaMarket selection</option><option value="approved_vendor">Approved vendor</option><option value="supplier">Manually checked supplier</option><option value="external_marketplace">External marketplace — manual</option><option value="other">Other manually confirmed route</option></select></label>
    </div>
    <label className="mt-4 block text-sm font-medium">Confirmed Jumia amount (KES, optional)<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" type="number" min="1" max="10000000" value={quotedPrice} onChange={event => setQuotedPrice(event.target.value)} disabled={requestClosed} placeholder="Only after owner review" /></label>
    <label className="mt-4 block text-sm font-medium">Customer order update or next step<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" maxLength={3000} value={platformReply} onChange={event => setPlatformReply(event.target.value)} disabled={requestClosed} placeholder="Record a concise, factual review note." /></label>
    {isExternalRoute && !requestClosed && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Founder JForce confirmation</p><p className="mt-1">This is not product approval. Record that the customer understands MtaaMarket is independently arranging the Jumia item, that the exact item and amount will be confirmed before purchase, and that payment is due only at collection or delivery.</p><textarea className="mt-3 min-h-20 w-full rounded-lg border border-amber-300 bg-white p-3 text-sm" maxLength={600} value={externalSourceDisclosure} onChange={event => setExternalSourceDisclosure(event.target.value)} placeholder="Record the customer confirmation note" /><label className="mt-3 flex items-start gap-3"><input className="mt-0.5 size-4" type="checkbox" checked={externalContentAttestation} onChange={event => setExternalContentAttestation(event.target.checked)} /><span>I confirm that I will verify the exact item, current amount, and availability through JForce before placing the order, and that the MtaaMarket wording is original.</span></label></div>}
    {item.platform_reply && <p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm"><strong>Last recorded reply:</strong> {item.platform_reply}</p>}
    <div className="mt-5 flex flex-wrap gap-2">
      <button className="primary-cta" type="button" disabled={update.isPending || requestClosed} onClick={saveReview}>{update.isPending ? "Saving…" : "Save order confirmation"}</button>
      <button className="secondary-cta" type="button" disabled={convert.isPending || update.isPending || requestClosed || sourceChanged || !sourceRoute || (isExternalRoute && (externalSourceDisclosure.trim().length < 12 || !externalContentAttestation))} onClick={openAssistedOrder}>{convert.isPending ? "Opening order…" : "Accept and open Jumia order"}<ArrowRight size={16} /></button>
    </div>
    {sourceChanged && <p className="mt-3 text-xs text-muted-foreground">Save the source route before opening an assisted order.</p>}
  </article>;
}

function AssistedOrderCard({ order, onRefresh }: { order: V3AssistedOrder; onRefresh: () => void }) {
  const [notes, setNotes] = useState(order.platform_notes ?? "");
  const [quotedAmount, setQuotedAmount] = useState(order.quoted_amount === null ? "" : String(order.quoted_amount));
  const [paymentTiming, setPaymentTiming] = useState(order.payment_timing);
  const [fulfilmentMethod, setFulfilmentMethod] = useState(order.fulfilment_method);
  const update = trpc.marketplace.updateV3AssistedOrder.useMutation({
    onSuccess: () => { toast.success("Assisted order updated."); onRefresh(); },
    onError: error => toast.error(error.message),
  });
  const nextStatuses = nextOrderStatuses[order.status].filter(next => next !== "out_for_delivery" || order.fulfilment_method === "home_delivery");

  useEffect(() => {
    setNotes(order.platform_notes ?? "");
    setQuotedAmount(order.quoted_amount === null ? "" : String(order.quoted_amount));
    setPaymentTiming(order.payment_timing);
    setFulfilmentMethod(order.fulfilment_method);
  }, [order.id, order.status, order.platform_notes, order.quoted_amount, order.payment_timing, order.fulfilment_method]);

  function saveDetails() {
    update.mutate({ assistedOrderId: order.id, status: order.status, platformNotes: notes, quotedAmount: quotedAmount ? Number(quotedAmount) : undefined, paymentTiming: paymentTiming as "pay_before" | "pay_on_collection" | "pay_on_delivery" | "confirm_with_mtaamarket", fulfilmentMethod: fulfilmentMethod as "siaya_pickup" | "home_delivery" | "collection_point" | "special_order" });
  }

  return <article className="rounded-2xl border border-[#cfe3d7] bg-[#fbfefa] p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Assisted Market order</p><h3 className="mt-1 font-semibold">{order.assisted_order_number}</h3></div><span className="shrink-0 rounded-full bg-[#e5f2e8] px-2.5 py-1 text-xs font-medium text-[#245441]">{orderStatusText[order.status]}</span></div>
    <h4 className="mt-4 font-semibold">{order.title}</h4><p className="mt-2 text-sm text-muted-foreground">{order.details}</p>
    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p>Source: <strong className="text-foreground">{order.source_route.replaceAll("_", " ")}</strong></p><p>Fulfilment: <strong className="text-foreground">{order.fulfilment_method.replaceAll("_", " ")}</strong></p>{order.preferred_location && <p>Broad location: <strong className="text-foreground">{order.preferred_location}</strong></p>}{order.quoted_amount !== null && <p>Quoted amount: <strong className="text-foreground">KES {Number(order.quoted_amount).toLocaleString("en-KE")}</strong></p>}</div>
    {order.external_source_disclosure && <details className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><summary className="cursor-pointer font-semibold">External-source confirmation recorded</summary><p className="mt-2">{order.external_source_disclosure}</p><p className="mt-2 text-xs">Original-content attestation: {order.external_source_content_attested_at ? "Recorded" : "Missing"}</p></details>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Fulfilment route<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value)}><option value="siaya_pickup">Siaya collection</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery preference</option><option value="special_order">Special-order handover</option></select></label><label className="text-sm font-medium">Payment timing<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={paymentTiming} onChange={event => setPaymentTiming(event.target.value)}><option value="confirm_with_mtaamarket">Confirm with MtaaMarket</option><option value="pay_on_collection">Pay on collection</option><option value="pay_on_delivery">Pay on delivery</option><option value="pay_before">Pay before — only after confirmation</option></select></label></div>
    <label className="mt-4 block text-sm font-medium">Private fulfillment notes<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" maxLength={3000} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Record manual sourcing, collection confirmation, or handover notes." /></label>
    <label className="mt-4 block text-sm font-medium">Confirmed amount (KES, optional)<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" type="number" min="1" max="10000000" value={quotedAmount} onChange={event => setQuotedAmount(event.target.value)} /></label>
    <div className="mt-5 flex flex-wrap gap-2"><button className="secondary-cta" type="button" disabled={update.isPending} onClick={saveDetails}>{update.isPending ? "Saving…" : "Save fulfillment details"}</button>{nextStatuses.map(next => <button className={next === "cancelled" ? "secondary-cta text-destructive" : "primary-cta"} type="button" key={next} disabled={update.isPending} onClick={() => update.mutate({ assistedOrderId: order.id, status: next })}>{next === "cancelled" ? "Cancel order" : orderStatusText[next]}</button>)}</div>
    <p className="mt-4 text-xs text-muted-foreground">This owner-only record does not place the Jumia order automatically or collect payment online. “Ready for collection” means you have confirmed the parcel and recorded the manual handover checkpoint. If JForce shows the item is unavailable before purchase, cancel this order request.</p>
  </article>;
}

function JumiaOrderCard({ order, onRefresh }: { order: V3JumiaOrder; onRefresh: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [quotedAmount, setQuotedAmount] = useState(order.quoted_amount === null ? "" : String(order.quoted_amount));
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [fulfilmentMethod, setFulfilmentMethod] = useState(order.fulfilment_method);
  const [preferredLocation, setPreferredLocation] = useState(order.preferred_location ?? "");
  const [deliverySchedule, setDeliverySchedule] = useState(order.delivery_schedule ?? "");
  const [ownerNotes, setOwnerNotes] = useState(order.owner_notes ?? "");
  const [cancellationReason, setCancellationReason] = useState(order.cancellation_reason ?? "");
  const update = trpc.marketplace.updateV3OwnerJumiaOrder.useMutation({
    onSuccess: () => { toast.success("Jumia order updated."); onRefresh(); },
    onError: error => toast.error(error.message),
  });
  const nextStatuses = nextJumiaOrderStatuses[status];

  useEffect(() => {
    setStatus(order.status);
    setQuotedAmount(order.quoted_amount === null ? "" : String(order.quoted_amount));
    setPaymentStatus(order.payment_status);
    setFulfilmentMethod(order.fulfilment_method);
    setPreferredLocation(order.preferred_location ?? "");
    setDeliverySchedule(order.delivery_schedule ?? "");
    setOwnerNotes(order.owner_notes ?? "");
    setCancellationReason(order.cancellation_reason ?? "");
  }, [order.id, order.status, order.payment_status, order.quoted_amount, order.fulfilment_method, order.preferred_location, order.delivery_schedule, order.owner_notes, order.cancellation_reason]);

  function saveDetails(nextStatus = status) {
    update.mutate({ orderId: order.id, status: nextStatus, quotedAmount: quotedAmount ? Number(quotedAmount) : undefined, paymentStatus, fulfilmentMethod, preferredLocation, deliverySchedule, ownerNotes, cancellationReason: nextStatus === "cancelled" ? cancellationReason : undefined });
  }

  return <article className="rounded-2xl border border-[#cfe3d7] bg-[#fbfefa] p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Default Jumia vendor</p><h3 className="mt-1 font-semibold">{order.order_number}</h3></div><span className="shrink-0 rounded-full bg-[#e5f2e8] px-2.5 py-1 text-xs font-medium text-[#245441]">{jumiaOrderStatusText[status]}</span></div>
    <p className="mt-4 text-sm text-muted-foreground"><strong className="text-foreground">{order.customer_name}</strong> · {order.customer_phone}</p>
    <div className="mt-4 space-y-3">{order.items.map((item, index) => <div className="rounded-xl bg-white p-3" key={`${item.title}-${index}`}><p className="font-semibold">{item.title} <span className="text-sm font-normal text-muted-foreground">× {item.quantity}</span></p><p className="mt-1 text-sm text-muted-foreground">{item.details}</p></div>)}</div>
    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p>Fulfilment: <strong className="text-foreground">{order.fulfilment_method.replaceAll("_", " ")}</strong></p><p>Payment: <strong className="text-foreground">{order.payment_status === "not_due" ? `Due at ${order.payment_timing === "pay_on_delivery" ? "delivery" : "collection"}` : order.payment_status === "refund_due" ? `Refund due by ${order.refund_due_at ? new Date(order.refund_due_at).toLocaleDateString("en-KE") : "within 3 working days"}` : order.payment_status}</strong></p>{order.preferred_location && <p><MapPin size={14} className="mr-1 inline" />{order.preferred_location}</p>}{order.delivery_schedule && <p><CalendarClock size={14} className="mr-1 inline" />{order.delivery_schedule}</p>}</div>
    {order.order_note && <p className="mt-3 rounded-xl bg-white p-3 text-sm"><strong>Customer note:</strong> {order.order_note}</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Order status<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={status} onChange={event => setStatus(event.target.value as V3JumiaOrder["status"])} disabled={status === "completed" || status === "cancelled"}>{status === "placed" && <option value="placed">Order placed</option>}{status === "confirming" && <option value="confirming">Confirming item</option>}{status === "accepted" && <option value="accepted">Accepted</option>}{status === "sourcing" && <option value="sourcing">Being sourced</option>}{status === "ready" && <option value="ready">Ready</option>}{status === "out_for_delivery" && <option value="out_for_delivery">Out for delivery</option>}{status === "completed" && <option value="completed">Completed</option>}{status === "cancelled" && <option value="cancelled">Cancelled</option>}<option value="cancelled">Cancel order</option></select></label><label className="text-sm font-medium">Fulfilment method<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value as typeof fulfilmentMethod)} disabled={status === "completed" || status === "cancelled"}><option value="siaya_pickup">Siaya collection</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery</option></select></label></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Confirmed Jumia amount (KES)<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" type="number" min="0" max="10000000" value={quotedAmount} onChange={event => setQuotedAmount(event.target.value)} /></label><label className="text-sm font-medium">Payment status<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={paymentStatus} onChange={event => setPaymentStatus(event.target.value as V3JumiaOrder["payment_status"])}><option value="not_due">Not due yet</option><option value="paid">Paid at hand-off</option><option value="refund_due">Refund due within 3 working days</option><option value="refunded">Refund completed</option></select></label></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Broad hand-off area<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} maxLength={180} /></label><label className="text-sm font-medium">Confirmed timing<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={deliverySchedule} onChange={event => setDeliverySchedule(event.target.value)} maxLength={120} /></label></div>
    <label className="mt-4 block text-sm font-medium">Founder fulfilment notes<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" value={ownerNotes} onChange={event => setOwnerNotes(event.target.value)} maxLength={3000} placeholder="Record the JForce verification, parcel reference, or hand-off note." /></label>
    {status === "cancelled" && <label className="mt-4 block text-sm font-medium">Cancellation reason<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" value={cancellationReason} onChange={event => setCancellationReason(event.target.value)} maxLength={600} placeholder="e.g. Item unavailable before purchase" /></label>}
    <div className="mt-5 flex flex-wrap gap-2"><button className="secondary-cta" type="button" disabled={update.isPending || status === "completed" || status === "cancelled"} onClick={() => saveDetails()}>{update.isPending ? "Saving…" : "Save order details"}</button>{nextStatuses.map(next => <button className={next === "cancelled" ? "secondary-cta text-destructive" : "primary-cta"} type="button" key={next} disabled={update.isPending || (next === "cancelled" && cancellationReason.trim().length < 3)} onClick={() => { setStatus(next); saveDetails(next); }}>{next === "cancelled" ? "Cancel order" : jumiaOrderStatusText[next]}</button>)}</div>
    <p className="mt-4 text-xs text-muted-foreground">This is a normal customer order with founder-managed JForce fulfilment. No product approval is involved. The order starts unpaid and becomes paid only when the parcel is handed over.</p>
  </article>;
}

export default function Admin() {
  const { configured, loading: sessionLoading, session } = useSupabaseAuth();
  const moderationQueue = trpc.marketplace.v3ModerationProducts.useQuery();
  const vendorApplications = trpc.marketplace.v3VendorApplications.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const requestQueue = trpc.marketplace.v3OwnerItemRequests.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const assistedOrderQueue = trpc.marketplace.v3OwnerAssistedOrders.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const jumiaOrderQueue = trpc.marketplace.v3OwnerJumiaOrders.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const [productToDelete, setProductToDelete] = useState<ModerationProduct | null>(null);
  const bootstrapOwner = trpc.marketplace.bootstrapV3Owner.useMutation({
    onSuccess: () => {
      toast.success("Founder owner access is activated.");
      moderationQueue.refetch();
      vendorApplications.refetch();
      requestQueue.refetch();
      assistedOrderQueue.refetch();
      jumiaOrderQueue.refetch();
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
  const refreshOwnerQueues = () => { requestQueue.refetch(); assistedOrderQueue.refetch(); jumiaOrderQueue.refetch(); };

  function updateProduct(productId: string, status: "ACTIVE" | "REJECTED" | "FLAGGED") {
    moderate.mutate({ productId, status });
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-5xl px-5 py-14">
        <p className="eyebrow">Owner operations</p>
        <h1 className="mt-2 text-4xl font-semibold">Founder operations</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Manage local marketplace moderation and Jumia Assisted Orders from one founder workspace. Local vendor accounts use the one-time approval gate; customer Jumia orders do not require product approval and remain in the JForce confirmation queue until you accept or cancel them.</p>

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
        {!moderationQueue.isError && !moderationQueue.isLoading && <>
          <section className="mt-12 border-t pt-10">
            <div className="flex items-start gap-3"><ShoppingCart className="mt-1 text-[#1b6a55]" aria-hidden="true" /><div><p className="eyebrow">Default Jumia vendor</p><h2 className="mt-2 text-2xl font-semibold">Normal customer orders</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">These orders do not go through product approval. Customers place them unpaid; confirm the item through JForce, accept or cancel before purchase, arrange collection or home delivery, and record payment only at hand-off.</p></div></div>
            {jumiaOrderQueue.isError && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">MtaaMarket could not load the Jumia fulfilment queue. No order action was taken.</p>}
            {jumiaOrderQueue.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading Jumia customer orders…</p>}
            {jumiaOrderQueue.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No Jumia customer orders have been placed yet.</p>}
            {jumiaOrderQueue.data && jumiaOrderQueue.data.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-2">{jumiaOrderQueue.data.map(order => <JumiaOrderCard order={order as V3JumiaOrder} key={order.id} onRefresh={refreshOwnerQueues} />)}</div>}
          </section>
          <section className="mt-12 border-t pt-10">
            <div className="flex items-start gap-3"><ClipboardList className="mt-1 text-[#1b6a55]" aria-hidden="true" /><div><p className="eyebrow">Request Desk</p><h2 className="mt-2 text-2xl font-semibold">Private item requests</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review custom requests, record a manual route or quote, and open a protected Assisted Market order when you decide to serve the buyer. Buyer phone numbers and exact addresses stay out of this review queue.</p></div></div>
            {requestQueue.isError && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">MtaaMarket could not load the Request Desk queue. No request action was taken.</p>}
            {requestQueue.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading private requests…</p>}
            {requestQueue.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No Request Desk submissions have been recorded yet.</p>}
            {requestQueue.data && requestQueue.data.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-2">{requestQueue.data.map(item => <RequestReviewCard item={item as V3ItemRequest} key={item.id} onRefresh={refreshOwnerQueues} />)}</div>}
          </section>
          <section className="mt-12 border-t pt-10">
            <div className="flex items-start gap-3"><PackageCheck className="mt-1 text-[#1b6a55]" aria-hidden="true" /><div><p className="eyebrow">Assisted Market</p><h2 className="mt-2 text-2xl font-semibold">Owner fulfillment dashboard</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Progress only the protected owner records you have manually confirmed. Ready means a MtaaMarket collection or handover checkpoint has been recorded; it does not activate payment, courier, or supplier checkout.</p></div></div>
            {assistedOrderQueue.isError && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">MtaaMarket could not load Assisted Market orders. No fulfillment action was taken.</p>}
            {assistedOrderQueue.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading Assisted Market orders…</p>}
            {assistedOrderQueue.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No owner-managed assisted orders have been opened yet.</p>}
            {assistedOrderQueue.data && assistedOrderQueue.data.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-2">{assistedOrderQueue.data.map(order => <AssistedOrderCard order={order as V3AssistedOrder} key={order.id} onRefresh={refreshOwnerQueues} />)}</div>}
          </section>
        </>}
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
