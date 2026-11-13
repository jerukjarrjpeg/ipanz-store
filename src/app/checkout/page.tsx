"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { DELIVERY_FEE, IS_CONFIGURED } from "@/lib/config";
import { rm, uuid } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase";
import { buildOrderMessage, buildProofMessage, waLink } from "@/lib/whatsapp";
import type { Fulfilment, PaymentMethod, PlacedOrder } from "@/lib/types";
import Notices from "@/components/Notices";
import QrPanel from "@/components/QrPanel";
import SetupNotice from "@/components/SetupNotice";
import { ChatIcon, CheckIcon } from "@/components/Icons";

const LAST_ORDER_KEY = "ipanz-last-order";
const PHONE_RE = /^\+?[0-9]{9,15}$/;

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; title: string; hint: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-2xl p-4 text-left ring-1 transition duration-200 ${
            value === o.value
              ? "bg-brand-greenSoft ring-2 ring-brand-green"
              : "bg-white ring-black/10 hover:bg-black/[0.03]"
          }`}
        >
          <span className="block font-semibold">{o.title}</span>
          <span className="block text-sm text-ink-mute">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const { lines, ready, subtotal, clear, refresh } = useCart();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fulfilment, setFulfilment] = useState<Fulfilment>("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const inFlight = useRef(false);
  // One id per checkout attempt: retries/double-clicks can never create two orders.
  const idemKey = useRef<string>("");
  if (!idemKey.current) idemKey.current = uuid();

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LAST_ORDER_KEY);
      if (saved) setPlaced(JSON.parse(saved) as PlacedOrder);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (ready && !placed) refresh().then(setNotices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const fee = fulfilment === "delivery" ? DELIVERY_FEE : 0;
  const total = useMemo(() => Math.round((subtotal + fee) * 100) / 100, [subtotal, fee]);

  if (!IS_CONFIGURED) return <SetupNotice />;
  if (!ready) return <div className="mt-10 h-40 animate-pulse rounded-3xl bg-black/5" />;
  if (placed)
    return (
      <OrderPlaced
        order={placed}
        onDone={() => {
          sessionStorage.removeItem(LAST_ORDER_KEY);
          setPlaced(null);
        }}
      />
    );

  if (lines.length === 0) {
    return (
      <div className="card mx-auto mt-8 max-w-lg px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">{t.nothingToCheckoutTitle}</h1>
        <p className="mt-1 text-ink-mute">{t.nothingToCheckoutDesc}</p>
        <Link href="/#shop" className="btn-primary mt-6">
          {t.browseProducts}
        </Link>
        <div className="mt-4">
          <Notices items={notices} />
        </div>
      </div>
    );
  }

  function validate(): string {
    if (name.trim().length < 2) return t.valName;
    if (!PHONE_RE.test(phone.replace(/[\s\-()]/g, ""))) return t.valPhone;
    if (fulfilment === "delivery" && address.trim().length < 8) return t.valAddress;
    if (lines.length === 0) return t.valEmptyCart;
    return "";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inFlight.current) return; // prevents duplicate submissions
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabaseBrowser().rpc("place_order", {
        p_idempotency_key: idemKey.current,
        p_customer_name: name.trim(),
        p_customer_phone: phone.trim(),
        p_fulfilment: fulfilment,
        p_delivery_address: fulfilment === "delivery" ? address.trim() : "",
        p_notes: notes.trim(),
        p_payment_method: payment,
        // Only ids and quantities are sent. Prices and stock are read by the database.
        p_items: lines.map((l) => ({ product_id: l.productId, quantity: l.qty })),
      });

      if (rpcError) {
        if (rpcError.code === "P0001") {
          // Order was definitively rejected: show why, sync the cart, allow a fresh attempt.
          setError(rpcError.message);
          idemKey.current = uuid();
          refresh().then(setNotices);
        } else {
          // Unknown outcome (e.g. network): keep the same id so a retry cannot duplicate the order.
          setError(t.valGenericError);
        }
        return;
      }

      const order = data as PlacedOrder;
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
      } catch {
        /* ignore */
      }
      setPlaced(order);
      clear();
      idemKey.current = uuid();
      window.scrollTo({ top: 0 });
      // Best effort only: browsers may block this. The success screen always has a button.
      window.open(waLink(buildOrderMessage(order)), "_blank", "noopener,noreferrer");
    } catch {
      setError(t.valGenericError);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="pt-2">
      <Link
        href="/cart"
        className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-ink-mute hover:bg-black/5 hover:text-ink"
      >
        {t.backToCart}
      </Link>
      <h1 className="mb-5 mt-1 text-3xl font-bold">{t.checkoutTitle}</h1>
      <Notices items={notices} />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_24rem]" noValidate>
        <div className="space-y-6">
          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-bold">{t.yourDetails}</h2>
            <div>
              <label className="label" htmlFor="name">
                {t.nameLabel}
              </label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={80}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                {t.phoneLabel}
              </label>
              <input
                id="phone"
                className="input"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder={t.phonePlaceholder}
                maxLength={20}
                required
              />
            </div>
          </section>

          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-bold">{t.fulfilmentHeading}</h2>
            <Segment<Fulfilment>
              value={fulfilment}
              onChange={setFulfilment}
              options={[
                { value: "pickup", title: t.pickupOptionTitle, hint: t.pickupOptionHint },
                { value: "delivery", title: t.deliveryOptionTitle, hint: t.deliveryOptionHint },
              ]}
            />
            {fulfilment === "delivery" && (
              <div>
                <label className="label" htmlFor="address">
                  {t.deliveryAddressLabel}
                </label>
                <textarea
                  id="address"
                  className="input min-h-24"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                  maxLength={300}
                  required
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="notes">
                {t.orderNotesLabel} <span className="font-normal text-ink-mute">{t.optional}</span>
              </label>
              <textarea
                id="notes"
                className="input min-h-20"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder={t.notesPlaceholder}
              />
            </div>
          </section>

          <section className="card space-y-4 p-6">
            <h2 className="text-lg font-bold">{t.paymentHeading}</h2>
            <Segment<PaymentMethod>
              value={payment}
              onChange={setPayment}
              options={[
                { value: "cash", title: t.cashPaymentTitle, hint: t.cashPaymentHint },
                { value: "qr_transfer", title: t.qrPaymentTitle, hint: t.qrPaymentHint },
              ]}
            />
            {payment === "qr_transfer" && <QrPanel total={total} />}
          </section>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">{t.orderSummary}</h2>
          <ul className="mt-4 divide-y divide-black/5 text-[15px]">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="font-medium">{l.qty}×</span> {l.name}
                </span>
                <span className="shrink-0 font-medium">{rm(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-black/5 pt-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-mute">{t.items}</dt>
              <dd>{rm(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-mute">
                {fulfilment === "delivery" ? t.checkoutDelivery : t.checkoutPickup}
              </dt>
              <dd className={fee === 0 ? "font-medium text-brand-green" : ""}>
                {fee === 0 ? t.free : rm(fee)}
              </dd>
            </div>
            <div className="flex justify-between pt-1 text-lg font-bold">
              <dt>{t.total}</dt>
              <dd>{rm(total)}</dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-brand-redSoft px-4 py-3 text-sm text-brand-red">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary btn-lg mt-5 w-full">
            {submitting ? t.placingOrder : t.placeOrder}
          </button>
          <p className="mt-3 text-xs text-ink-mute">{t.checkoutDisclaimer}</p>
        </aside>
      </form>
    </div>
  );
}

function OrderPlaced({ order, onDone }: { order: PlacedOrder; onDone: () => void }) {
  const { t } = useLanguage();
  const orderLink = waLink(buildOrderMessage(order));

  return (
    <div className="mx-auto max-w-xl pt-4">
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-greenSoft text-brand-green">
            <CheckIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{t.orderSavedTitle(order.order_number)}</h1>
            <p className="text-sm text-ink-mute">{t.itemsReservedDesc}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-brand-orangeSoft px-4 py-3 text-sm text-[#8A4600]">
          <b>{t.oneMoreStepTitle}</b> {t.oneMoreStepDesc}
        </div>

        <a
          href={orderLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp btn-lg mt-5 w-full"
        >
          <ChatIcon /> {t.openWhatsAppBtn}
        </a>

        {order.payment_method === "qr_transfer" && (
          <div className="mt-6 space-y-4">
            <QrPanel total={order.total} />
            <a
              href={waLink(buildProofMessage(order))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full"
            >
              <ChatIcon /> {t.sendProofBtn}
            </a>
          </div>
        )}

        <div className="mt-6 border-t border-black/5 pt-4 text-[15px]">
          <ul className="divide-y divide-black/5">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3 py-2">
                <span>
                  <span className="font-medium">{it.quantity}×</span> {it.name}
                </span>
                <span className="font-medium">{rm(it.line_total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1.5 border-t border-black/5 pt-3">
            <div className="flex justify-between">
              <dt className="text-ink-mute">{t.items}</dt>
              <dd>{rm(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-mute">
                {order.fulfilment === "delivery" ? t.checkoutDelivery : t.checkoutPickup}
              </dt>
              <dd className={order.delivery_fee === 0 ? "font-medium text-brand-green" : ""}>
                {order.delivery_fee > 0 ? rm(order.delivery_fee) : t.free}
              </dd>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <dt>{t.total}</dt>
              <dd>{rm(order.total)}</dd>
            </div>
          </dl>
        </div>

        <Link href="/#shop" onClick={onDone} className="btn-secondary mt-6 w-full">
          {t.continueShopping}
        </Link>
      </div>
    </div>
  );
}
