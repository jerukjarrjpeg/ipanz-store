"use client";

import { useLanguage } from "@/lib/i18n";
import Catalogue from "./Catalogue";
import type { Category, Product } from "@/lib/types";

export default function ShopSection({
  products,
  categories,
  hasError,
}: {
  products: Product[];
  categories: Category[];
  hasError: boolean;
}) {
  const { t } = useLanguage();

  return (
    <section id="shop" className="scroll-mt-20 pt-12">
      <h2 className="mb-5 text-2xl font-bold sm:text-3xl">{t.shopHeading}</h2>
      {hasError ? (
        <div className="card px-6 py-10 text-center">
          <h3 className="text-lg font-bold">{t.loadErrorTitle}</h3>
          <p className="mt-1 text-ink-mute">{t.loadErrorDesc}</p>
        </div>
      ) : (
        <Catalogue products={products} categories={categories} />
      )}
    </section>
  );
}
