import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const CartPage = lazy(() => import("./pages/CartPage"));
const AssistedSourcingPage = lazy(() => import("./pages/AssistedSourcingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PickupStations = lazy(() => import("./pages/PickupStations"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const RequestDeskPage = lazy(() => import("./pages/RequestDeskPage"));
const JumiaStorePage = lazy(() => import("./pages/JumiaStorePage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SupabaseAuthCallbackPage = lazy(() => import("./pages/SupabaseAuthCallbackPage"));
const VendorPage = lazy(() => import("./pages/VendorPage"));
const Admin = lazy(() => import("./pages/Admin"));
const VendorUpload = lazy(() => import("./pages/VendorUpload"));

const routeSeo: Record<string, { title: string; description: string; index: boolean }> = {
  "/": {
    title: "Siaya Online Market | Local products and live choices",
    description: "Siaya Online Market helps buyers discover local products, compare live choices, and request items with clear collection or delivery confirmation.",
    index: true,
  },
  "/jumia": {
    title: "Browse wider product choices in Siaya | Siaya Online Market",
    description: "Browse wider product choices through Siaya Online Market. View details first and confirm collection or delivery before deciding.",
    index: true,
  },
  "/how-it-works": {
    title: "How Siaya Online Market works",
    description: "Learn how Siaya Online Market handles product discovery, item requests, and collection or delivery confirmation.",
    index: true,
  },
  "/request": {
    title: "Request an item in Siaya | Siaya Online Market",
    description: "Request an item through Siaya Online Market and receive clear details before choosing whether to continue.",
    index: true,
  },
  "/vendor": {
    title: "Sell local products in Siaya | Siaya Online Market",
    description: "Learn about seller access and owner-reviewed product listings on Siaya Online Market.",
    index: true,
  },
  "/privacy": {
    title: "Privacy and account data | Siaya Online Market",
    description: "Read how Siaya Online Market handles account and marketplace data.",
    index: true,
  },
  "/stations": {
    title: "Collection points in Siaya | Siaya Online Market",
    description: "Explore collection-point information for Siaya Online Market fulfilment.",
    index: true,
  },
};

const privatePaths = new Set(["/admin", "/dashboard", "/cart", "/auth/callback", "/auth/reset-password", "/vendor/upload"]);

function RouteSeo() {
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const seo = routeSeo[path] ?? { title: "Siaya Online Market", description: "Siaya Online Market for local product discovery and item requests.", index: !privatePaths.has(path) };
    const canonical = `https://www.siayaonlinemarket.online${path === "/" ? "/" : path}`;
    document.title = seo.title;
    const setMeta = (selector: string, attribute: "name" | "property", attributeValue: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, attributeValue);
        document.head.appendChild(element);
      }
      element.content = value;
    };
    setMeta('meta[name="description"]', "name", "description", seo.description);
    setMeta('meta[name="robots"]', "name", "robots", seo.index ? "index,follow" : "noindex,nofollow");
    setMeta('meta[property="og:title"]', "property", "og:title", seo.title);
    setMeta('meta[property="og:description"]', "property", "og:description", seo.description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
  }, []);

  return null;
}

function RouteLoadingState() {
  return <div className="min-h-screen bg-[#f9f7f2] px-6 py-24 text-center text-sm text-[#35584a]" role="status">Loading MtaaMarket…</div>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoadingState />}>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/how-it-works"} component={AssistedSourcingPage} />
        <Route path={"/products/:slug"} component={ProductDetail} />
        <Route path={"/cart"} component={CartPage} />
        <Route path={"/privacy"} component={PrivacyPage} />
        <Route path={"/stations"} component={PickupStations} />
        <Route path={"/request"} component={RequestDeskPage} />
        <Route path={"/jumia"} component={JumiaStorePage} />
        <Route path={"/auth/callback"} component={SupabaseAuthCallbackPage} />
        <Route path={"/auth/reset-password"} component={ResetPasswordPage} />
        <Route path={"/vendor"} component={VendorPage} />
        <Route path={"/admin"} component={Admin} />
        <Route path={"/vendor/upload"} component={VendorUpload} />
        <Route path={"/dashboard"} component={DashboardPage} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <CartProvider>
            <Toaster richColors position="top-center" />
            <RouteSeo />
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
