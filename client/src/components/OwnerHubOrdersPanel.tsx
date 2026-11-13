import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Ban, CalendarDays, CheckCircle2, Clock3, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";

type HubOrderStatus = "PENDING_DROPOFF" | "RECEIVED_AT_HUB" | "COMPLETED" | "CANCELLED";
type HubOrder = {
  id: string;
  created_at: string;
  product_id: string | null;
  amount: number | string;
  quantity: number;
  buyer_phone: string;
  payment_method: string | null;
  payment_status: string;
  stock_review_status: "pending" | "confirmed" | "unavailable";
  order_status: HubOrderStatus;
  pickup_station: string;
  products: { title?: string | null; vendor_id?: string | null } | { title?: string | null; vendor_id?: string | null }[] | null;
};

const statusLabel: Record<HubOrderStatus, string> = {
  PENDING_DROPOFF: "Awaiting hub drop-off",
  RECEIVED_AT_HUB: "At collection point",
  COMPLETED: "Handed over",
  CANCELLED: "Cancelled",
};

const nextStatus: Partial<Record<HubOrderStatus, { status: HubOrderStatus; label: string }>> = {
  PENDING_DROPOFF: { status: "RECEIVED_AT_HUB", label: "Record arrival at hub" },
  RECEIVED_AT_HUB: { status: "COMPLETED", label: "Record handover" },
};

function productTitle(order: HubOrder) {
  const product = Array.isArray(order.products) ? order.products[0] : order.products;
  return product?.title || (order.product_id ? "Marketplace item" : "Removed marketplace item");
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function PendingOrderActions({ orderId, disabled, onConfirm, onUnavailable }: { orderId: string; disabled: boolean; onConfirm: (orderId: string) => void; onUnavailable: (orderId: string, markOutOfStock: boolean) => void }) {
  const [markOutOfStock, setMarkOutOfStock] = useState(false);
  return <div className="owner-hub-order-actions">
    <button type="button" className="primary-cta" disabled={disabled} onClick={() => onConfirm(orderId)}>Confirm availability</button>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={markOutOfStock} onChange={event => setMarkOutOfStock(event.target.checked)} />Also mark listing out of stock</label>
    <button type="button" className="secondary-cta" disabled={disabled} onClick={() => onUnavailable(orderId, markOutOfStock)}>Mark unavailable</button>
  </div>;
}

export default function OwnerHubOrdersPanel() {
  const ordersQuery = trpc.marketplace.v3OwnerHubOrders.useQuery(undefined, { retry: false });
  const reviewStock = trpc.marketplace.reviewV3OwnerHubOrderStock.useMutation({
    onSuccess: () => { toast.success("Order availability updated."); ordersQuery.refetch(); },
    onError: error => toast.error(error.message),
  });
  const updateStatus = trpc.marketplace.updateV3OwnerHubOrder.useMutation({
    onSuccess: () => { toast.success("Hub order status updated."); ordersQuery.refetch(); },
    onError: error => toast.error(error.message),
  });
  const orders = (ordersQuery.data ?? []) as HubOrder[];

  return (
    <section className="owner-console-section owner-hub-orders" aria-labelledby="owner-hub-orders-title">
      <div className="owner-section-heading">
        <Truck aria-hidden="true" />
        <div>
          <p className="eyebrow">Local marketplace fulfillment</p>
          <h2 id="owner-hub-orders-title" className="mt-2 text-2xl font-semibold">Hub pickup orders</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Check real availability before confirming each new order. Buyer phone numbers appear only in this founder-protected queue; no payment is collected online.</p>
        </div>
      </div>

      {ordersQuery.isLoading && <p className="owner-account-message" aria-live="polite">Loading hub pickup orders…</p>}
      {ordersQuery.isError && <p className="owner-account-message owner-account-error" role="alert">Hub pickup orders could not be loaded. No order status was changed.</p>}
      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && <p className="owner-account-message">No hub pickup orders have been placed yet.</p>}
      {!ordersQuery.isLoading && !ordersQuery.isError && orders.length > 0 && (
        <div className="owner-hub-order-list">
          {orders.map(order => {
            const next = nextStatus[order.order_status];
            const isOpen = order.order_status === "PENDING_DROPOFF" || order.order_status === "RECEIVED_AT_HUB";
            const needsStockCheck = order.stock_review_status === "pending";
            return (
              <article className="owner-hub-order-card" key={order.id}>
                <div className="owner-hub-order-topline">
                  <span className={`owner-hub-order-status status-${needsStockCheck ? "pending-review" : order.stock_review_status === "unavailable" ? "cancelled" : order.order_status.toLowerCase()}`}><Clock3 size={13} aria-hidden="true" />{needsStockCheck ? "Needs availability check" : order.stock_review_status === "unavailable" ? "Unavailable" : statusLabel[order.order_status] || order.order_status}</span>
                  <span className="owner-hub-order-ref">#{order.id.slice(0, 8)}</span>
                </div>
                <h3>{productTitle(order)}</h3>
                <div className="owner-hub-order-facts">
                  <span><PackageCheck size={14} aria-hidden="true" />Qty {order.quantity} · KES {Number(order.amount).toLocaleString("en-KE")}</span>
                  <span><CalendarDays size={14} aria-hidden="true" />{dateLabel(order.created_at)}</span>
                  <span><Truck size={14} aria-hidden="true" />Preferred area: {order.pickup_station || "Not specified"}</span>
                </div>
                <p className="mt-3 text-sm"><strong>Buyer contact:</strong> <a className="underline" href={`tel:${order.buyer_phone}`}>{order.buyer_phone}</a></p>
                <p className="owner-hub-order-payment">Payment record: {order.payment_status === "PENDING" ? "Pending — do not mark paid here" : order.payment_status}</p>
                {needsStockCheck && <PendingOrderActions orderId={order.id} disabled={reviewStock.isPending} onConfirm={orderId => reviewStock.mutate({ orderId, decision: "confirmed" })} onUnavailable={(orderId, markListingOutOfStock) => reviewStock.mutate({ orderId, decision: "unavailable", markListingOutOfStock })} />}
                {order.stock_review_status === "confirmed" && isOpen && (
                  <div className="owner-hub-order-actions">
                    {next && <button type="button" className="primary-cta" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ orderId: order.id, status: next.status })}><CheckCircle2 size={15} />{next.label}</button>}
                    <button type="button" className="secondary-cta" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ orderId: order.id, status: "CANCELLED" })}><Ban size={14} />Cancel order</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
