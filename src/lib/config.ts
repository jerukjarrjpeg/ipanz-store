// Public configuration only. Never put secrets in this project.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "60136378872").replace(/\D/g, "");

export const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Display value only. The authoritative fee is enforced in the database function place_order().
export const DELIVERY_FEE = 0.5;

export const IMAGE_BUCKET = "product-images";
export const PAYMENT_QR_PATH = "/payment-qr.jpeg";
