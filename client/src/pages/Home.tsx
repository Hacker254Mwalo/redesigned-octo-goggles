import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { MtaaSharePrompt } from "@/components/MtaaSharePrompt";
import { ProductCard } from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Baby, CheckCircle2, ChevronRight, Cpu, Home as HomeIcon, Laptop, MapPin, Search, Shirt, ShoppingBag, Smartphone, Sparkles, Sun, Truck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const popularJumiaSearches = [
  { label: "Phones & accessories", query: "smartphone phone accessories", icon: Smartphone, tone: "mint" },
  { label: "Home electronics", query: "smart TV home electronics", icon: Laptop, tone: "gold" },
  { label: "Solar & power", query: "solar lights power bank", icon: Sun, tone: "sun" },
  { label: "Fashion & shoes", query: "shoes fashion", icon: Shirt, tone: "rose" },
  { label: "Baby & kids", query: "baby products kids", icon: Baby, tone: "blue" },
  { label: "Home & kitchen", query: "home kitchen appliances", icon: HomeIcon, tone: "plum" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const categories = trpc.marketplace.categories.useQuery();
  const products = trpc.marketplace.products.useQuery({ categorySlug: category, search: search || undefined, limit: 24 });
  const productList = useMemo(() => products.data || [], [products.data]);

  return <MarketplaceLayout>
    <section className="market-hero-v2">
      <div className="market-hero-v2-inner">
        <div className="market-hero-v2-copy">
          <p className="eyebrow">Siaya Online · your everyday market</p>
          <h1>Find it here.<br /><em>Get it to Siaya.</em></h1>
          <p className="market-hero-v2-description">Shop trusted local listings or browse a wider Jumia selection through MtaaMarket. Choose collection or home delivery, place your order without paying first, and pay at the hand-off.</p>
          <div className="hero-actions"><Link href="/jumia" className="primary-cta">Shop Jumia <ArrowRight size={17} /></Link><a href="#local-market" className="text-cta">Browse local listings <ChevronRight size={16} /></a></div>
          <div className="hero-proof-row"><span><CheckCircle2 size={16} /> No extra MtaaMarket charge</span><span><Truck size={16} /> Collection or delivery</span></div>
        </div>
        <div className="market-hero-v2-art" aria-label="Shop local and Jumia items through MtaaMarket">
          <div className="hero-v2-orbit orbit-a" /><div className="hero-v2-orbit orbit-b" />
          <div className="hero-v2-browse-card"><div className="hero-v2-card-top"><span className="hero-card-tag">SHOPPING TODAY</span><ShoppingBag size={18} /></div><div className="hero-v2-product-row"><span className="hero-v2-product-icon mint"><Smartphone size={20} /></span><div><strong>Phones & accessories</strong><small>Search a wider selection</small></div></div><div className="hero-v2-product-row"><span className="hero-v2-product-icon gold"><Sun size={20} /></span><div><strong>Solar & power</strong><small>Ready for Siaya fulfilment</small></div></div><div className="hero-v2-product-row"><span className="hero-v2-product-icon rose"><Shirt size={20} /></span><div><strong>Fashion & everyday wear</strong><small>Choose your preferred option</small></div></div><div className="hero-v2-card-footer"><span><MapPin size={14} /> Siaya fulfilment</span><b>Pay at hand-off</b></div></div>
          <div className="hero-v2-float-card"><Sparkles size={16} /> <span>One simple order</span></div>
        </div>
      </div>
    </section>

    <section className="market-strip"><div><ShoppingBag size={18} /> Local listings + wider selection</div><div><Truck size={18} /> Pickup or home delivery</div><div><CheckCircle2 size={18} /> Pay when you receive it</div></section>

    <section className="shop-by-need"><div className="section-heading"><div><p className="eyebrow">Start with what you need</p><h2>Shop by category</h2></div><Link href="/jumia" className="text-cta">See all Jumia shopping <ArrowRight size={15} /></Link></div><div className="popular-search-grid">{popularJumiaSearches.map(({ label, query, icon: Icon, tone }) => <Link key={label} href={`/jumia?item=${encodeURIComponent(query)}`} className={`popular-search-card ${tone}`}><span><Icon size={22} /></span><div><strong>{label}</strong><small>Shop through MtaaMarket</small></div><ChevronRight size={17} /></Link>)}</div></section>

    <section id="local-market" className="discover-section local-market-section"><div className="section-heading"><div><p className="eyebrow">Siaya sellers</p><h2>What is available locally</h2></div><p>Discover products already listed by MtaaMarket and approved sellers, then keep Jumia shopping one tap away for anything else.</p></div><div className="search-panel"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search local products" aria-label="Search local products" /><button onClick={() => { setSearch(""); setCategory(undefined); }}>Reset</button></div><div className="category-discovery-caption"><span>Local categories</span><small>Swipe to explore</small></div><div className="category-row" role="group" aria-label="Browse local product categories"><button onClick={() => setCategory(undefined)} className={!category ? "category-chip selected" : "category-chip"} aria-pressed={!category}>All products</button>{categories.data?.map(item => <button key={item.id} onClick={() => setCategory(item.slug)} className={category === item.slug ? "category-chip selected" : "category-chip"} aria-pressed={category === item.slug}>{item.name}</button>)}</div>{category === "poultry-livestock" ? <aside className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"><strong>Local poultry & livestock: </strong>these listings use manual owner confirmation and a separate handover process.</aside> : null}<div className="product-grid">{products.isLoading ? Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton" key={index} />) : products.isError ? <div className="empty-discovery"><Search size={28} /><h3>Local listings are taking a moment.</h3><p>Browse the wider Jumia selection while local listings load.</p><Link href="/jumia" className="text-cta">Shop Jumia <ArrowRight size={15} /></Link></div> : productList.length ? productList.map((entry: { product: { id: string | number } }) => <ProductCard key={entry.product.id} entry={entry as any} />) : <div className="empty-discovery home-empty-state"><ShoppingBag size={30} /><p className="eyebrow">Your next shopping stop</p><h3>{search ? `No local listing for “${search}” yet.` : "Local listings are being added."}</h3><p>Shop the same kind of item through the default Jumia channel and choose your Siaya hand-off preference.</p><Link href={`/jumia${search ? `?item=${encodeURIComponent(search)}` : ""}`} className="primary-cta">Shop this item on Jumia <ArrowRight size={16} /></Link></div>}</div></section>

    <section className="market-promise"><div className="market-promise-icon"><Wrench size={23} /></div><div><p className="eyebrow">Made for real Siaya shopping</p><h2>One market. More ways to find what you need.</h2><p>Use local listings when they are available. Use the default Jumia channel when you need a broader selection. Your order, fulfilment preference, and status stay in one MtaaMarket workspace.</p></div><Link href="/how-it-works" className="secondary-cta">How shopping works <ArrowRight size={16} /></Link></section>
    <MtaaSharePrompt />
  </MarketplaceLayout>;
}
