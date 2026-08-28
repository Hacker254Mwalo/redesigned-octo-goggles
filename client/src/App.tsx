import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
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
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
