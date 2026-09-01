import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { MtaaSharePrompt } from "@/components/MtaaSharePrompt";
import { ProductCard } from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Baby, CheckCircle2, ChevronRight, Home as HomeIcon, ImageOff, Laptop, MapPin, Search, ShieldCheck, Shirt, ShoppingBag, Smartphone, Sun, Truck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type LiveHomeResult = { id: string; title: string; snippet: string; imageUrl: string | null; price: number | null };

const departments = [
  { label: "Phones & accessories", query: "smartphone phone accessories", icon: Smartphone, tone: "mint" },
  { label: "Home electronics", query: "smart TV home electronics", icon: Laptop, tone: "gold" },
  { label: "Solar & power", query: "solar lights power bank", icon: Sun, tone: "sun" },
  { label: "Fashion & shoes", query: "shoes fashion", icon: Shirt, tone: "rose" },
  { label: "Baby & kids", query: "baby products kids", icon: Baby, tone: "blue" },
  { label: "Home & kitchen", query: "home kitchen appliances", icon: HomeIcon, tone: "plum" },
];

function HomeLiveCard({ result }: { result: LiveHomeResult }) {
  return <article className="home-live-card"><Link href={`/jumia?item=${encodeURIComponent(result.title)}`} className="home-live-card-visual">{result.imageUrl ? <img src={result.imageUrl} alt="" loading="lazy" /> : <><ImageOff size={20} /><span>Photo unavailable</span></>}</Link><div className="home-live-card-body"><span className="home-live-card-label">Live selection</span><Link href={`/jumia?item=${encodeURIComponent(result.title)}`} className="home-live-card-title">{result.title}</Link><div className="home-live-card-meta"><strong>{result.price ? `KES ${result.price.toLocaleString("en-KE")}` : "Price on product page"}</strong><Link href={`/jumia?item=${encodeURIComponent(result.title)}`} aria-label={`Browse ${result.title}`}>View <ArrowRight size={13} /></Link></div></div></article>;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [quickSearch, setQuickSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [, setLocation] = useLocation();
  const categories = trpc.marketplace.categories.useQuery();
  const products = trpc.marketplace.products.useQuery({ categorySlug: category, search: search || undefined, limit: 24 });
  const liveSelection = trpc.marketplace.jumiaSearch.useQuery({ query: "Android smartphone" }, { retry: false });
  const productList = useMemo(() => products.data || [], [products.data]);
  const livePreview = useMemo(() => (liveSelection.data?.results ?? []).slice(0, 4) as LiveHomeResult[], [liveSelection.data?.results]);

  const goToSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = quickSearch.trim();
    setLocation(query.length >= 3 ? `/jumia?item=${encodeURIComponent(query)}` : "/jumia");
  };

  return (
    <MarketplaceLayout>
      <main className="home-page">
        <section className="home-storefront-head">
          <div className="home-storefront-title"><div className="home-live-kicker"><span className="home-live-dot" /> Siaya marketplace <span>/</span> shop local first</div><h1>Shop for what you need.</h1><p>Browse local sellers, then move to the wider live selection when you need more choice.</p></div>
          <form className="home-search" onSubmit={goToSearch}><Search size={19} /><input value={quickSearch} onChange={event => setQuickSearch(event.target.value)} placeholder="Search phones, TVs, shoes…" aria-label="Start a product search" autoComplete="off" /><button type="submit">Search <ArrowRight size={15} /></button></form>
          <div className="home-storefront-actions"><Link href="#local-market" className="primary-cta">Browse local products <ArrowRight size={16} /></Link><Link href="/jumia" className="secondary-cta">Browse more choices <ArrowRight size={16} /></Link><Link href="/request" className="home-text-link">Request an item <ChevronRight size={16} /></Link><Link href="/how-it-works" className="home-text-link">How shopping works <ChevronRight size={16} /></Link><span className="home-storefront-proof"><CheckCircle2 size={14} /> Local shopping</span></div>
        </section>

        <section className="home-department-rail" aria-label="Browse departments"><div className="home-rail-label"><span className="home-live-dot" /> Shop by department</div><div className="home-department-links">{departments.slice(0, 4).map(({ label, query, icon: Icon }) => <Link key={label} href={`/jumia?item=${encodeURIComponent(query)}`}><Icon size={16} /><span>{label}</span><ArrowRight size={14} /></Link>)}</div></section>

        <section className="home-departments"><div className="section-heading"><div><p className="eyebrow">Browse the market</p><h2>Find your category.</h2></div><Link href="/jumia" className="text-cta">Open live catalogue <ArrowRight size={15} /></Link></div><div className="popular-search-grid">{departments.map(({ label, query, icon: Icon, tone }) => <Link key={label} href={`/jumia?item=${encodeURIComponent(query)}`} className={`popular-search-card ${tone}`}><span><Icon size={22} /></span><div><strong>{label}</strong><small>Open live results</small></div><ChevronRight size={17} /></Link>)}</div></section>

        <section className="home-live-selection" aria-label="Live product selection"><div className="home-live-selection-heading"><div><p className="eyebrow">MtaaMarket Select</p><h2>Start shopping now.</h2><p>Live choices to browse today, with verified details only.</p></div><Link href="/jumia" className="text-cta">See all live choices <ArrowRight size={15} /></Link></div>{liveSelection.isLoading ? <div className="home-live-grid">{[0,1,2,3].map(index => <div className="home-live-card-skeleton" key={index} />)}</div> : livePreview.length ? <div className="home-live-grid">{livePreview.map(result => <HomeLiveCard key={result.id} result={result} />)}</div> : <div className="home-live-empty"><ImageOff size={18} /><span>Live choices are temporarily unavailable.</span><Link href="/jumia">Open catalogue</Link></div>}</section>

        <section className="home-trust-strip" aria-label="Shopping expectations"><div className="home-trust-heading"><ShieldCheck size={22} /><div><p className="eyebrow">Clear from the start</p><h2>Know what happens next.</h2></div></div><div className="home-trust-points"><article><strong>Real details</strong><span>We show available product information and label missing photos or prices instead of guessing.</span></article><article><strong>No surprise payment</strong><span>Browsing and selecting are for review first; payment is not taken from the view-only catalogue.</span></article><article><strong>Local hand-off</strong><span>Collection or delivery is discussed and confirmed for the actual item and location.</span></article></div></section>

        <section id="local-market" className="discover-section home-local-section">
          <div className="home-local-heading"><div><p className="eyebrow">Siaya sellers</p><h2>What’s available locally.</h2></div><div><span className="home-feed-status"><span className="home-live-dot" /> Live listing feed</span><p>Real products from MtaaMarket sellers; explore a wider selection through MtaaMarket when you need more choice.</p></div></div>
          <div className="home-local-tools"><div className="search-panel"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search local products" aria-label="Search local products" /><button type="button" onClick={() => { setSearch(""); setCategory(undefined); }}>Reset</button></div><div className="category-discovery-caption"><span>Local categories</span><small>Swipe to explore</small></div><div className="category-row" role="group" aria-label="Browse local product categories"><button onClick={() => setCategory(undefined)} className={!category ? "category-chip selected" : "category-chip"} aria-pressed={!category}>All products</button>{categories.data?.map(item => <button key={item.id} onClick={() => setCategory(item.slug)} className={category === item.slug ? "category-chip selected" : "category-chip"} aria-pressed={category === item.slug}>{item.name}</button>)}</div></div>
          {category === "poultry-livestock" && <aside className="home-category-note"><strong>Local poultry &amp; livestock:</strong> browse current listings from Siaya sellers.</aside>}
          <div className="product-grid">{products.isLoading ? Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton" key={index} />) : products.isError ? <div className="empty-discovery"><Search size={28} /><h3>Local listings are taking a moment.</h3><p>Browse the wider selection while local listings load.</p><Link href="/jumia" className="text-cta">Explore more <ArrowRight size={15} /></Link></div> : productList.length ? productList.map((entry: { product: { id: string | number } }) => <ProductCard key={entry.product.id} entry={entry as any} />) : <div className="empty-discovery home-empty-state"><span className="empty-state-icon"><ShoppingBag size={25} /></span><p className="eyebrow">Local catalogue</p><h3>{search ? `No local listing for “${search}” yet.` : "Local listings are being added."}</h3><p>Start with the wider live selection, or send a request and let MtaaMarket know what you need.</p><div className="empty-state-actions"><Link href={`/jumia${search ? `?item=${encodeURIComponent(search)}` : ""}`} className="primary-cta">Find more options <ArrowRight size={16} /></Link><Link href={`/request${search ? `?item=${encodeURIComponent(search)}` : ""}`} className="secondary-cta">Request this item <ArrowRight size={16} /></Link></div></div>}</div>
        </section>

        <section className="home-journey-grid" aria-label="How MtaaMarket helps">
          <article><span><ShoppingBag size={18} /></span><div><p className="eyebrow">01 / Discover</p><h3>Start with what is real.</h3><p>Browse live local listings or search the wider selection without filling the market with made-up inventory.</p></div></article>
          <article><span><MapPin size={18} /></span><div><p className="eyebrow">02 / Choose</p><h3>Pick your preferred hand-off.</h3><p>Collection or home delivery is discussed and confirmed for the actual item and location.</p></div></article>
          <article><span><CheckCircle2 size={18} /></span><div><p className="eyebrow">03 / Keep track</p><h3>Stay in the same workspace.</h3><p>Your account keeps the relevant order and request updates together.</p></div></article>
        </section>
        <MtaaSharePrompt />
      </main>
    </MarketplaceLayout>
  );
}
