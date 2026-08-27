import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, MapPin, Minus, Package, Plus, Search, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

 type OrderItem = { title: string; details: string; quantity: number };

const statusCopy: Record<string, string> = {
  placed: "Order placed",
  confirming: "Confirming your item",
  accepted: "Accepted for fulfilment",
  sourcing: "Being prepared",
  ready: "Ready for collection",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function JumiaStorePage() {
  const { session } = useSupabaseAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ order_number: string; status: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get("item")?.slice(0, 180) || "");
  const [itemDetails, setItemDetails] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [fulfilmentMethod, setFulfilmentMethod] = useState<"siaya_pickup" | "home_delivery" | "collection_point">("siaya_pickup");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [deliverySchedule, setDeliverySchedule] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const order = trpc.marketplace.createV3JumiaOrder.useMutation({
    onSuccess: result => {
      setSubmittedOrder(result);
      setItems([]); setSearchTerm(""); setItemDetails(""); setQuantity("1"); setPreferredLocation(""); setDeliverySchedule(""); setOrderNote("");
    },
  });
  const buyerOrders = trpc.marketplace.v3BuyerJumiaOrders.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const paymentTiming = fulfilmentMethod === "home_delivery" ? "pay_on_delivery" : "pay_on_collection";
  const canSubmit = items.length > 0 && (fulfilmentMethod !== "home_delivery" || preferredLocation.trim().length > 0);

  const recentOrders = useMemo(() => (buyerOrders.data ?? []).slice(0, 4), [buyerOrders.data]);

  function addItem() {
    const title = searchTerm.trim();
    const details = itemDetails.trim();
    const parsedQuantity = Number(quantity);
    if (title.length < 4 || details.length < 10 || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) return;
    setItems(current => [...current, { title, details, quantity: parsedQuantity }]);
    setSearchTerm(""); setItemDetails(""); setQuantity("1");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return setAccountOpen(true);
    if (!items.length) return;
    order.mutate({ items, fulfilmentMethod, paymentTiming, preferredLocation: preferredLocation || undefined, deliverySchedule: deliverySchedule || undefined, orderNote: orderNote || undefined, fullName: fullName || undefined, phone: phone || undefined });
  }

  return <MarketplaceLayout>
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="eyebrow">MtaaMarket default fulfilment channel</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">Jumia shopping,<br /><em>the Siaya hand-off.</em></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Order the Jumia items you want through MtaaMarket. Add your item details, schedule collection or home delivery, and submit the order without paying first. We confirm the final item and hand-off details before asking you to pay.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#245441]"><span className="inline-flex items-center gap-2 rounded-full bg-[#e8f4ec] px-3 py-2"><ShieldCheck size={16} /> No extra MtaaMarket charge</span><span className="inline-flex items-center gap-2 rounded-full bg-[#e8f4ec] px-3 py-2"><Package size={16} /> Pay at hand-off</span></div>
        </div>
        <aside className="rounded-3xl border border-[#cfe3d7] bg-[#f4faf5] p-6"><div className="flex items-center gap-3 text-[#0e6c53]"><Truck size={24} /><p className="eyebrow !text-[#0e6c53]">MtaaMarket fulfilment</p></div><p className="mt-4 text-lg font-semibold text-[#0e2f27]">A simple order from search to Siaya hand-off.</p><p className="mt-3 text-sm leading-6 text-[#35584a]">We confirm the final item, amount, availability, and hand-off route before purchase. If an item is unavailable, your order can be cancelled.</p></aside>
      </section>

      {submittedOrder ? <section className="mt-10 rounded-3xl border border-[#b9dcc5] bg-white p-6 shadow-sm sm:p-8" aria-live="polite"><div className="flex items-start gap-4"><div className="rounded-full bg-[#e8f4ec] p-3 text-[#0e7c5a]"><CheckCircle2 size={25} /></div><div><p className="eyebrow">Order received</p><h2 className="mt-1 text-2xl font-semibold">{submittedOrder.order_number} is in the fulfilment queue.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Your order is now being prepared. No payment was collected. You will pay at collection or delivery after the parcel and hand-off are confirmed.</p></div></div><div className="mt-6 flex flex-wrap gap-3"><button className="primary-cta" type="button" onClick={() => setSubmittedOrder(null)}>Place another order <ArrowRight size={17} /></button><Link className="secondary-cta" href="/dashboard">View my orders</Link></div></section> : <form className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.78fr]" onSubmit={submit}>
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Step 1</p><h2 className="mt-1 text-2xl font-semibold">Build your Jumia order</h2></div><Search className="text-[#1b6a55]" /></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Search by item name, add it to your order, and describe the exact option you want. No product link or separate vendor account is needed.</p>
          <div className="mt-6 space-y-5"><label className="block text-sm font-medium">Search for an item<input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="e.g. 43 inch smart TV" autoComplete="off" /></label><label className="block text-sm font-medium">Item option, size, colour, or preferred brand<textarea className="mt-2 min-h-24 w-full rounded-xl border border-border bg-white p-3 text-base" value={itemDetails} onChange={event => setItemDetails(event.target.value)} placeholder="e.g. Hisense or Samsung, black, with delivery to Siaya Town" /></label><div className="grid gap-4 sm:grid-cols-[1fr_auto]"><label className="block text-sm font-medium">Quantity<input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" type="number" min="1" max="20" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><button className="secondary-cta self-end" type="button" onClick={addItem} disabled={searchTerm.trim().length < 4 || itemDetails.trim().length < 10}>Add item <Plus size={17} /></button></div></div>
          {items.length > 0 && <div className="mt-7 space-y-3"><p className="text-sm font-semibold text-[#0e2f27]">Items in this order</p>{items.map((item, index) => <article className="flex items-start justify-between gap-4 rounded-2xl bg-[#f4faf5] p-4" key={`${item.title}-${index}`}><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.details}</p><p className="mt-2 text-xs font-medium text-[#35584a]">Quantity: {item.quantity}</p></div><button className="rounded-full p-2 text-destructive hover:bg-white" type="button" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.title}`}><Trash2 size={16} /></button></article>)}</div>}
        </section>

        <section className="rounded-3xl border border-[#cfe3d7] bg-[#fbfefa] p-6 shadow-sm sm:p-8"><p className="eyebrow">Step 2</p><h2 className="mt-1 text-2xl font-semibold">Schedule the hand-off</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Choose how you want to receive the parcel. We confirm the practical route before the order is finalised.</p><div className="mt-6 space-y-5"><label className="block text-sm font-medium">Fulfilment method<select className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value as typeof fulfilmentMethod)}><option value="siaya_pickup">Siaya collection</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery</option></select></label><label className="block text-sm font-medium"><MapPin size={15} className="mr-1 inline" />Broad area or collection point<input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} placeholder={fulfilmentMethod === "home_delivery" ? "e.g. Siaya Town" : "e.g. Siaya Town collection point"} maxLength={180} required={fulfilmentMethod === "home_delivery"} /></label><label className="block text-sm font-medium">Preferred timing (optional)<input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={deliverySchedule} onChange={event => setDeliverySchedule(event.target.value)} placeholder="e.g. Saturday afternoon" maxLength={120} /></label><label className="block text-sm font-medium">Order note (optional)<textarea className="mt-2 min-h-20 w-full rounded-xl border border-border bg-white p-3 text-base" value={orderNote} onChange={event => setOrderNote(event.target.value)} placeholder="Anything else we should know" maxLength={1200} /></label><div className="rounded-2xl border border-[#cfe3d7] bg-white p-4 text-sm"><p className="font-semibold text-[#0e2f27]">Payment: {paymentTiming === "pay_on_delivery" ? "pay on delivery" : "pay on collection"}</p><p className="mt-2 leading-6 text-muted-foreground">No payment is taken when you submit this order. The final amount is confirmed before purchase, and payment is due at the hand-off. If a paid order is later cancelled, the refund is processed within three working days.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Your name <span className="font-normal text-muted-foreground">(if not saved)</span><input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" maxLength={90} /></label><label className="block text-sm font-medium">Kenyan phone <span className="font-normal text-muted-foreground">(if not saved)</span><input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={phone} onChange={event => setPhone(event.target.value)} placeholder="2547XXXXXXXX" maxLength={13} /></label></div>{order.isError && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{order.error.message}</p>}<button className="primary-cta w-full justify-center" type="submit" disabled={order.isPending || !canSubmit}>{order.isPending ? "Placing order…" : session ? "Place Jumia order" : "Sign in to place order"}<ArrowRight size={17} /></button></div></section>
      </form>}

      {session && recentOrders.length > 0 && <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Your recent orders</p><h2 className="mt-1 text-2xl font-semibold">Follow the fulfilment status</h2></div><Link className="text-sm font-semibold text-[#0e7c5a] underline" href="/dashboard">Open workspace</Link></div><div className="mt-6 grid gap-3 md:grid-cols-2">{recentOrders.map(orderItem => <article className="rounded-2xl bg-[#f4faf5] p-4" key={orderItem.id}><div className="flex items-center justify-between gap-3"><strong>{orderItem.order_number}</strong><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#245441]">{statusCopy[orderItem.status] ?? orderItem.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{orderItem.items.map((item: OrderItem) => `${item.title} × ${item.quantity}`).join(", ")}</p><p className="mt-2 text-xs text-[#35584a]">Payment: {orderItem.payment_status === "not_due" ? "due at hand-off" : orderItem.payment_status}</p></article>)}</div></section>}
    </div>
    <MtaaAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
  </MarketplaceLayout>;
}
