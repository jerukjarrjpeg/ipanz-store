"use client";

import { useEffect, useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { IMAGE_BUCKET } from "@/lib/config";
import { imageUrl, uuid } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type Props = { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void };

export default function ProductForm({ product, categories, onClose, onSaved }: Props) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [unit, setUnit] = useState(product?.unit ?? "pack");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [active, setActive] = useState(product?.is_active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl(product?.image_path));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(f: File | null) {
    setError("");
    if (!f) return;
    if (!TYPES[f.type]) return setError("Image must be a JPG, PNG or WebP file.");
    if (f.size > MAX_BYTES) return setError("Image must be 5 MB or smaller.");
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (name.trim().length < 1) return setError("Enter a product name.");
    if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 100000) return setError("Enter a valid price.");
    if (!Number.isInteger(stockNum) || stockNum < 0) return setError("Stock must be a whole number, 0 or more.");
    if (unit.trim().length < 1) return setError("Enter a unit, e.g. pack, bottle, kg.");

    setSaving(true);
    setError("");
    const sb = supabaseBrowser();
    let uploaded: string | null = null;
    try {
      let catId: string | null = categoryId || null;
      if (categoryId === "__new") {
        const nm = newCategory.trim();
        if (!nm) throw new Error("Enter a name for the new category.");
        const { data, error: cErr } = await sb.from("categories").insert({ name: nm }).select("id").single();
        if (cErr) throw new Error(cErr.code === "23505" ? "That category already exists. Pick it from the list." : cErr.message);
        catId = data.id;
      }

      let imagePath = product?.image_path ?? null;
      if (file) {
        const path = `${uuid()}.${TYPES[file.type]}`;
        const { error: upErr } = await sb.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (upErr) throw new Error("Image upload failed: " + upErr.message);
        uploaded = path;
        imagePath = path;
      }

      const payload = {
        name: name.trim(), description: description.trim(), category_id: catId,
        price: Math.round(priceNum * 100) / 100, unit: unit.trim(), stock: stockNum,
        is_active: active, image_path: imagePath,
      };
      const res = product
        ? await sb.from("products").update(payload).eq("id", product.id)
        : await sb.from("products").insert(payload);
      if (res.error) throw new Error(res.error.message);

      // Replace flow: remove the old file only after the new record is saved.
      if (uploaded && product?.image_path) await sb.storage.from(IMAGE_BUCKET).remove([product.image_path]);
      onSaved();
    } catch (err) {
      if (uploaded) await sb.storage.from(IMAGE_BUCKET).remove([uploaded]);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={product ? "Edit product" : "Add product"}>
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-xl animate-rise overflow-y-auto rounded-t-[2rem] bg-white p-6 shadow-lift sm:rounded-[2rem] sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{product ? "Edit product" : "Add product"}</h2>
          <button type="button" onClick={onClose} className="btn-secondary px-4 py-2">Close</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="p-name">Name</label>
            <input id="p-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </div>
          <div>
            <label className="label" htmlFor="p-desc">Description</label>
            <textarea id="p-desc" className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-cat">Category</label>
              <select id="p-cat" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new">+ New category…</option>
              </select>
            </div>
            {categoryId === "__new" && (
              <div>
                <label className="label" htmlFor="p-newcat">New category name</label>
                <input id="p-newcat" className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} maxLength={40} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label" htmlFor="p-price">Price (RM)</label>
              <input id="p-price" className="input" type="number" inputMode="decimal" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="p-unit">Unit</label>
              <input id="p-unit" className="input" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={30} required />
            </div>
            <div>
              <label className="label" htmlFor="p-stock">Stock</label>
              <input id="p-stock" className="input" type="number" inputMode="numeric" step="1" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>
          </div>

          <div>
            <span className="label">Image</span>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <label className="btn-secondary cursor-pointer">
                {preview ? "Replace image" : "Choose image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <p className="mt-1.5 text-xs text-ink-mute">JPG, PNG or WebP, up to 5 MB. Square images look best.</p>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5 accent-[#0A8A4A]" />
            Show in shop
          </label>
        </div>

        {error && <p role="alert" className="mt-4 rounded-2xl bg-brand-redSoft px-4 py-3 text-sm text-brand-red">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save product"}</button>
        </div>
      </form>
    </div>
  );
}
