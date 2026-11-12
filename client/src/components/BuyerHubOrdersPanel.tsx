import { trpc } from "@/lib/trpc";
import { CalendarDays, KeyRound, MapPin, PackageCheck } from "lucide-react";

type BuyerHubOrder = {
  id: string;
  created_at: string;
  product_id: string | null;
  amount: number | string;
  payment_method: string;
  payment_status: string;
  order_status: "PENDING_DROPOFF" | "RECEIVED_AT_HUB" | "COMPLETED" | "CANCELLED";
  pickup_pin: string | null;
  pickup_station: string;
  products: { title?: string | null; image_url?: string | null } | { title?: string | null; image_url?: string | null }[] | null;
};

const statusCopy: Record<BuyerHubOrder["order_status"], string> = {
  PENDING_DROPOFF: "Waiting for item at hub",
  RECEIVED_AT_HUB: "Ready at collection point",
  COMPLETED: "Collected",
  CANCELLED: "Cancelled",
};

function productFor(order: BuyerHubOrder) {
  return Array.isArray(order.products) ? order.products[0] : order.products;
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function BuyerHubOrdersPanel() {
  const query = trpc.marketplace.v3BuyerHubOrders.useQuery(undefined, { retry: false });
  const orders = (query.data ?? []) as BuyerHubOrder[];

  return (
    <section className="workspace-orders buyer-hub-orders" aria-labelledby="buyer-hub-orders-heading">
      <div className="workspace-section-heading">
        <div>
          <p className="eyebrow">Local marketplace</p>
          <h2 id="buyer-hub-orders-heading">Your hub pickup orders</h2>
        </div>
        <span>Private to your signed-in account</span>
      </div>
      <p className="buyer-hub-order-note">Keep your pickup PIN private. MtaaMarket checks the code when the order is handed over.</p>
      {query.isLoading && <p className="workspace-order-message" aria-live="polite">Loading your hub pickup orders…</p>}
      {query.isError && <p className="workspace-order-message workspace-order-error" role="alert">Your hub pickup orders could not be loaded. Refresh your account workspace and try again.</p>}
      {!query.isLoading && !query.isError && orders.length === 0 && <p className="workspace-order-message">No Siaya Mtaa Market hub pickup orders are linked to your account yet.</p>}
      {!query.isLoading && !query.isError && orders.length > 0 && (
        <div className="buyer-hub-order-grid">
          {orders.map(order => {
            const product = productFor(order);
            const isOpen = order.order_status === "PENDING_DROPOFF" || order.order_status === "RECEIVED_AT_HUB";
            return (
              <article className="buyer-hub-order-card" key={order.id}>
                <div className="buyer-hub-order-head">
                  {product?.image_url ? <img src={product.image_url} alt="" /> : <span className="buyer-hub-order-placeholder"><PackageCheck size={19} aria-hidden="true" /></span>}
                  <div><small>Order #{order.id.slice(0, 8)}</small><h3>{product?.title || (order.product_id ? "Marketplace item" : "Removed marketplace item")}</h3></div>
                </div>
                <span className={`buyer-hub-order-status status-${order.order_status.toLowerCase()}`}>{statusCopy[order.order_status] || order.order_status}</span>
                <dl className="buyer-hub-order-facts">
                  <div><dt>Amount</dt><dd>KES {Number(order.amount).toLocaleString("en-KE")}</dd></div>
                  <div><dt>Collection point</dt><dd><MapPin size={13} aria-hidden="true" />{order.pickup_station || "To be confirmed by MtaaMarket"}</dd></div>
                  <div><dt>Placed</dt><dd><CalendarDays size={13} aria-hidden="true" />{dateLabel(order.created_at)}</dd></div>
                  <div><dt>Payment</dt><dd>{order.payment_status === "PENDING" ? "Due at confirmed hand-off" : order.payment_status}</dd></div>
                </dl>
                {isOpen && order.pickup_pin && <div className="buyer-hub-order-pin"><KeyRound size={16} aria-hidden="true" /><span><small>Your pickup PIN</small><strong>{order.pickup_pin}</strong></span></div>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
