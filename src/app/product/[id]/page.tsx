import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import AvailabilityBadge from "@/components/AvailabilityBadge";
import ProductImage from "@/components/ProductImage";
import SetupNotice from "@/components/SetupNotice";
import { IS_CONFIGURED } from "@/lib/config";
import { rm, UUID_RE } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!IS_CONFIGURED || !UUID_RE.test(id)) return null;
  const sb = supabaseServer();
  const { data } = await sb.from("products").select("*, categories(name)").eq("id", id).eq("is_active", true).maybeSingle();
  return data as (Product & { categories: { name: string } | null }) | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await load(id);
  return { title: p?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!IS_CONFIGURED) return <SetupNotice />;
  const { id } = await params;
  const raw = await load(id);
  if (!raw) notFound();
  const product: Product = { ...raw, price: Number(raw.price) };

  return (
    <div className="pt-2">
      <Link href="/#shop" className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-ink-mute hover:bg-black/5 hover:text-ink">
        ‹ All products
      </Link>
      <div className="mt-2 grid gap-8 md:grid-cols-2">
        <div className="group card overflow-hidden">
          <ProductImage path={product.image_path} alt={product.name} className="aspect-square" />
        </div>
        <div className="flex flex-col justify-center">
          {raw.categories?.name && <p className="text-sm font-medium text-ink-mute">{raw.categories.name}</p>}
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold">
            {rm(product.price)} <span className="text-base font-medium text-ink-mute">per {product.unit}</span>
          </p>
          <div className="mt-3"><AvailabilityBadge stock={product.stock} /></div>
          {product.description && <p className="mt-5 max-w-prose whitespace-pre-line leading-relaxed text-ink-mute">{product.description}</p>}
          <div className="mt-8"><AddToCart product={product} /></div>
        </div>
      </div>
    </div>
  );
}
