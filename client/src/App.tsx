import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
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
    title: "Siaya Mtaa Market — Buy local in Siaya, Bondo & Ugunja",
    description: "Shop local in Siaya town, Bondo, Ugunja and Yala. Browse sellers or request an item or service. Confirm availability and hand-off details before you decide.",
    index: true,
  },
  "/jumia": {
    title: "MtaaMarket Select | Siaya Mtaa Market",
    description: "A temporary wider-choice catalogue for MtaaMarket customers.",
    index: false,
  },
  "/how-it-works": {
    title: "How Siaya Mtaa Market works",
    description: "See how to browse local listings, request an item or service, and confirm availability and hand-off details with Siaya Mtaa Market.",
    index: true,
  },
  "/request": {
    title: "Request an item or service in Siaya | Siaya Mtaa Market",
    description: "Request an item or service from local sellers in Siaya, Bondo, Ugunja or Yala. We check availability and hand-off details before you decide.",
    index: true,
  },
  "/vendor": {
    title: "Sell on Siaya Mtaa Market | Local sellers",
    description: "Join local sellers in Siaya, Bondo, Ugunja and Yala. Approved vendors can publish and manage their listings directly.",
    index: true,
  },
  "/privacy": {
    title: "Privacy and account data | Siaya Mtaa Market",
    description: "Read how Siaya Mtaa Market protects account information and handles data used for marketplace requests and orders.",
    index: true,
  },
  "/auth/callback": {
    title: "Secure sign-in | Siaya Mtaa Market",
    description: "Complete secure sign-in to Siaya Mtaa Market.",
    index: false,
  },
  "/auth/reset-password": {
    title: "Reset your password | Siaya Mtaa Market",
    description: "Reset your Siaya Mtaa Market account password.",
    index: false,
  },
  "/stations": {
    title: "Collection points in Siaya | Siaya Mtaa Market",
    description: "See collection-point information for Siaya Mtaa Market and confirm the exact hand-off arrangement before placing an order.",
    index: true,
  },
};

function RouteSeo() {
  const [location] = useLocation();
  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    const isProductRoute = /^\/products\/[^/]+$/.test(path);
    const seo = routeSeo[path] ?? (isProductRoute
      ? { title: "Local products in Siaya | Siaya Mtaa Market", description: "Browse current products from local sellers in Siaya, Bondo, Ugunja and Yala.", index: true }
      : { title: "Page not found | Siaya Mtaa Market", description: "This Siaya Mtaa Market page could not be found.", index: false });
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
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:title"]', "property", "og:title", seo.title);
    setMeta('meta[property="og:description"]', "property", "og:description", seo.description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Siaya Mtaa Market");
    document.head.querySelector('meta[property="og:image"]')?.remove();
    document.head.querySelector('meta[name="twitter:image"]')?.remove();
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", seo.title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", seo.description);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
  }, [location]);

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
