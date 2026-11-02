import { IMAGE_BUCKET, SUPABASE_URL } from "./config";
import type { Product } from "./types";

export const rm = (n: number) => `RM${Number(n).toFixed(2)}`;

export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${encodeURI(path)}`;
}

export type Availability = { label: string; tone: "ok" | "low" | "out" };

export function availability(p: Pick<Product, "stock">): Availability {
  if (p.stock <= 0) return { label: "Sold out", tone: "out" };
  if (p.stock <= 5) return { label: `Only ${p.stock} left`, tone: "low" };
  return { label: "In stock", tone: "ok" };
}

/** Converts a locally-entered Malaysian number (0123456789) to wa.me format (60123456789). */
export function toWaNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "60" + digits.slice(1);
  return digits;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** crypto.randomUUID() only exists in secure contexts (https/localhost); fall back for LAN testing. */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
