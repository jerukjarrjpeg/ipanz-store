"use client";

import { useMemo, useState } from "react";
import type { Category, Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { BoxIcon, SearchIcon } from "./Icons";

type Sort = "new" | "price-asc" | "price-desc" | "name";

export default function Catalogue({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<Sort>("new");
  const [inStockOnly, setInStockOnly] = useState(false);

  const catName = useMemo(() => new Map<string, string>(categories.map((c): [string, string] => [c.id, c.name])), [categories]);
  const usedCategories = useMemo(
    () => categories.filter((c) => products.some((p) => p.category_id === c.id)),
    [categories, products]
  );

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const r = products.filter((p) => {
      if (cat !== "all" && p.category_id !== cat) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
    });
    const sorted = [...r];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return sorted;
  }, [products, q, cat, sort, inStockOnly]);

  if (products.length === 0) {
    return (
      <div className="card mt-6 flex flex-col items-center px-6 py-16 text-center">
        <BoxIcon className="h-14 w-14 text-ink-mute/40" />
        <h3 className="mt-4 text-xl font-bold">The shelves are being stocked</h3>
        <p className="mt-1 max-w-sm text-ink-mute">No products are listed yet. Please check back soon, or message us on WhatsApp to ask what’s available.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="input pl-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products" className="input w-auto pr-8">
            <option value="new">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
          <label className="chip cursor-pointer select-none gap-2 whitespace-nowrap">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="accent-[#0A8A4A]" />
            In stock
          </label>
        </div>
      </div>

      {usedCategories.length > 0 && (
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Categories">
          <button className={`chip shrink-0 ${cat === "all" ? "chip-active" : ""}`} onClick={() => setCat("all")}>All</button>
          {usedCategories.map((c) => (
            <button key={c.id} className={`chip shrink-0 ${cat === c.id ? "chip-active" : ""}`} onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <h3 className="text-lg font-bold">Nothing matches your search</h3>
          <p className="mt-1 text-ink-mute">Try a different word or clear the filters.</p>
          <button className="btn-secondary mt-5" onClick={() => { setQ(""); setCat("all"); setInStockOnly(false); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} categoryName={p.category_id ? catName.get(p.category_id) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
