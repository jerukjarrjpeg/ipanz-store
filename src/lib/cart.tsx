"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabaseBrowser } from "./supabase";
import { rm } from "./format";
import type { Product } from "./types";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  unit: string;
  image: string | null;
  stock: number;
  qty: number;
};

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Re-reads prices/stock from Supabase and returns human-readable notices about any changes. */
  refresh: () => Promise<string[]>;
};

const STORAGE_KEY = "ipanz-cart-v1";
const MAX_QTY = 99;
const Ctx = createContext<CartCtx | null>(null);

function sanitise(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const l = r as Record<string, unknown>;
    if (typeof l.productId !== "string" || typeof l.name !== "string") continue;
    const qty = Math.floor(Number(l.qty));
    if (!Number.isFinite(qty) || qty < 1) continue;
    out.push({
      productId: l.productId,
      name: l.name,
      price: Number(l.price) || 0,
      unit: typeof l.unit === "string" ? l.unit : "",
      image: typeof l.image === "string" ? l.image : null,
      stock: Math.max(0, Math.floor(Number(l.stock) || 0)),
      qty: Math.min(qty, MAX_QTY),
    });
  }
  return out;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const linesRef = useRef<CartLine[]>([]);
  linesRef.current = lines;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLines(sanitise(JSON.parse(saved)));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [lines, ready]);

  const add = useCallback((p: Product, qty = 1) => {
    if (p.stock <= 0) return;
    setLines((prev) => {
      const cap = Math.min(p.stock, MAX_QTY);
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p.id
            ? { ...l, qty: Math.min(l.qty + qty, cap), stock: p.stock, price: Number(p.price) }
            : l
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: Number(p.price),
          unit: p.unit,
          image: p.image_path,
          stock: p.stock,
          qty: Math.min(qty, cap),
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: Math.min(Math.max(0, qty), l.stock, MAX_QTY) } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const refresh = useCallback(async () => {
    const current = linesRef.current;
    if (current.length === 0) return [];
    const { data, error } = await supabaseBrowser()
      .from("products")
      .select("id,name,price,unit,stock,image_path,is_active")
      .in("id", current.map((l) => l.productId));
    if (error || !data) return [];

    const byId = new Map<string, any>(data.map((p: any): [string, any] => [p.id, p]));
    const notices: string[] = [];
    const next: CartLine[] = [];
    const isBm = typeof window !== "undefined" && localStorage.getItem("ipanz-lang") === "bm";
    for (const l of current) {
      const p = byId.get(l.productId);
      if (!p || !p.is_active || p.stock <= 0) {
        notices.push(
          isBm
            ? `"${l.name}" tidak lagi tersedia dan telah dikeluarkan dari troli anda.`
            : `"${l.name}" is no longer available and was removed from your cart.`
        );
        continue;
      }
      const qty = Math.min(l.qty, p.stock, MAX_QTY);
      if (qty < l.qty) {
        notices.push(
          isBm
            ? `Hanya ${p.stock} unit "${p.name}" yang tinggal, jadi kuantiti telah dikurangkan.`
            : `Only ${p.stock} of "${p.name}" left, so the quantity was reduced.`
        );
      }
      if (Number(p.price) !== l.price) {
        notices.push(
          isBm
            ? `Harga untuk "${p.name}" kini ${rm(Number(p.price))}.`
            : `The price of "${p.name}" is now ${rm(Number(p.price))}.`
        );
      }
      next.push({
        productId: l.productId,
        name: p.name,
        price: Number(p.price),
        unit: p.unit,
        image: p.image_path,
        stock: p.stock,
        qty,
      });
    }
    setLines(next);
    return notices;
  }, []);

  const value = useMemo<CartCtx>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = Math.round(lines.reduce((s, l) => s + l.price * l.qty, 0) * 100) / 100;
    return { lines, ready, count, subtotal, add, setQty, remove, clear, refresh };
  }, [lines, ready, add, setQty, remove, clear, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
