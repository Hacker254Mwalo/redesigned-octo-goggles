import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import OwnerAccountDirectory from "@/components/OwnerAccountDirectory";
import OwnerHubOrdersPanel from "@/components/OwnerHubOrdersPanel";
import { ArrowRight, CalendarClock, ClipboardList, MapPin, PackageCheck, ShieldCheck, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
      <div><p className="eyebrow">Customer request</p><h3 className="mt-1 font-semibold">{item.title}</h3></div>
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
    <label className="mt-4 block text-sm font-medium">Confirmed amount (KES, optional)<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" type="number" min="1" max="10000000" value={quotedPrice} onChange={event => setQuotedPrice(event.target.value)} disabled={requestClosed} placeholder="Only after owner review" /></label>
    <label className="mt-4 block text-sm font-medium">Customer order update or next step<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" maxLength={3000} value={platformReply} onChange={event => setPlatformReply(event.target.value)} disabled={requestClosed} placeholder="Record a concise, factual review note." /></label>
    {isExternalRoute && !requestClosed && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-semibold">Founder JForce confirmation</p><p className="mt-1">This is not product approval. Record that the customer understands MtaaMarket is independently arranging the Jumia item, that the exact item and amount will be confirmed before purchase, and that payment is due only at collection or delivery.</p><textarea className="mt-3 min-h-20 w-full rounded-lg border border-amber-300 bg-white p-3 text-sm" maxLength={600} value={externalSourceDisclosure} onChange={event => setExternalSourceDisclosure(event.target.value)} placeholder="Record the customer confirmation note" /><label className="mt-3 flex items-start gap-3"><input className="mt-0.5 size-4" type="checkbox" checked={externalContentAttestation} onChange={event => setExternalContentAttestation(event.target.checked)} /><span>I confirm that I will verify the exact item, current amount, and availability through JForce before placing the order, and that the MtaaMarket wording is original.</span></label></div>}
    {item.platform_reply && <p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm"><strong>Last recorded reply:</strong> {item.platform_reply}</p>}
    <div className="mt-5 flex flex-wrap gap-2">
      <button className="primary-cta" type="button" disabled={update.isPending || requestClosed} onClick={saveReview}>{update.isPending ? "Saving…" : "Save order confirmation"}</button>
      <button className="secondary-cta" type="button" disabled={convert.isPending || update.isPending || requestClosed || sourceChanged || !sourceRoute || (isExternalRoute && (externalSourceDisclosure.trim().length < 12 || !externalContentAttestation))} onClick={openAssistedOrder}>{convert.isPending ? "Opening order…" : "Accept &amp; open order"}<ArrowRight size={16} /></button>
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
    <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Wider-selection order</p><h3 className="mt-1 font-semibold">{order.order_number}</h3></div><span className="shrink-0 rounded-full bg-[#e5f2e8] px-2.5 py-1 text-xs font-medium text-[#245441]">{jumiaOrderStatusText[status]}</span></div>
    <p className="mt-4 text-sm text-muted-foreground"><strong className="text-foreground">{order.customer_name}</strong> · {order.customer_phone}</p>
    <div className="mt-4 space-y-3">{order.items.map((item, index) => <div className="rounded-xl bg-white p-3" key={`${item.title}-${index}`}><p className="font-semibold">{item.title} <span className="text-sm font-normal text-muted-foreground">× {item.quantity}</span></p><p className="mt-1 text-sm text-muted-foreground">{item.details}</p></div>)}</div>
    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p>Fulfilment: <strong className="text-foreground">{order.fulfilment_method.replaceAll("_", " ")}</strong></p><p>Payment: <strong className="text-foreground">{order.payment_status === "not_due" ? `Due at ${order.payment_timing === "pay_on_delivery" ? "delivery" : "collection"}` : order.payment_status === "refund_due" ? `Refund due by ${order.refund_due_at ? new Date(order.refund_due_at).toLocaleDateString("en-KE") : "within 3 working days"}` : order.payment_status}</strong></p>{order.preferred_location && <p><MapPin size={14} className="mr-1 inline" />{order.preferred_location}</p>}{order.delivery_schedule && <p><CalendarClock size={14} className="mr-1 inline" />{order.delivery_schedule}</p>}</div>
    {order.order_note && <p className="mt-3 rounded-xl bg-white p-3 text-sm"><strong>Customer note:</strong> {order.order_note}</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Order status<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={status} onChange={event => setStatus(event.target.value as V3JumiaOrder["status"])} disabled={status === "completed" || status === "cancelled"}>{status === "placed" && <option value="placed">Order placed</option>}{status === "confirming" && <option value="confirming">Confirming item</option>}{status === "accepted" && <option value="accepted">Accepted</option>}{status === "sourcing" && <option value="sourcing">Being sourced</option>}{status === "ready" && <option value="ready">Ready</option>}{status === "out_for_delivery" && <option value="out_for_delivery">Out for delivery</option>}{status === "completed" && <option value="completed">Completed</option>}{status === "cancelled" && <option value="cancelled">Cancelled</option>}<option value="cancelled">Cancel order</option></select></label><label className="text-sm font-medium">Fulfilment method<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value as typeof fulfilmentMethod)} disabled={status === "completed" || status === "cancelled"}><option value="siaya_pickup">Siaya collection</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery</option></select></label></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Confirmed amount (KES)<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" type="number" min="0" max="10000000" value={quotedAmount} onChange={event => setQuotedAmount(event.target.value)} /></label><label className="text-sm font-medium">Payment status<select className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={paymentStatus} onChange={event => setPaymentStatus(event.target.value as V3JumiaOrder["payment_status"])}><option value="not_due">Not due yet</option><option value="paid">Paid at hand-off</option><option value="refund_due">Refund due within 3 working days</option><option value="refunded">Refund completed</option></select></label></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Broad hand-off area<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} maxLength={180} /></label><label className="text-sm font-medium">Confirmed timing<input className="mt-2 w-full rounded-lg border border-border bg-white p-3" value={deliverySchedule} onChange={event => setDeliverySchedule(event.target.value)} maxLength={120} /></label></div>
    <label className="mt-4 block text-sm font-medium">Founder fulfilment notes<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" value={ownerNotes} onChange={event => setOwnerNotes(event.target.value)} maxLength={3000} placeholder="Record the JForce verification, parcel reference, or hand-off note." /></label>
    {status === "cancelled" && <label className="mt-4 block text-sm font-medium">Cancellation reason<textarea className="mt-2 min-h-20 w-full rounded-lg border border-border bg-white p-3" value={cancellationReason} onChange={event => setCancellationReason(event.target.value)} maxLength={600} placeholder="e.g. Item unavailable before purchase" /></label>}
    <div className="mt-5 flex flex-wrap gap-2"><button className="secondary-cta" type="button" disabled={update.isPending || status === "completed" || status === "cancelled"} onClick={() => saveDetails()}>{update.isPending ? "Saving…" : "Save order details"}</button>{nextStatuses.map(next => <button className={next === "cancelled" ? "secondary-cta text-destructive" : "primary-cta"} type="button" key={next} disabled={update.isPending || (next === "cancelled" && cancellationReason.trim().length < 3)} onClick={() => { setStatus(next); saveDetails(next); }}>{next === "cancelled" ? "Cancel order" : jumiaOrderStatusText[next]}</button>)}</div>
    <p className="mt-4 text-xs text-muted-foreground">This is a normal customer order with founder-managed JForce fulfilment. No product approval is involved. The order starts unpaid and becomes paid only when the parcel is handed over.</p>
  </article>;
}

export default function Admin() {
  const { configured, loading: sessionLoading, session } = useSupabaseAuth();
  const utils = trpc.useUtils();
  const ownerAccess = trpc.marketplace.v3OwnerAccounts.useQuery({ page: 1, perPage: 1 }, { enabled: Boolean(session), retry: false });
  const vendorApplications = trpc.marketplace.v3VendorApplications.useQuery(undefined, { enabled: Boolean(session && ownerAccess.data), retry: false });
  const requestQueue = trpc.marketplace.v3OwnerItemRequests.useQuery(undefined, { enabled: Boolean(session && ownerAccess.data), retry: false });
  const assistedOrderQueue = trpc.marketplace.v3OwnerAssistedOrders.useQuery(undefined, { enabled: Boolean(session && ownerAccess.data), retry: false });
  const jumiaOrderQueue = trpc.marketplace.v3OwnerJumiaOrders.useQuery(undefined, { enabled: Boolean(session && ownerAccess.data), retry: false });
  const hubOrderQueue = trpc.marketplace.v3OwnerHubOrders.useQuery(undefined, { enabled: Boolean(session && ownerAccess.data), retry: false });
  const bootstrapOwner = trpc.marketplace.bootstrapV3Owner.useMutation({
    onSuccess: async () => {
      toast.success("Founder owner access is activated.");
      await ownerAccess.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const updateVendorApproval = trpc.marketplace.updateV3VendorApproval.useMutation({
    onSuccess: async result => {
      toast.success(result.isApproved ? "Vendor approved for automatic listing publication." : "Vendor listing access suspended.");
      await Promise.all([vendorApplications.refetch(), utils.marketplace.v3OwnerAccounts.invalidate()]);
    },
    onError: error => toast.error(error.message),
  });
  const refreshOwnerQueues = () => { requestQueue.refetch(); assistedOrderQueue.refetch(); jumiaOrderQueue.refetch(); hubOrderQueue.refetch(); };

  return (
    <MarketplaceLayout>
      <main className="owner-console-page">
        <header className="owner-console-header">
          <div>
            <p className="eyebrow">Owner operations</p>
            <h1>Run the market with clarity.</h1>
            <p>Manage buyer and vendor accounts, seller access, requests, and customer fulfilment from one protected workspace. Approved vendors publish listings automatically, so this workspace focuses on people and fulfilment.</p>
          </div>
          <aside className="owner-console-badge"><ShieldCheck size={20} /><span>OWNER ONLY</span><strong>Founder control centre</strong><small>Changes are recorded against your verified owner session.</small></aside>
        </header>
        {sessionLoading && <section className="owner-loading-card" aria-live="polite"><h2 className="font-semibold">Checking your sign-in status</h2><p className="mt-2 text-sm text-muted-foreground">Protected owner tools remain hidden until authentication is checked.</p></section>}
        {!sessionLoading && !configured && <section className="owner-access-card"><ShieldCheck className="mb-3" aria-hidden="true" /><h2 className="font-semibold">Account sign-in is unavailable</h2><p className="mt-2 text-sm text-muted-foreground">Authentication is not configured for this session. Owner records remain protected.</p></section>}
        {configured && !sessionLoading && !session && <section className="owner-access-card"><ShieldCheck className="mb-3" aria-hidden="true" /><h2 className="font-semibold">Owner access required</h2><p className="mt-2 text-sm text-muted-foreground">Sign in with the verified founder email session. Seller, account, request, and fulfilment records stay hidden until the server confirms owner access.</p><p className="mt-4 text-sm font-medium">Use the Account menu in the header to sign in first.</p></section>}
        {session && ownerAccess.isLoading && <section className="owner-loading-card" aria-live="polite"><h2 className="font-semibold">Checking founder access</h2><p className="mt-2 text-sm text-muted-foreground">Confirming your owner role before loading protected records.</p></section>}
        {session && ownerAccess.isError && <section className="owner-access-card"><ShieldCheck className="mb-3" aria-hidden="true" /><h2 className="font-semibold">Owner access required</h2><p className="mt-2 text-sm text-muted-foreground">The server has not confirmed the founder role for this session. Sign in with the verified founder email, then activate owner access if needed.</p><button className="primary-cta mt-5" disabled={bootstrapOwner.isPending} onClick={() => bootstrapOwner.mutate()}>{bootstrapOwner.isPending ? "Activating…" : "Founder: activate owner access"}</button></section>}
        {ownerAccess.data && <>
          <section className="owner-metrics" aria-label="Live owner workspace summary">
            <div><span>ACCOUNTS</span><strong>{ownerAccess.data.total == null ? "—" : ownerAccess.data.total.toLocaleString("en-KE")}</strong><small>Protected account directory</small></div>
            <div><span>SELLERS</span><strong>{vendorApplications.data ? vendorApplications.data.filter(item => !item.isApproved).length : "—"}</strong><small>Need an owner decision</small></div>
            <div><span>REQUESTS</span><strong>{requestQueue.data ? requestQueue.data.length : "—"}</strong><small>Private item requests</small></div>
            <div><span>OPEN ORDERS</span><strong>{jumiaOrderQueue.data && assistedOrderQueue.data && hubOrderQueue.data ? jumiaOrderQueue.data.filter(order => !["completed", "cancelled"].includes(order.status)).length + assistedOrderQueue.data.filter(order => !["completed", "cancelled"].includes(order.status)).length + hubOrderQueue.data.filter(order => !["COMPLETED", "CANCELLED"].includes(order.order_status)).length : "—"}</strong><small>Across the live fulfilment queues</small></div>
          </section>
          <OwnerAccountDirectory />
        </>}

        {ownerAccess.data && <section className="owner-console-section"><p className="eyebrow">Seller governance</p><h2 className="mt-2 text-2xl font-semibold">Agreement-backed vendor applications</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Approve vendors only after confirming their identity and agreement outside the public marketplace. Suspending access stops new listing submissions; it does not delete their past listing records.</p>{vendorApplications.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading vendor applications…</p>}{vendorApplications.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No vendor applications have been submitted yet.</p>}{vendorApplications.data && vendorApplications.data.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{vendorApplications.data.map(application => <article className="rounded-2xl border bg-white p-5" key={application.id}><h3 className="font-semibold">{application.fullName || "Vendor application"}</h3><p className="mt-2 text-sm text-muted-foreground">Agreement: {application.agreementAcceptedAt ? "Recorded" : "Missing"}</p><p className="mt-1 text-sm text-muted-foreground">Status: {application.isApproved ? "Approved" : "Pending or suspended"}</p><button className="primary-cta mt-5" disabled={updateVendorApproval.isPending || !application.agreementAcceptedAt} onClick={() => updateVendorApproval.mutate({ profileId: application.id, approved: !application.isApproved })}>{application.isApproved ? "Suspend listing access" : "Approve vendor"}</button></article>)}</div>}</section>}
        {ownerAccess.data && <>
          <OwnerHubOrdersPanel />
          <section className="owner-console-section owner-fulfilment-section">
            <div className="owner-section-heading"><ShoppingCart className="mt-1 text-[#1b6a55]" aria-hidden="true" /><div><p className="eyebrow">Wider-selection order</p><h2 className="mt-2 text-2xl font-semibold">Normal customer orders</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">These customer orders do not go through product approval. Confirm the current item and amount manually, accept or cancel before purchase, arrange collection or home delivery, and record payment only at hand-off.</p></div></div>
            {jumiaOrderQueue.isError && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">MtaaMarket could not load the Jumia fulfilment queue. No order action was taken.</p>}
            {jumiaOrderQueue.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading Jumia customer orders…</p>}
            {jumiaOrderQueue.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No Jumia customer orders have been placed yet.</p>}
            {jumiaOrderQueue.data && jumiaOrderQueue.data.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-2">{jumiaOrderQueue.data.map(order => <JumiaOrderCard order={order as V3JumiaOrder} key={order.id} onRefresh={refreshOwnerQueues} />)}</div>}
          </section>
          <section className="owner-console-section">
            <div className="owner-section-heading"><ClipboardList className="mt-1 text-[#1b6a55]" aria-hidden="true" /><div><p className="eyebrow">Request Desk</p><h2 className="mt-2 text-2xl font-semibold">Private item requests</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review custom requests, record a manual route or quote, and open a protected order only when you decide to serve the buyer. Buyer phone numbers and exact addresses stay out of this review queue.</p></div></div>
            {requestQueue.isError && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">MtaaMarket could not load the Request Desk queue. No request action was taken.</p>}
            {requestQueue.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading private requests…</p>}
            {requestQueue.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No Request Desk submissions have been recorded yet.</p>}
            {requestQueue.data && requestQueue.data.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-2">{requestQueue.data.map(item => <RequestReviewCard item={item as V3ItemRequest} key={item.id} onRefresh={refreshOwnerQueues} />)}</div>}
          </section>
          <section className="owner-console-section">
            <div className="owner-section-heading"><PackageCheck className="mt-1 text-[#1b6a55]" aria-hidden="true" /><div><p className="eyebrow">Fulfilment control</p><h2 className="mt-2 text-2xl font-semibold">Owner fulfillment dashboard</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Progress only the protected owner records you have manually confirmed. Ready means a MtaaMarket collection or handover checkpoint has been recorded; it does not activate payment or an outside checkout.</p></div></div>
            {assistedOrderQueue.isError && <p className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">MtaaMarket could not load Assisted Market orders. No fulfillment action was taken.</p>}
            {assistedOrderQueue.isLoading && <p className="mt-5 text-sm text-muted-foreground" aria-live="polite">Loading Assisted Market orders…</p>}
            {assistedOrderQueue.data?.length === 0 && <p className="mt-5 rounded-xl border bg-white p-4 text-sm text-muted-foreground">No owner-managed assisted orders have been opened yet.</p>}
            {assistedOrderQueue.data && assistedOrderQueue.data.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-2">{assistedOrderQueue.data.map(order => <AssistedOrderCard order={order as V3AssistedOrder} key={order.id} onRefresh={refreshOwnerQueues} />)}</div>}
          </section>
        </>}
      </main>

    </MarketplaceLayout>
  );
}
