import { trpc } from "@/lib/trpc";
import { CalendarDays, PackageCheck, Truck } from "lucide-react";

type VendorHubOrder = {
  id: string;
  created_at: string;
  product_id: string | null;
  amount: number | string;
  order_status: "PENDING_DROPOFF" | "RECEIVED_AT_HUB" | "COMPLETED" | "CANCELLED";
  pickup_station: string;
  products: { title?: string | null } | { title?: string | null }[] | null;
};

const statusCopy: Record<VendorHubOrder["order_status"], string> = {
  PENDING_DROPOFF: "Awaiting hub drop-off",
  RECEIVED_AT_HUB: "At collection point",
  COMPLETED: "Handed over",
  CANCELLED: "Cancelled",
};

function titleFor(order: VendorHubOrder) {
  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  return product?.title || "Marketplace item";
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export default function VendorOrderActivity() {
  const query = trpc.marketplace.v3VendorHubOrders.useQuery(undefined, { retry: false });
  const orders = (query.data ?? []) as VendorHubOrder[];

  return (
    <section className="seller-listings-panel seller-order-activity" aria-labelledby="seller-order-activity-heading">
      <div className="seller-panel-heading">
        <div>
          <p className="eyebrow">Order activity</p>
          <h2 id="seller-order-activity-heading">Orders for your listings</h2>
          <p>Track the marketplace hand-off progress for your products. Buyer phone numbers and pickup PINs stay private.</p>
        </div>
      </div>
      {query.isLoading && <p className="seller-listing-message" aria-live="polite">Loading order activity…</p>}
      {query.isError && <p className="seller-listing-message seller-listing-error" role="alert">Order activity could not be loaded. Refresh the page and try again.</p>}
      {!query.isLoading && !query.isError && orders.length === 0 && <p className="seller-listing-message">No hub pickup orders are linked to your listings yet.</p>}
      {!query.isLoading && !query.isError && orders.length > 0 && (
        <div className="seller-order-list">
          {orders.map(order => (
            <article className="seller-order-row" key={order.id}>
              <span className={`seller-order-status status-${order.order_status.toLowerCase()}`}>{statusCopy[order.order_status] || order.order_status}</span>
              <strong>{titleFor(order)}</strong>
              <span><PackageCheck size={14} aria-hidden="true" />KES {Number(order.amount).toLocaleString("en-KE")}</span>
              <span><CalendarDays size={14} aria-hidden="true" />{dateLabel(order.created_at)}</span>
              <small><Truck size={14} aria-hidden="true" />{order.pickup_station || "Collection point to be confirmed"}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
