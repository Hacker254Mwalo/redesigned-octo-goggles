import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { JumiaGoogleSearch, hasJumiaGoogleSearch } from "@/components/JumiaGoogleSearch";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BadgeCheck, CheckCircle2, ChevronRight, Eye, Footprints, Home as HomeIcon, ImageOff, Laptop, MapPin, PackageCheck, Plus, Search, ShieldCheck, Shirt, ShoppingBag, Sparkles, Speaker, Sun, Trash2, Truck, Tv, Watch, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

type OrderItem = { title: string; details: string; quantity: number; sourceUrl?: string; imageUrl?: string | null; price?: number | null; currency?: string | null };
type SelectedResult = { title: string; url: string; snippet: string; imageUrl: string | null; price: number | null; currency: string | null };
type SearchResult = SelectedResult & { id: string; source: string };
type ResultFilter = "all" | "photos" | "priced";

const DEFAULT_CATALOG_QUERY = "Android smartphone";

const browseCategories = [
  { label: "Phones", query: "smartphone phone", icon: Smartphone, tone: "mint" },
  { label: "Solar & lighting", query: "solar lights", icon: Sun, tone: "gold" },
  { label: "Smartwatches", query: "smartwatch", icon: Watch, tone: "plum" },
  { label: "Shoes", query: "shoes", icon: Footprints, tone: "rose" },
  { label: "Laptops", query: "laptop", icon: Laptop, tone: "sky" },
  { label: "TVs", query: "smart TV", icon: Tv, tone: "leaf" },
  { label: "Home audio", query: "music system speakers", icon: Speaker, tone: "coral" },
  { label: "Home & kitchen", query: "home kitchen appliances", icon: HomeIcon, tone: "sand" },
];

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

function JumiaProductImage({ src, alt, className = "h-36 w-full" }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`${className} jumia-image-fallback`} role="img" aria-label={`${alt} image unavailable`}><ImageOff size={24} /><span>Product photo unavailable</span></div>;
  return <img className={`${className} rounded-xl object-cover`} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

function SearchResultCard({ result, onSelect }: { result: SearchResult; onSelect: (result: SearchResult) => void }) {
  return <article className="selection-card">
    <JumiaProductImage src={result.imageUrl} alt={result.title} className="selection-card-image" />
    <div className="selection-card-body">
      <div className="selection-card-kicker"><span>Product result</span><span>{result.price ? "Price shown" : "Check current price"}</span></div>
      <h3 className="selection-card-title">{result.title}</h3>
      <p className="selection-card-description">{result.snippet}</p>
      <div className="selection-card-footer"><strong>{result.price ? `KES ${result.price.toLocaleString("en-KE")}` : "Price on product page"}</strong><button className="primary-cta selection-card-button" type="button" onClick={() => onSelect(result)}>Select</button></div>
    </div>
  </article>;
}

export default function JumiaStorePage() {
  const { session } = useSupabaseAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ order_number: string; status: string } | null>(null);
  const initialCatalogQuery = new URLSearchParams(window.location.search).get("item")?.trim().slice(0, 120) || DEFAULT_CATALOG_QUERY;
  const [searchTerm, setSearchTerm] = useState(initialCatalogQuery);
  const [searchQuery, setSearchQuery] = useState(initialCatalogQuery);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
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
  const browseQuery = searchQuery.trim() || DEFAULT_CATALOG_QUERY;
  const searchResults = trpc.marketplace.jumiaSearch.useQuery({ query: browseQuery }, { enabled: browseQuery.length >= 3 && !googleSearchEnabled, retry: false });
  const paymentTiming = fulfilmentMethod === "home_delivery" ? "pay_on_delivery" : "pay_on_collection";
  const canSubmit = items.length > 0 && (fulfilmentMethod !== "home_delivery" || preferredLocation.trim().length > 0);
  const recentOrders = useMemo(() => (buyerOrders.data ?? []).slice(0, 4), [buyerOrders.data]);
  const visibleResults = useMemo(() => {
    const results = searchResults.data?.results ?? [];
    if (resultFilter === "photos") return results.filter(result => Boolean(result.imageUrl));
    if (resultFilter === "priced") return results.filter(result => Boolean(result.price));
    return results;
  }, [resultFilter, searchResults.data?.results]);

  function runSearch() {
    const query = searchTerm.trim();
    if (query.length >= 3) {
      setSearchQuery(query);
      setResultFilter("all");
      window.setTimeout(() => document.getElementById("catalog-live-search")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    }
  }

  function chooseCategory(query: string) {
    setSearchTerm(query);
    setSearchQuery(query);
    setResultFilter("all");
    setSelectedResult(null);
    window.setTimeout(() => document.getElementById("catalog-live-search")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function selectResult(result: SelectedResult) {
    setSelectedResult(result);
    setSearchTerm(result.title);
    setItemOption("");
    window.setTimeout(() => document.getElementById("catalog-selection")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function addItem() {
    const title = searchTerm.trim();
    const option = itemOption.trim();
    const parsedQuantity = Number(quantity);
    if (title.length < 4 || !Number.isSafeInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) return;
    const details = option || selectedResult?.snippet || "Product selected from search.";
    setItems(current => [...current, { title, details: details.slice(0, 3_000), quantity: parsedQuantity, sourceUrl: selectedResult?.url, imageUrl: selectedResult?.imageUrl, price: selectedResult?.price, currency: selectedResult?.currency }]);
    setSearchTerm(""); setItemOption(""); setQuantity("1"); setSelectedResult(null);
    window.setTimeout(() => document.getElementById("catalog-basket")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return setAccountOpen(true);
    if (!items.length) return;
    order.mutate({ items, fulfilmentMethod, paymentTiming, preferredLocation: preferredLocation || undefined, deliverySchedule: deliverySchedule || undefined, orderNote: orderNote || undefined, fullName: fullName || undefined, phone: phone || undefined });
  }

  return <MarketplaceLayout>
    <div className="catalog-page">
      {submittedOrder ? <section className="catalog-confirmation" aria-live="polite"><div className="catalog-confirmation-icon"><CheckCircle2 size={25} /></div><div><p className="eyebrow">Order received</p><h1>{submittedOrder.order_number} is being prepared.</h1><p>Your order has been received. You can follow its progress from your account.</p></div><div className="catalog-confirmation-actions"><button className="primary-cta" type="button" onClick={() => setSubmittedOrder(null)}>Continue shopping <ArrowRight size={17} /></button><Link className="secondary-cta" href="/dashboard">View my orders</Link></div></section> : <form className="catalog-order-form" onSubmit={submit}>
        <section className="catalog-commerce-head"><div><p className="eyebrow">MtaaMarket Select / broader choice</p><h1>Find what you need.</h1><p>Real product choices, one local basket.</p></div><div className="catalog-commerce-tools"><span><ShieldCheck size={15} /> Live selection</span><Link href="#catalog-basket" className="catalog-basket-link"><ShoppingBag size={16} /> Basket <b>{items.length}</b></Link></div></section><aside className="catalog-view-note" aria-label="Browse-only information"><span className="catalog-view-note-icon"><Eye size={17} /></span><div><strong>Browse the wider live selection.</strong><span>Compare real choices first. Selecting an item only prepares a view of your basket; no payment is taken here.</span></div><span className="catalog-view-badge">View only</span></aside>

        <section id="catalog-live-search" className="catalog-search-card"><div className="catalog-search-heading"><div><p className="eyebrow">Shop the live selection</p><h2>Browse products.</h2></div><Search className="catalog-search-icon" /></div><div className="catalog-search-shell"><Search size={19} /><input value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setSelectedResult(null); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); runSearch(); } }} placeholder="Search phones, TVs, shoes…" autoComplete="off" aria-label="Search live products" /><button type="button" onClick={runSearch} disabled={searchTerm.trim().length < 3 || searchResults.isFetching}>{searchResults.isFetching ? "Searching…" : "Search"}<ArrowRight size={15} /></button></div>{googleSearchEnabled && <JumiaGoogleSearch query={searchQuery} onSelect={selectResult} />}{!googleSearchEnabled && <>{searchResults.isError && <p className="catalog-search-message error" role="alert">Search is temporarily unavailable. Please try again.</p>}{searchResults.data && <p className="catalog-search-message" role="status">{searchQuery.trim() ? searchResults.data.message : "Fresh live selection to start browsing."}</p>}{searchResults.data?.results.length ? <><div className="catalog-results-toolbar"><p className="selection-count">{visibleResults.length} of {searchResults.data.results.length} choices</p><div className="catalog-filter-row" aria-label="Filter live results"><button type="button" className={resultFilter === "all" ? "active" : ""} onClick={() => setResultFilter("all")}>All choices</button><button type="button" className={resultFilter === "photos" ? "active" : ""} onClick={() => setResultFilter("photos")}>With photos</button><button type="button" className={resultFilter === "priced" ? "active" : ""} onClick={() => setResultFilter("priced")}>Price shown</button></div></div>{visibleResults.length ? <div className="selection-grid">{visibleResults.map(result => <SearchResultCard result={result} onSelect={selectResult} key={result.id} />)}</div> : <div className="catalog-filter-empty"><ImageOff size={18} /><span>No live choices match this filter. Show all choices to continue.</span><button type="button" onClick={() => setResultFilter("all")}>Show all</button></div>}</> : null}</>}</section>

        <section id="catalog-categories" className="catalog-category-section"><div className="catalog-section-heading"><div><p className="eyebrow">Browse departments</p><h2>Shop by category.</h2></div><span>Live search</span></div><div className="catalog-category-grid">{browseCategories.map(({ label, query, icon: Icon, tone }) => <button type="button" key={label} className={`catalog-category-card ${tone}`} onClick={() => chooseCategory(query)}><span className="catalog-category-icon"><Icon size={22} /></span><strong>{label}</strong><small>Open live results</small><ChevronRight size={16} /></button>)}</div></section>

        <section id="catalog-selection" className="catalog-selection-card"><div className="catalog-section-heading"><div><p className="eyebrow">Your choice</p><h2>Build your basket</h2></div><PackageCheck className="catalog-selection-icon" /></div>{selectedResult ? <div className="selected-item"><JumiaProductImage src={selectedResult.imageUrl} alt="" className="h-20 w-20 shrink-0" /><div className="min-w-0"><p className="selected-item-label">Selected item</p><p className="selected-item-title">{selectedResult.title}</p>{selectedResult.price ? <p className="selected-item-price">KES {selectedResult.price.toLocaleString("en-KE")}</p> : <p className="selected-item-price">Price on product page</p>}</div></div> : <div className="catalog-selection-empty"><Sparkles size={20} /><p>Select a real product result above to add it to your basket.</p></div>}<div className="catalog-selection-controls"><label>Variant <span>(optional)</span><input value={itemOption} onChange={event => setItemOption(event.target.value)} placeholder="Size, colour or model" maxLength={180} /></label><label>Quantity<input type="number" min="1" max="20" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><button className="secondary-cta" type="button" onClick={addItem} disabled={!selectedResult}><Plus size={17} /> Add to basket</button></div></section>

        {items.length > 0 && <section id="catalog-basket" className="catalog-basket-card"><div className="catalog-section-heading"><div><p className="eyebrow">Ready when you are</p><h2>Your basket</h2></div><span>{items.length} item{items.length === 1 ? "" : "s"}</span></div>{items.map((item, index) => <article className="catalog-basket-item" key={`${item.title}-${index}`}><div className="catalog-basket-item-main"><JumiaProductImage src={item.imageUrl} alt="" className="h-16 w-16 shrink-0" /><div className="min-w-0"><h3>{item.title}</h3>{item.price ? <p className="catalog-item-price">KES {item.price.toLocaleString("en-KE")}</p> : <p className="catalog-item-price">Price on product page</p>}<p className="catalog-item-detail">{item.details !== "Product selected from search." ? item.details : "Selected item"}</p><p className="catalog-item-quantity">Quantity: {item.quantity}</p></div></div><button className="catalog-remove" type="button" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${item.title}`}><Trash2 size={16} /></button></article>)}</section>}

        {items.length > 0 && <section className="catalog-checkout-card"><div className="catalog-section-heading"><div><p className="eyebrow">Checkout</p><h2>Choose how to receive it.</h2></div><MapPin className="catalog-selection-icon" /></div><p className="catalog-checkout-intro">Your basket is ready. Choose collection or home delivery, then place your order.</p><div className="catalog-checkout-fields"><label>Fulfilment<select value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value as typeof fulfilmentMethod)}><option value="siaya_pickup">Collect in Siaya</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery</option></select></label><label>Location<input value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} placeholder="e.g. Siaya Town" maxLength={180} required={fulfilmentMethod === "home_delivery"} /></label><label>Your name <span>(if not saved)</span><input value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" maxLength={90} /></label><label>Kenyan phone <span>(if not saved)</span><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="2547XXXXXXXX" maxLength={13} /></label><label>Preferred timing <span>(optional)</span><input value={deliverySchedule} onChange={event => setDeliverySchedule(event.target.value)} placeholder="e.g. Tomorrow afternoon" maxLength={120} /></label><label>Order note <span>(optional)</span><input value={orderNote} onChange={event => setOrderNote(event.target.value)} placeholder="Any helpful detail" maxLength={600} /></label></div>{order.isError && <p className="catalog-search-message error" role="alert">{order.error.message}</p>}<button className="primary-cta catalog-place-order" type="submit" disabled={order.isPending || !canSubmit}>{order.isPending ? "Placing order…" : session ? "Place order" : "Sign in to place order"}<ArrowRight size={17} /></button></section>}
      </form>}

      {session && recentOrders.length > 0 && <section className="catalog-order-history"><div className="catalog-section-heading"><div><p className="eyebrow">Your orders</p><h2>Follow your fulfilment</h2></div><Link className="text-cta" href="/dashboard">View all <ArrowRight size={15} /></Link></div><div className="catalog-order-history-grid">{recentOrders.map(orderItem => <article key={orderItem.id}><div><strong>{orderItem.order_number}</strong><span>{statusCopy[orderItem.status] ?? orderItem.status}</span></div><p>{orderItem.items.map((item: OrderItem) => `${item.title} × ${item.quantity}`).join(", ")}</p></article>)}</div></section>}
    </div>
    {!submittedOrder && <nav className="catalog-mobile-bar" aria-label="Shopping shortcuts"><Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><HomeIcon size={18} /><span>Home</span></Link><a href="#catalog-categories"><PackageCheck size={18} /><span>Categories</span></a><a href="#catalog-basket"><ShoppingBag size={18} /><span>Basket ({items.length})</span></a><button type="button" onClick={() => setAccountOpen(true)}><Sparkles size={18} /><span>Account</span></button></nav>}
    <MtaaAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
  </MarketplaceLayout>;
}
