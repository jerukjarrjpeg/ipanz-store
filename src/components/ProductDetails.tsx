"use client";

import Link from "next/link";
import AddToCart from "@/components/AddToCart";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import ProductImage from "@/components/ProductImage";
import { rm } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export default function ProductDetails({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string | null;
}) {
  const { t } = useLanguage();

  return (
    <div className="pt-2">
      <Link
        href="/#shop"
        className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-ink-mute hover:bg-black/5 hover:text-ink"
      >
        {t.backToAllProducts}
      </Link>
      <div className="mt-2 grid gap-8 md:grid-cols-2">
        <div className="group card overflow-hidden">
          <ProductImage path={product.image_path} alt={product.name} className="aspect-square" />
        </div>
        <div className="flex flex-col justify-center">
          {categoryName && <p className="text-sm font-medium text-ink-mute">{categoryName}</p>}
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold">
            {rm(product.price)}{" "}
            <span className="text-base font-medium text-ink-mute">{t.perUnit(product.unit)}</span>
          </p>
          <div className="mt-3">
            <AvailabilityBadge stock={product.stock} />
          </div>
          {product.description && (
            <p className="mt-5 max-w-prose whitespace-pre-line leading-relaxed text-ink-mute">
              {product.description}
            </p>
          )}
          <div className="mt-8">
            <AddToCart product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
