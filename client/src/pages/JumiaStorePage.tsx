import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { JumiaGoogleSearch, hasJumiaGoogleSearch } from "@/components/JumiaGoogleSearch";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, MapPin, Plus, Search, ShieldCheck, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

type OrderItem = { title: string; details: string; quantity: number; sourceUrl?: string; imageUrl?: string | null; price?: number | null; currency?: string | null };
type SelectedResult = { title: string; url: string; snippet: string; imageUrl: string | null; price: number | null; currency: string | null };

const statusCopy: Record<string, string> = {
  placed: "Order received",
  confirming: "Processing",
  accepted: "Confirmed",
  sourcing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function JumiaStorePage() {
  const { session } = useSupabaseAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ order_number: string; status: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(window.location.search).get("item")?.slice(0, 180) || "");
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get("item")?.slice(0, 120) || "");
  const [selectedResult, setSelectedResult] = useState<SelectedResult | null>(null);
  const [itemOption, setItemOption] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [fulfilmentMethod, setFulfilmentMethod] = useState<"siaya_pickup" | "home_delivery" | "collection_point">("siaya_pickup");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [deliverySchedule, setDeliverySchedule] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const googleSearchEnabled = hasJumiaGoogleSearch();
  const order = trpc.marketplace.createV3JumiaOrder.useMutation({
    onSuccess: result => {
      setSubmittedOrder(result);
      setItems([]); setSearchTerm(""); setItemOption(""); setQuantity("1"); setPreferredLocation(""); setDeliverySchedule(""); setOrderNote(""); setSelectedResult(null);
    },
  });
  const buyerOrders = trpc.marketplace.v3BuyerJumiaOrders.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const searchResults = trpc.marketplace.jumiaSearch.useQuery({ query: searchQuery }, { enabled: searchQuery.trim().length >= 3 && !googleSearchEnabled, retry: false });
  const paymentTiming = fulfilmentMethod === "home_delivery" ? "pay_on_delivery" : "pay_on_collection";
  const canSubmit = items.length > 0 && (fulfilmentMethod !== "home_delivery" || preferredLocation.trim().length > 0);
  const recentOrders = useMemo(() => (buyerOrders.data ?? []).slice(0, 4), [buyerOrders.data]);

  function runSearch() {
    const query = searchTerm.trim();
    if (query.length >= 3) setSearchQuery(query);
  }

  function selectResult(result: SelectedResult) {
    setSelectedResult(result);
    setSearchTerm(result.title);
    setItemOption("");
  }

  function addItem() {
    const title = searchTerm.trim();
    const option = itemOption.trim();
    const parsedQuantity = Number(quantity);
    if (title.length < 4 || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) return;
    const details = option || selectedResult?.snippet || "Product selected from Jumia search.";
    setItems(current => [...current, { title, details: details.slice(0, 3_000), quantity: parsedQuantity, sourceUrl: selectedResult?.url, imageUrl: selectedResult?.imageUrl, price: selectedResult?.price, currency: selectedResult?.currency }]);
    setSearchTerm(""); setItemOption(""); setQuantity("1"); setSelectedResult(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return setAccountOpen(true);
    if (!items.length) return;
    order.mutate({ items, fulfilmentMethod, paymentTiming, preferredLocation: preferredLocation || undefined, deliverySchedule: deliverySchedule || undefined, orderNote: orderNote || undefined, fullName: fullName || undefined, phone: phone || undefined });
  }

  return <MarketplaceLayout>
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="eyebrow">Jumia Kenya · available through MtaaMarket</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">Shop Jumia,<br /><em>made easy in Siaya.</em></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">Explore products from Jumia Kenya, choose what you like, and place one simple order for collection or delivery across Siaya.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#245441]"><span className="inline-flex items-center gap-2 rounded-full bg-[#e8f4ec] px-3 py-2"><ShieldCheck size={16} /> Clear pricing</span><span className="inline-flex items-center gap-2 rounded-full bg-[#e8f4ec] px-3 py-2"><Truck size={16} /> Collection or delivery</span></div>
        </div>
        <aside className="rounded-3xl border border-[#cfe3d7] bg-[#f4faf5] p-6"><div className="flex items-center gap-3 text-[#0e6c53]"><Truck size={24} /><p className="eyebrow !text-[#0e6c53]">Across Siaya</p></div><p className="mt-4 text-lg font-semibold text-[#0e2f27]">Everything you need in one simple order.</p><p className="mt-3 text-sm leading-6 text-[#35584a]">Browse, choose your favourites, and let us bring them closer to you.</p></aside>
      </section>

      {submittedOrder ? <section className="mt-10 rounded-3xl border border-[#b9dcc5] bg-white p-6 shadow-sm sm:p-8" aria-live="polite"><div className="flex items-start gap-4"><div className="rounded-full bg-[#e8f4ec] p-3 text-[#0e7c5a]"><CheckCircle2 size={25} /></div><div><p className="eyebrow">Order received</p><h2 className="mt-1 text-2xl font-semibold">{submittedOrder.order_number} is being prepared.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Your order has been received. You can follow its progress from your account.</p></div></div><div className="mt-6 flex flex-wrap gap-3"><button className="primary-cta" type="button" onClick={() => setSubmittedOrder(null)}>Place another order <ArrowRight size={17} /></button><Link className="secondary-cta" href="/dashboard">View my orders</Link></div></section> : <form className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.78fr]" onSubmit={submit}>
        <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Browse</p><h2 className="mt-1 text-2xl font-semibold">Find what you want</h2></div><Search className="text-[#1b6a55]" /></div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Search products, compare your options, and add a choice to your basket.</p>
          {googleSearchEnabled && <div className="mt-6 rounded-2xl border border-[#cfe3d7] bg-[#f4faf5] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#0e2f27]">Jumia products</p><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#245441]">Search</span></div><JumiaGoogleSearch query={searchQuery} onSelect={selectResult} /></div>}
          <div className={googleSearchEnabled ? "hidden" : "mt-6 rounded-2xl border border-[#cfe3d7] bg-[#f4faf5] p-4"}><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#0e2f27]">Jumia products</p><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#245441]">Search</span></div><div className="mt-3 flex gap-2"><input className="min-w-0 flex-1 rounded-xl border border-border bg-white p-3 text-base" value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setSelectedResult(null); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); runSearch(); } }} placeholder="Search phones, TVs, shoes…" autoComplete="off" aria-label="Search Jumia Kenya" /><button className="secondary-cta shrink-0" type="button" onClick={runSearch} disabled={searchTerm.trim().length < 3 || searchResults.isFetching}><Search size={17} />{searchResults.isFetching ? "Searching…" : "Search"}</button></div>{searchResults.isError && <p className="mt-3 rounded-xl bg-white p-3 text-sm text-destructive" role="alert">Search is temporarily unavailable. Please try again.</p>}{searchResults.data && <p className="mt-3 text-sm text-[#35584a]">{searchResults.data.results.length ? searchResults.data.message : "No products found for that search."}</p>}{searchResults.data?.results.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{searchResults.data.results.map(result => <article className="rounded-2xl border border-white bg-white p-3 shadow-sm" key={result.id}>{result.imageUrl && <img className="h-36 w-full rounded-xl object-cover" src={result.imageUrl} alt="" loading="lazy" />}<h3 className="mt-3 line-clamp-2 font-semibold text-[#0e2f27]">{result.title}</h3><p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{result.snippet}</p><div className="mt-3 flex items-center justify-between gap-3"><strong className="text-sm text-[#0e7c5a]">{result.price ? `KES ${result.price.toLocaleString("en-KE")}` : "View price"}</strong><button className="primary-cta px-3 py-2 text-xs" type="button" onClick={() => selectResult(result)}>Add to basket</button></div></article>)}</div> : null}</div>
          <div className="mt-6 space-y-4">{selectedResult ? <div className="rounded-2xl border border-[#b9dcc5] bg-[#f4faf5] p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0e7c5a]">Selected product</p><p className="mt-2 font-semibold text-[#0e2f27]">{selectedResult.title}</p>{selectedResult.price ? <p className="mt-1 text-sm font-medium text-[#0e7c5a]">KES {selectedResult.price.toLocaleString("en-KE")}</p> : null}</div> : <div className="rounded-2xl border border-dashed border-[#cfe3d7] bg-[#fbfefa] p-4 text-sm text-muted-foreground">Choose a product from the search results to continue.</div>}<label className="block text-sm font-medium">Variant <span className="font-normal text-muted-foreground">(optional)</span><input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={itemOption} onChange={event => setItemOption(event.target.value)} placeholder="Size, colour or model" maxLength={180} /></label><div className="grid gap-4 sm:grid-cols-[1fr_auto]"><label className="block text-sm font-medium">Quantity<input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" type="number" min="1" max="20" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><button className="secondary-cta self-end" type="button" onClick={addItem} disabled={!selectedResult}><Plus size={17} /> Add to basket</button></div></div>
          {items.length > 0 && <div id="jumia-basket" className="mt-7 space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#0e2f27]">Your basket</p><span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span></div>{items.map((item, index) => <article className="flex items-start justify-between gap-4 rounded-2xl bg-[#f4faf5] p-4" key={`${item.title}-${index}`}><div><h3 className="font-semibold">{item.title}</h3>{item.price ? <p className="mt-1 text-sm font-medium text-[#0e7c5a]">KES {item.price.toLocaleString("en-KE")}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{item.details !== "Product selected from Jumia search." ? item.details : "Selected product"}</p><p className="mt-2 text-xs font-medium text-[#35584a]">Quantity: {item.quantity}</p></div><button className="rounded-full p-2 text-destructive hover:bg-white" type="button" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.title}`}><Trash2 size={16} /></button></article>)}</div>}
        </section>

        <section className="rounded-3xl border border-[#cfe3d7] bg-[#fbfefa] p-6 shadow-sm sm:p-8"><p className="eyebrow">Delivery</p><h2 className="mt-1 text-2xl font-semibold">Where should we send it?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Select a collection point or delivery area.</p><div className="mt-6 space-y-5"><label className="block text-sm font-medium">Delivery method<select className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value as typeof fulfilmentMethod)}><option value="siaya_pickup">Collect in Siaya</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery</option></select></label><label className="block text-sm font-medium"><MapPin size={15} className="mr-1 inline" />Location<input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} placeholder={fulfilmentMethod === "home_delivery" ? "e.g. Siaya Town" : "e.g. Siaya Town"} maxLength={180} required={fulfilmentMethod === "home_delivery"} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Your name <span className="font-normal text-muted-foreground">(if not saved)</span><input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" maxLength={90} /></label><label className="block text-sm font-medium">Kenyan phone <span className="font-normal text-muted-foreground">(if not saved)</span><input className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-base" value={phone} onChange={event => setPhone(event.target.value)} placeholder="2547XXXXXXXX" maxLength={13} /></label></div>{order.isError && <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{order.error.message}</p>}<button className="primary-cta w-full justify-center" type="submit" disabled={order.isPending || !canSubmit}>{order.isPending ? "Placing order…" : session ? "Place order" : "Sign in to place order"}<ArrowRight size={17} /></button></div></section>
      </form>}

      {session && recentOrders.length > 0 && <section className="mt-10 rounded-3xl border bg-white p-6 shadow-sm sm:p-8"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Your orders</p><h2 className="mt-1 text-2xl font-semibold">Order history</h2></div><Link className="text-sm font-semibold text-[#0e7c5a] underline" href="/dashboard">View all</Link></div><div className="mt-6 grid gap-3 md:grid-cols-2">{recentOrders.map(orderItem => <article className="rounded-2xl bg-[#f4faf5] p-4" key={orderItem.id}><div className="flex items-center justify-between gap-3"><strong>{orderItem.order_number}</strong><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#245441]">{statusCopy[orderItem.status] ?? orderItem.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{orderItem.items.map((item: OrderItem) => `${item.title} × ${item.quantity}`).join(", ")}</p></article>)}</div></section>}
    </div>
    <MtaaAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
  </MarketplaceLayout>;
}
