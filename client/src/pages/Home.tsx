import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { MtaaSharePrompt } from "@/components/MtaaSharePrompt";
import { ProductCard } from "@/components/ProductCard";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Baby,
  ChevronRight,
  Home as HomeIcon,
  Laptop,
  Search,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sun,
  Tv,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const departments = [
  { label: "Phones", query: "smartphone Android phone", icon: Smartphone, tone: "mint" },
  { label: "TVs & audio", query: "smart TV television", icon: Tv, tone: "gold" },
  { label: "Solar & power", query: "solar panel home kit power bank", icon: Sun, tone: "sun" },
  { label: "Fridges", query: "refrigerator fridge Kenya", icon: HomeIcon, tone: "blue" },
  { label: "Mattresses", query: "mattress 6x6", icon: HomeIcon, tone: "plum" },
  { label: "Cookers", query: "gas cooker 4 burner", icon: HomeIcon, tone: "coral" },
  { label: "Computers", query: "laptop computer", icon: Laptop, tone: "sky" },
  { label: "Fashion", query: "shoes clothes Kenya", icon: Shirt, tone: "rose" },
  { label: "Baby & kids", query: "baby kids products", icon: Baby, tone: "sand" },
];

export default function Home() {
  const [quickSearch, setQuickSearch] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>();
  const [showAllLocal, setShowAllLocal] = useState(false);
  const [, setLocation] = useLocation();
  const categories = trpc.marketplace.categories.useQuery();
  const products = trpc.marketplace.products.useQuery({ categorySlug: category, search: search || undefined, limit: 24 });
  const productList = useMemo(() => products.data || [], [products.data]);

  const goToSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = quickSearch.trim();
    setLocation(query.length >= 3 ? `/marketplace?item=${encodeURIComponent(query)}` : "/marketplace");
  };

  return (
    <MarketplaceLayout>
      <main className="home-page">
        <section className="home-storefront-head" aria-labelledby="home-title">
          <div className="home-storefront-copy">
            <p className="home-live-kicker"><span className="home-live-dot" /> Siaya Mtaa Market</p>
            <h1 id="home-title">Good finds, close to home.</h1>
            <p>Shop local. Find more.</p>
          </div>
          <form className="home-search" onSubmit={goToSearch} role="search">
            <Search size={20} aria-hidden="true" />
            <input
              value={quickSearch}
              onChange={event => setQuickSearch(event.target.value)}
              placeholder="Search phones, fridges, solar…"
              aria-label="Search products"
              autoComplete="off"
            />
            <button type="submit"><span>Search</span><ArrowRight size={16} /></button>
          </form>
        </section>

        <section className="home-popular-categories" aria-labelledby="popular-categories-title">
          <div className="home-section-heading">
            <h2 id="popular-categories-title">Shop by category</h2>
            <Link href="/marketplace">All products <ArrowRight size={15} /></Link>
          </div>
          <div className="home-category-rail">
            {departments.map(({ label, query, icon: Icon, tone }) => (
              <Link key={label} href={`/marketplace?item=${encodeURIComponent(query)}`} className={`home-category-tile ${tone}`}>
                <span><Icon size={21} strokeWidth={1.9} /></span>
                <strong>{label}</strong>
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
        </section>

        <section id="local-market" className="home-local-section" aria-labelledby="local-market-title">
          <div className="home-local-heading">
            <div>
              <p className="eyebrow">From Siaya sellers</p>
              <h2 id="local-market-title">Available near you</h2>
            </div>
            <div className="home-local-search">
              <Search size={17} aria-hidden="true" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search local listings" aria-label="Search local listings" />
              {search && <button type="button" onClick={() => setSearch("")}>Clear</button>}
            </div>
          </div>

          <div className="home-local-tools">
            <div className="category-row" role="group" aria-label="Filter local products by category">
              <button onClick={() => setCategory(undefined)} className={!category ? "category-chip selected" : "category-chip"} aria-pressed={!category}>All</button>
              {categories.data?.map(item => (
                <button key={item.id} onClick={() => setCategory(item.slug)} className={category === item.slug ? "category-chip selected" : "category-chip"} aria-pressed={category === item.slug}>{item.name}</button>
              ))}
            </div>
          </div>

          <div className="product-grid home-product-grid">
            {products.isLoading ? Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton" key={index} />)
              : products.isError ? <div className="empty-discovery home-empty-state"><ShoppingBag size={24} /><h3>Listings are taking a moment.</h3><Link href="/marketplace" className="text-cta">Browse more products <ArrowRight size={15} /></Link></div>
                : productList.length ? productList.slice(0, showAllLocal ? 24 : 8).map((entry: { product: { id: string | number } }) => <ProductCard key={entry.product.id} entry={entry as any} />)
                  : <div className="empty-discovery home-empty-state"><ShoppingBag size={24} /><h3>{search ? `No local listing for “${search}” yet.` : "New local listings are on the way."}</h3><div className="empty-state-actions"><Link href={`/marketplace${search ? `?item=${encodeURIComponent(search)}` : ""}`} className="primary-cta">Browse more products <ArrowRight size={15} /></Link><Link href={`/request${search ? `?item=${encodeURIComponent(search)}` : ""}`} className="secondary-cta">Request an item</Link></div></div>}
          </div>
          {productList.length > 8 && <button type="button" className="home-show-more" onClick={() => setShowAllLocal(value => !value)}>{showAllLocal ? "Show less" : "See all local listings"}<ArrowRight size={15} /></button>}
        </section>

        <section className="home-more-shopping" aria-label="More shopping choices">
          <div><span className="home-more-icon"><Search size={20} /></span><div><strong>Looking for something else?</strong><span>Search more products or send us a request.</span></div></div>
          <div className="home-more-actions"><Link href="/marketplace" className="primary-cta">Browse products <ArrowRight size={15} /></Link><Link href="/request" className="home-request-link">Request an item</Link></div>
        </section>

        <p className="home-service-line">Serving Siaya town, Bondo, Ugunja and Yala.</p>
        <MtaaSharePrompt />
      </main>
    </MarketplaceLayout>
  );
}
