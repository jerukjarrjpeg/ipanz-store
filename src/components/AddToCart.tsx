"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";
import { CheckIcon, MinusIcon, PlusIcon } from "./Icons";
import Link from "next/link";

export default function AddToCart({ product }: { product: Product }) {
  const { add, lines } = useCart();
  const { t } = useLanguage();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.productId === product.id)?.qty ?? 0;
  const room = Math.max(0, Math.min(product.stock, 99) - inCart);

  if (product.stock <= 0) {
    return <button disabled className="btn-secondary w-full sm:w-auto">{t.soldOut}</button>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full bg-white ring-1 ring-black/10">
          <button
            aria-label={t.decreaseQty}
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5 disabled:opacity-30"
            disabled={qty <= 1}
            onClick={() => setQty((q) => q - 1)}
          >
            <MinusIcon />
          </button>
          <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
            {qty}
          </span>
          <button
            aria-label={t.increaseQty}
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5 disabled:opacity-30"
            disabled={qty >= room}
            onClick={() => setQty((q) => q + 1)}
          >
            <PlusIcon />
          </button>
        </div>
        <button
          className="btn-primary btn-lg"
          disabled={room <= 0}
          onClick={() => {
            add(product, Math.min(qty, room));
            setAdded(true);
            setQty(1);
            setTimeout(() => setAdded(false), 1500);
          }}
        >
          {added ? (
            <>
              <CheckIcon /> {t.addedToCart}
            </>
          ) : (
            t.addToCart
          )}
        </button>
      </div>
      {inCart > 0 && (
        <p className="mt-3 text-sm text-ink-mute">
          {t.inYourCart(inCart)}{" "}
          <Link href="/cart" className="font-medium text-brand-green hover:underline">
            {t.viewCart}
          </Link>
        </p>
      )}
      {room <= 0 && <p className="mt-3 text-sm text-brand-orange">{t.allStockInCart}</p>}
    </div>
  );
}
