"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { rm, toWaNumber } from "@/lib/format";
import type { AdminOrder, OrderStatus } from "@/lib/types";

const FILTERS: ("all" | OrderStatus)[] = ["all", "pending", "confirmed", "completed", "cancelled"];

const badge: Record<OrderStatus, string> = {
  pending: "bg-brand-orangeSoft text-[#B35A00]",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-brand-greenSoft text-brand-greenDark",
  cancelled: "bg-brand-redSoft text-brand-red",
};

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabaseBrowser()
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) setError("Couldn’t load orders: " + err.message);
    else setOrders((data ?? []) as AdminOrder[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(o: AdminOrder, status: OrderStatus) {
    const warn =
      status === "cancelled"
        ? `Cancel ${o.order_number}? Stock for its items will be returned to the shelf. This can’t be undone.`
        : status === "completed"
        ? `Mark ${o.order_number} as completed? Completed orders can’t be changed afterwards.`
        : "";
    if (warn && !window.confirm(warn)) return;
    setBusyId(o.id);
    setError("");
    const { error: err } = await supabaseBrowser().rpc("admin_set_order_status", { p_order_id: o.id, p_status: status });
    setBusyId(null);
    if (err) setError(err.message);
    await load();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);
  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`chip capitalize ${filter === f ? "chip-active" : ""}`}>
            {f} <span className="ml-1.5 opacity-60">{counts[f] ?? 0}</span>
          </button>
        ))}
        <button className="btn-secondary ml-auto" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-2xl bg-brand-redSoft px-4 py-3 text-sm text-brand-red">{error}</p>}

      {!loading && shown.length === 0 && (
        <div className="card px-6 py-14 text-center text-ink-mute">No {filter === "all" ? "" : filter} orders yet.</div>
      )}

      <ul className="space-y-4">
        {shown.map((o) => (
          <li key={o.id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{o.order_number}</p>
                <p className="text-sm text-ink-mute">{new Date(o.created_at).toLocaleString("en-MY")}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${badge[o.status]}`}>{o.status}</span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 text-[15px]">
                <p className="font-semibold">{o.customer_name}</p>
                <a className="text-brand-green hover:underline" href={`https://wa.me/${toWaNumber(o.customer_phone)}`} target="_blank" rel="noopener noreferrer">
                  {o.customer_phone} (WhatsApp)
                </a>
                <p className="text-ink-mute">{o.fulfilment === "delivery" ? "Delivery" : "Pickup"} · {o.payment_method === "qr_transfer" ? "QR transfer" : "Pay on pickup / delivery"}</p>
                {o.fulfilment === "delivery" && <p className="whitespace-pre-line text-ink-mute">{o.delivery_address}</p>}
                {o.notes && <p className="rounded-xl bg-brand-bg px-3 py-2 text-sm">Note: {o.notes}</p>}
              </div>
              <div className="text-[15px]">
                <ul className="divide-y divide-black/5">
                  {o.order_items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-3 py-1.5">
                      <span><span className="font-medium">{it.quantity}×</span> {it.product_name} <span className="text-ink-mute">({it.unit})</span></span>
                      <span>{rm(it.line_total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-black/5 pt-2 text-ink-mute"><span>Delivery</span><span>{o.delivery_fee > 0 ? rm(o.delivery_fee) : "Free"}</span></div>
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{rm(o.total)}</span></div>
              </div>
            </div>

            {(o.status === "pending" || o.status === "confirmed") && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-black/5 pt-4">
                {o.status === "pending" && (
                  <button className="btn-primary" disabled={busyId === o.id} onClick={() => setStatus(o, "confirmed")}>Confirm</button>
                )}
                <button className="btn-secondary" disabled={busyId === o.id} onClick={() => setStatus(o, "completed")}>Mark completed</button>
                <button className="btn-danger" disabled={busyId === o.id} onClick={() => setStatus(o, "cancelled")}>Cancel and restock</button>
              </div>
            )}
            {o.status === "cancelled" && (
              <p className="mt-4 text-xs text-ink-mute">{o.stock_restored ? "Stock was returned to the shelf." : "No stock was restored."}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
