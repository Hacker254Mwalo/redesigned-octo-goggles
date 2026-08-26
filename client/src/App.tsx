import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import CartPage from "./pages/CartPage";
import DashboardPage from "./pages/DashboardPage";
import Home from "./pages/Home";
import PickupStations from "./pages/PickupStations";
import ProductDetail from "./pages/ProductDetail";
import RequestDeskPage from "./pages/RequestDeskPage";
import VendorPage from "./pages/VendorPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/products/:slug"} component={ProductDetail} />
      <Route path={"/cart"} component={CartPage} />
      <Route path={"/stations"} component={PickupStations} />
      <Route path={"/request"} component={RequestDeskPage} />
      <Route path={"/vendor"} component={VendorPage} />
      <Route path={"/dashboard"} component={DashboardPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
