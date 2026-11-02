"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { IMAGE_BUCKET } from "@/lib/config";
import { rm } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import ProductImage from "../ProductImage";
import AvailabilityBadge from "../AvailabilityBadge";
import ProductForm from "./ProductForm";

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = supabaseBrowser();
    const [p, c] = await Promise.all([
      sb.from("products").select("*").order("created_at", { ascending: false }),
      sb.from("categories").select("*").order("sort_order").order("name"),
    ]);
    if (p.error || c.error) setError("Couldn’t load products: " + (p.error?.message ?? c.error?.message));
    else {
      setError("");
      setProducts((p.data ?? []).map((x: any) => ({ ...x, price: Number(x.price) })) as Product[]);
      setCategories((c.data ?? []) as Category[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(p: Product) {
    const { error: err } = await supabaseBrowser().from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (err) setError(err.message);
    await load();
  }

  async function remove(p: Product) {
    if (!window.confirm(`Delete "${p.name}"? Past orders keep their own copy of the item details. This can’t be undone.`)) return;
    const sb = supabaseBrowser();
    const { error: err } = await sb.from("products").delete().eq("id", p.id);
    if (err) { setError("Couldn’t delete: " + err.message); return; }
    if (p.image_path) await sb.storage.from(IMAGE_BUCKET).remove([p.image_path]);
    await load();
  }

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "No category";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-ink-mute">{products.length} product{products.length === 1 ? "" : "s"}</p>
        <button className="btn-primary" onClick={() => setEditing("new")}>Add product</button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-2xl bg-brand-redSoft px-4 py-3 text-sm text-brand-red">{error}</p>}

      {!loading && products.length === 0 && (
        <div className="card px-6 py-14 text-center">
          <h3 className="text-lg font-bold">No products yet</h3>
          <p className="mt-1 text-ink-mute">Add your first product and it will appear in the shop straight away.</p>
          <button className="btn-primary mt-5" onClick={() => setEditing("new")}>Add product</button>
        </div>
      )}

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={p.id} className="card flex flex-wrap items-center gap-4 p-3 sm:p-4">
            <ProductImage path={p.image_path} alt={p.name} className="h-16 w-16 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate font-semibold">{p.name}</p>
              <p className="text-sm text-ink-mute">{catName(p.category_id)} · {rm(p.price)} per {p.unit} · {p.stock} in stock</p>
              <div className="mt-1 flex items-center gap-2">
                <AvailabilityBadge stock={p.stock} />
                {!p.is_active && <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-ink-mute">Hidden from shop</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => toggleActive(p)}>{p.is_active ? "Hide" : "Show"}</button>
              <button className="btn-secondary" onClick={() => setEditing(p)}>Edit</button>
              <button className="btn-danger" onClick={() => remove(p)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
