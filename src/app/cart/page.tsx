"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { DELIVERY_FEE } from "@/lib/config";
import { rm } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import ProductImage from "@/components/ProductImage";
import Notices from "@/components/Notices";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from "@/components/Icons";

export default function CartPage() {
  const { lines, ready, subtotal, setQty, remove, refresh } = useCart();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<string[]>([]);

  useEffect(() => {
    if (ready) refresh().then(setNotices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return <div className="mt-10 h-40 animate-pulse rounded-3xl bg-black/5" />;

  if (lines.length === 0) {
    return (
      <div className="card mx-auto mt-8 max-w-lg px-6 py-16 text-center">
        <CartIcon className="mx-auto h-12 w-12 text-ink-mute/40" />
        <h1 className="mt-4 text-2xl font-bold">{t.cartEmptyTitle}</h1>
        <p className="mt-1 text-ink-mute">{t.cartEmptyDesc}</p>
        <Link href="/#shop" className="btn-primary mt-6">
          {t.browseProducts}
        </Link>
        <div className="mt-4">
          <Notices items={notices} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <h1 className="mb-5 text-3xl font-bold">{t.yourCart}</h1>
      <Notices items={notices} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {lines.map((l) => (
            <li key={l.productId} className="card group flex items-center gap-4 p-3 sm:p-4">
              <Link
                href={`/product/${l.productId}`}
                className="block h-20 w-20 shrink-0 overflow-hidden rounded-2xl sm:h-24 sm:w-24"
              >
                <ProductImage path={l.image} alt={l.name} className="h-full w-full" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${l.productId}`}
                  className="line-clamp-2 font-semibold leading-snug hover:text-brand-green"
                >
                  {l.name}
                </Link>
                <p className="mt-0.5 text-sm text-ink-mute">
                  {rm(l.price)} {t.perUnit(l.unit)}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center rounded-full bg-brand-bg">
                    <button
                      aria-label={t.decreaseItemAria(l.name)}
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/10"
                      onClick={() => setQty(l.productId, l.qty - 1)}
                    >
                      <MinusIcon />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                    <button
                      aria-label={t.increaseItemAria(l.name)}
                      className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/10 disabled:opacity-30"
                      disabled={l.qty >= l.stock}
                      onClick={() => setQty(l.productId, l.qty + 1)}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  <p className="font-bold">{rm(l.price * l.qty)}</p>
                </div>
                {l.qty >= l.stock && <p className="mt-1 text-xs text-brand-orange">{t.maxStockReached}</p>}
              </div>
              <button
                aria-label={t.removeItemAria(l.name)}
                onClick={() => remove(l.productId)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-mute transition hover:bg-brand-redSoft hover:text-brand-red"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-6 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">{t.summary}</h2>
          <dl className="mt-4 space-y-2 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-mute">{t.items}</dt>
              <dd className="font-medium">{rm(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-mute">{t.cartPickup}</dt>
              <dd className="font-medium text-brand-green">{t.free}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-mute">{t.cartDelivery}</dt>
              <dd className="font-medium">+{rm(DELIVERY_FEE)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-mute">{t.cartDeliveryHint}</p>
          <Link href="/checkout" className="btn-primary btn-lg mt-5 w-full">
            {t.goToCheckout}
          </Link>
        </aside>
      </div>
    </div>
  );
}
