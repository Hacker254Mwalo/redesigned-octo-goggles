import { MtaaAccountDialog } from "@/components/MtaaAccountDialog";
import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  Home as HomeIcon,
  ImageOff,
  Laptop,
  MapPin,
  Minus,
  PackageCheck,
  PackageOpen,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Tv,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "wouter";

type OrderItem = {
  title: string;
  details: string;
  quantity: number;
  sourceUrl?: string;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
};

type SearchResult = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  source: string;
};

type ResultFilter = "all" | "photos" | "priced";

const DEFAULT_CATALOG_QUERY = "fridge refrigerator";
const BASKET_STORAGE_KEY = "mtaa-select-basket-v1";
const MAX_BASKET_LINES = 20;
const MAX_ITEM_QUANTITY = 20;
const JUMIA_HOSTS = new Set(["jumia.co.ke", "www.jumia.co.ke"]);

const browseCategories = [
  { label: "Phones", query: "smartphone phone", icon: Smartphone, tone: "mint" },
  { label: "Power banks", query: "power bank 20000mAh", icon: Smartphone, tone: "sky" },
  { label: "Solar panels & kits", query: "solar panel kit home solar system", icon: Sun, tone: "gold" },
  { label: "Mattresses", query: "mattress 6x6", icon: HomeIcon, tone: "sand" },
  { label: "Fridges", query: "refrigerator fridge", icon: HomeIcon, tone: "mint" },
  { label: "Freezers", query: "chest freezer deep freezer", icon: HomeIcon, tone: "sky" },
  { label: "Gas cookers", query: "gas cooker 4 burner", icon: HomeIcon, tone: "coral" },
  { label: "Appliances", query: "home kitchen appliances", icon: HomeIcon, tone: "plum" },
  { label: "Furniture", query: "bed frame wardrobe sofa", icon: HomeIcon, tone: "sand" },
  { label: "Laptops", query: "laptop", icon: Laptop, tone: "sky" },
  { label: "TVs", query: "smart TV", icon: Tv, tone: "leaf" },
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

function readSavedBasket(): OrderItem[] {
  try {
    const stored = window.localStorage.getItem(BASKET_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, MAX_BASKET_LINES).flatMap((entry): OrderItem[] => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Partial<OrderItem>;
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 180) : "";
      const details = typeof item.details === "string" ? item.details.trim().slice(0, 3_000) : "";
      const quantity = Number(item.quantity);
      if (title.length < 4 || details.length < 10 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) return [];

      let sourceUrl: string | undefined;
      if (typeof item.sourceUrl === "string") {
        try {
          const parsedUrl = new URL(item.sourceUrl);
          if (parsedUrl.protocol === "https:" && JUMIA_HOSTS.has(parsedUrl.hostname.toLowerCase()) && parsedUrl.pathname !== "/") {
            sourceUrl = parsedUrl.toString().slice(0, 2_000);
          }
        } catch {
          sourceUrl = undefined;
        }
      }

      let imageUrl: string | null = null;
      if (typeof item.imageUrl === "string") {
        try {
          const parsedImage = new URL(item.imageUrl);
          if (parsedImage.protocol === "https:" && parsedImage.hostname.toLowerCase() === "ke.jumia.is") imageUrl = parsedImage.toString().slice(0, 1_000);
        } catch {
          imageUrl = null;
        }
      }

      // A retailer price saved in the browser may be old; recheck it on the next search.
      const price = null;
      const currency = typeof item.currency === "string" ? item.currency.slice(0, 8) : null;
      return [{ title, details, quantity, sourceUrl, imageUrl, price, currency }];
    });
  } catch {
    return [];
  }
}

function CatalogProductImage({ src, alt, className = "h-36 w-full" }: { src?: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${className} catalog-image-fallback`} role="img" aria-label={`${alt || "Product"} photo unavailable`}>
        <PackageOpen size={27} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      className={`${className} rounded-xl object-cover`}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function SearchResultCard({ result, onAdd, addDisabled }: { result: SearchResult; onAdd: (result: SearchResult) => void; addDisabled: boolean }) {
  return (
    <article className="selection-card">
      <CatalogProductImage src={result.imageUrl} alt={result.title} className="selection-card-image" />
      <div className="selection-card-body">
        <div className="selection-card-kicker">
          <span>Market pick</span>
          <span>{result.price ? "Seen online" : "Price to confirm"}</span>
        </div>
        <h3 className="selection-card-title">{result.title}</h3>
        <div className="selection-card-footer">
          <strong>{result.price ? `KES ${result.price.toLocaleString("en-KE")}` : "Confirm price"}</strong>
          <button className="primary-cta selection-card-button" type="button" onClick={() => onAdd(result)} disabled={addDisabled}>
            <Plus size={16} /> Add to basket
          </button>
        </div>
      </div>
    </article>
  );
}

export default function JumiaStorePage() {
  const { session } = useSupabaseAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ order_number: string; status: string } | null>(null);
  const initialCatalogQuery = new URLSearchParams(window.location.search).get("item")?.trim().slice(0, 120) || DEFAULT_CATALOG_QUERY;
  const [searchTerm, setSearchTerm] = useState(initialCatalogQuery);
  const [searchQuery, setSearchQuery] = useState(initialCatalogQuery);
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [items, setItems] = useState<OrderItem[]>(readSavedBasket);
  const [basketFeedback, setBasketFeedback] = useState("");
  const [fulfilmentMethod, setFulfilmentMethod] = useState<"siaya_pickup" | "home_delivery" | "collection_point">("siaya_pickup");
  const [preferredLocation, setPreferredLocation] = useState("");
  const [deliverySchedule, setDeliverySchedule] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    try {
      if (items.length) window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items));
      else window.localStorage.removeItem(BASKET_STORAGE_KEY);
    } catch {
      setBasketFeedback("Your browser could not save this basket. Keep this page open until you place the order.");
    }
  }, [items]);

  const order = trpc.marketplace.createV3JumiaOrder.useMutation({
    onSuccess: result => {
      setSubmittedOrder(result);
      setItems([]);
      setBasketFeedback("");
      setSearchTerm("");
      setPreferredLocation("");
      setDeliverySchedule("");
      setOrderNote("");
    },
  });
  const buyerOrders = trpc.marketplace.v3BuyerJumiaOrders.useQuery(undefined, { enabled: Boolean(session), retry: false });
  const browseQuery = searchQuery.trim() || DEFAULT_CATALOG_QUERY;
  const searchResults = trpc.marketplace.jumiaSearch.useQuery(
    { query: browseQuery },
    {
      enabled: browseQuery.length >= 3,
      retry: false,
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      placeholderData: previous => previous,
    },
  );
  const paymentTiming = fulfilmentMethod === "home_delivery" ? "pay_on_delivery" : "pay_on_collection";
  const canSubmit = items.length > 0 && (fulfilmentMethod !== "home_delivery" || preferredLocation.trim().length > 0);
  const recentOrders = useMemo(() => (buyerOrders.data ?? []).slice(0, 4), [buyerOrders.data]);
  const allResults = searchResults.data?.results ?? [];
  const visibleResults = useMemo(() => {
    if (resultFilter === "photos") return allResults.filter(result => Boolean(result.imageUrl));
    if (resultFilter === "priced") return allResults.filter(result => Boolean(result.price));
    return allResults;
  }, [allResults, resultFilter]);
  const hasCurrentResults = searchResults.data?.query.trim().toLocaleLowerCase("en-KE") === browseQuery.toLocaleLowerCase("en-KE");
  const basketCount = items.reduce((total, item) => total + item.quantity, 0);

  function scrollTo(id: string) {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function runSearch() {
    const query = searchTerm.trim();
    if (query.length < 3) return;
    setSearchQuery(query);
    setResultFilter("all");
    setBasketFeedback("");
    scrollTo("catalog-live-search");
  }

  function chooseCategory(query: string) {
    setSearchTerm(query);
    setSearchQuery(query);
    setResultFilter("all");
    setBasketFeedback("");
    scrollTo("catalog-live-search");
  }

  function addResult(result: SearchResult) {
    const details = result.snippet.trim().slice(0, 3_000) || "Selected from the live product results; confirm the exact option before payment.";
    const basketKey = result.url || result.title.toLocaleLowerCase("en-KE");
    const existing = items.find(item => (item.sourceUrl || item.title.toLocaleLowerCase("en-KE")) === basketKey);
    if (!existing && items.length >= MAX_BASKET_LINES) {
      setBasketFeedback(`Your basket can contain up to ${MAX_BASKET_LINES} different products.`);
      scrollTo("catalog-basket");
      return;
    }

    setItems(current => {
      const existingIndex = current.findIndex(item => (item.sourceUrl || item.title.toLocaleLowerCase("en-KE")) === basketKey);
      if (existingIndex >= 0) {
        return current.map((item, index) => index === existingIndex
          ? { ...item, quantity: Math.min(item.quantity + 1, MAX_ITEM_QUANTITY) }
          : item);
      }
      return [...current, {
        title: result.title.trim().slice(0, 180),
        details,
        quantity: 1,
        sourceUrl: result.url,
        imageUrl: result.imageUrl,
        price: result.price,
        currency: result.currency,
      }];
    });
    setBasketFeedback(`${result.title} added to your basket.`);
  }

  function changeQuantity(index: number, change: number) {
    setItems(current => current.map((item, itemIndex) => itemIndex !== index
      ? item
      : { ...item, quantity: Math.max(1, Math.min(MAX_ITEM_QUANTITY, item.quantity + change)) }));
  }

  function removeItem(index: number) {
    const removed = items[index];
    setItems(current => current.filter((_, itemIndex) => itemIndex !== index));
    setBasketFeedback(removed ? `${removed.title} removed from your basket.` : "Item removed.");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      setAccountOpen(true);
      return;
    }
    if (!items.length || order.isPending) return;
    order.mutate({
      items,
      fulfilmentMethod,
      paymentTiming,
      preferredLocation: preferredLocation || undefined,
      deliverySchedule: deliverySchedule || undefined,
      orderNote: orderNote || undefined,
      fullName: fullName || undefined,
      phone: phone || undefined,
    });
  }

  return (
    <MarketplaceLayout>
      <div className="catalog-page">
        {submittedOrder ? (
          <section className="catalog-confirmation" aria-live="polite">
            <div className="catalog-confirmation-icon"><CheckCircle2 size={25} /></div>
            <div>
              <p className="eyebrow">Request received</p>
              <h1>Your request is in.</h1>
              <p>We’ll confirm availability and collection or delivery details before payment. Reference: {submittedOrder.order_number}.</p>
            </div>
            <div className="catalog-confirmation-actions">
              <button className="primary-cta" type="button" onClick={() => setSubmittedOrder(null)}>Continue shopping <ArrowRight size={17} /></button>
              <Link className="secondary-cta" href="/dashboard">View my orders</Link>
            </div>
          </section>
        ) : (
          <form className="catalog-order-form" onSubmit={submit}>
            <section className="catalog-commerce-head">
              <div>
                <p className="eyebrow">Shop products</p>
                <h1>Find your next good buy.</h1>
                <p>Phones, home, electronics and more.</p>
              </div>
              <div className="catalog-commerce-tools">
                <span><ShieldCheck size={15} /> Pay after confirmation</span>
                <a href={items.length ? "#catalog-basket" : "#catalog-live-search"} className="catalog-basket-link"><ShoppingBag size={16} /> Basket <b>{basketCount}</b></a>
              </div>
            </section>

            <section id="catalog-categories" className="catalog-category-section">
              <div className="catalog-section-heading"><div><p className="eyebrow">Popular searches</p><h2>Shop by category</h2></div></div>
              <div className="catalog-category-grid">
                {browseCategories.map(({ label, query, icon: Icon, tone }) => (
                  <button type="button" key={label} className={`catalog-category-card ${tone}`} onClick={() => chooseCategory(query)}>
                    <span className="catalog-category-icon"><Icon size={22} /></span><strong>{label}</strong><ChevronRight size={16} />
                  </button>
                ))}
              </div>
            </section>


            <section id="catalog-live-search" className="catalog-search-card">
              <div className="catalog-search-heading">
                <div><p className="eyebrow">Search all products</p><h2>What are you looking for?</h2></div>
                <Search className="catalog-search-icon" />
              </div>
              <div className="catalog-search-shell">
                <Search size={19} />
                <input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); runSearch(); } }}
                  placeholder="Search mattresses, fridges, cookers…"
                  autoComplete="off"
                  aria-label="Search live products"
                />
                <button type="button" onClick={runSearch} disabled={searchTerm.trim().length < 3 || searchResults.isFetching}>
                  {searchResults.isFetching ? "Searching…" : "Search"}<ArrowRight size={15} />
                </button>
              </div>

              {searchResults.isError && <p className="catalog-search-message error" role="alert">Search is temporarily unavailable. Please try again.</p>}
              {searchResults.data?.cacheStatus === "stale" && <p className="catalog-search-message" role="status">Saved matches. We confirm current price and availability before payment.</p>}
              {searchResults.data?.cacheStatus === "cached" && <p className="catalog-search-message" role="status">Recently viewed products.</p>}

              {searchResults.isLoading && <div className="selection-grid" aria-label="Loading products">{Array.from({ length: 8 }, (_, index) => <div className="selection-card-skeleton" key={index} />)}</div>}
              {allResults.length > 0 && (
                <>
                  <div className="catalog-results-toolbar">
                    <p className="selection-count">{visibleResults.length} of {allResults.length} choices</p>
                    <div className="catalog-filter-row" aria-label="Filter live results">
                      <button type="button" className={resultFilter === "all" ? "active" : ""} onClick={() => setResultFilter("all")}>All choices</button>
                      <button type="button" className={resultFilter === "photos" ? "active" : ""} onClick={() => setResultFilter("photos")}>With photos</button>
                      <button type="button" className={resultFilter === "priced" ? "active" : ""} onClick={() => setResultFilter("priced")}>Price shown</button>
                    </div>
                  </div>
                  {visibleResults.length > 0 ? (
                    <div className="selection-grid">
                      {visibleResults.map(result => (
                        <SearchResultCard
                          result={result}
                          onAdd={addResult}
                          addDisabled={items.length >= MAX_BASKET_LINES && !items.some(item => item.sourceUrl === result.url)}
                          key={result.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="catalog-filter-empty">
                      <ImageOff size={18} /><span>No live choices match this filter. Show all choices to continue.</span>
                      <button type="button" onClick={() => setResultFilter("all")}>Show all</button>
                    </div>
                  )}
                </>
              )}
            </section>

            {items.length > 0 && (
              <section id="catalog-basket" className="catalog-basket-card">
                <div className="catalog-section-heading">
                  <div><p className="eyebrow">Ready when you are</p><h2>Your basket</h2></div>
                  <span>{basketCount} item{basketCount === 1 ? "" : "s"}</span>
                </div>
                {basketFeedback && <p className="catalog-search-message" role="status" aria-live="polite">{basketFeedback}</p>}
                {items.map((item, index) => (
                  <article className="catalog-basket-item" key={`${item.sourceUrl ?? item.title}-${index}`}>
                    <div className="catalog-basket-item-main">
                      <CatalogProductImage src={item.imageUrl} alt="" className="h-16 w-16 shrink-0" />
                      <div className="min-w-0">
                        <h3>{item.title}</h3>
                        {item.price ? <p className="catalog-item-price">{item.currency || "KES"} {item.price.toLocaleString("en-KE")} each · seen price</p> : <p className="catalog-item-price">Confirm current price</p>}
                        <p className="catalog-item-detail">{item.details}</p>
                      </div>
                    </div>
                    <div className="catalog-basket-actions">
                      <div className="catalog-quantity-controls" aria-label={`Quantity for ${item.title}`}>
                        <button type="button" onClick={() => changeQuantity(index, -1)} disabled={item.quantity <= 1} aria-label={`Decrease ${item.title} quantity`}><Minus size={15} /></button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => changeQuantity(index, 1)} disabled={item.quantity >= MAX_ITEM_QUANTITY} aria-label={`Increase ${item.title} quantity`}><Plus size={15} /></button>
                      </div>
                      <button className="catalog-remove" type="button" onClick={() => removeItem(index)} aria-label={`Remove ${item.title}`}><Trash2 size={16} /></button>
                    </div>
                  </article>
                ))}
              </section>
            )}

            {items.length > 0 && (
              <section className="catalog-checkout-card">
                <div className="catalog-section-heading"><div><p className="eyebrow">Checkout</p><h2>Choose how to receive it.</h2></div><MapPin className="catalog-selection-icon" /></div>
                <p className="catalog-checkout-intro">Choose collection or home delivery and send your request. We confirm the item and final total before payment.</p>
                <div className="catalog-checkout-fields">
                  <label>Fulfilment<select value={fulfilmentMethod} onChange={event => setFulfilmentMethod(event.target.value as typeof fulfilmentMethod)}><option value="siaya_pickup">Collect in Siaya</option><option value="collection_point">Collection point</option><option value="home_delivery">Home delivery</option></select></label>
                  <label>Location<input value={preferredLocation} onChange={event => setPreferredLocation(event.target.value)} placeholder="e.g. Siaya Town" maxLength={180} required={fulfilmentMethod === "home_delivery"} /></label>
                  <label>Your name <span>(if not saved)</span><input value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Full name" maxLength={90} /></label>
                  <label>Kenyan phone <span>(if not saved)</span><input value={phone} onChange={event => setPhone(event.target.value)} placeholder="2547XXXXXXXX" maxLength={13} /></label>
                  <label>Preferred timing <span>(optional)</span><input value={deliverySchedule} onChange={event => setDeliverySchedule(event.target.value)} placeholder="e.g. Tomorrow afternoon" maxLength={120} /></label>
                  <label>Order note <span>(optional)</span><input value={orderNote} onChange={event => setOrderNote(event.target.value)} placeholder="Preferred size, colour, or model" maxLength={600} /></label>
                </div>
                {order.isError && <p className="catalog-search-message error" role="alert">{order.error.message}</p>}
                <button className="primary-cta catalog-place-order" type="submit" disabled={order.isPending || !canSubmit}>
                  {order.isPending ? "Placing order…" : session ? "Place order" : "Sign in to place order"}<ArrowRight size={17} />
                </button>
              </section>
            )}
          </form>
        )}

        {session && recentOrders.length > 0 && (
          <section className="catalog-order-history">
            <div className="catalog-section-heading"><div><p className="eyebrow">Your orders</p><h2>Follow your fulfilment</h2></div><Link className="text-cta" href="/dashboard">View all <ArrowRight size={15} /></Link></div>
            <div className="catalog-order-history-grid">
              {recentOrders.map(orderItem => (
                <article key={orderItem.id}>
                  <div><strong>{orderItem.order_number}</strong><span>{statusCopy[orderItem.status] ?? orderItem.status}</span></div>
                  <p>{orderItem.items.map((item: OrderItem) => `${item.title} × ${item.quantity}`).join(", ")}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {!submittedOrder && (
        <nav className="catalog-mobile-bar" aria-label="Shopping shortcuts">
          <Link href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><HomeIcon size={18} /><span>Home</span></Link>
          <a href="#catalog-categories"><PackageCheck size={18} /><span>Categories</span></a>
          <a href={items.length ? "#catalog-basket" : "#catalog-live-search"}><ShoppingBag size={18} /><span>Basket ({basketCount})</span></a>
          <button type="button" onClick={() => setAccountOpen(true)}><Sparkles size={18} /><span>Account</span></button>
        </nav>
      )}
      <MtaaAccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </MarketplaceLayout>
  );
}
