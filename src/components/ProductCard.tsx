"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { rm } from "@/lib/format";
import { useCart } from "@/lib/cart";
import ProductImage from "./ProductImage";
import AvailabilityBadge from "./AvailabilityBadge";
import { CheckIcon, PlusIcon } from "./Icons";

export default function ProductCard({ product, categoryName }: { product: Product; categoryName?: string }) {
  const { add, lines } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const inCart = lines.find((l) => l.productId === product.id)?.qty ?? 0;
  const atMax = inCart >= product.stock;

  function handleAdd() {
    add(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <article className="group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/product/${product.id}`} className="block" aria-label={`View ${product.name}`}>
        <ProductImage path={product.image_path} alt={product.name} className={`aspect-square ${soldOut ? "opacity-50" : ""}`} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {categoryName && <p className="mb-1 text-xs font-medium text-ink-mute">{categoryName}</p>}
        <Link href={`/product/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-snug hover:text-brand-green">
          {product.name}
        </Link>
        <div className="mt-2"><AvailabilityBadge stock={product.stock} /></div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-lg font-bold leading-none">{rm(product.price)}</p>
            <p className="mt-1 text-xs text-ink-mute">per {product.unit}</p>
          </div>
          <button
            onClick={handleAdd}
            disabled={soldOut || atMax}
            aria-label={`Add ${product.name} to cart`}
            className={`grid h-10 w-10 place-items-center rounded-full text-white shadow-soft transition duration-200 active:scale-90 disabled:opacity-40 ${
              justAdded ? "bg-brand-orange" : "bg-brand-green hover:bg-brand-greenDark"
            }`}
          >
            {justAdded ? <CheckIcon /> : <PlusIcon />}
          </button>
        </div>
      </div>
    </article>
  );
}
