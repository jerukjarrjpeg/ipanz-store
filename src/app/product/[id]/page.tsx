import { notFound } from "next/navigation";
import ProductDetails from "@/components/ProductDetails";
import SetupNotice from "@/components/SetupNotice";
import { IS_CONFIGURED } from "@/lib/config";
import { UUID_RE } from "@/lib/format";
import { supabaseServer } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!IS_CONFIGURED || !UUID_RE.test(id)) return null;
  const sb = supabaseServer();
  const { data } = await sb
    .from("products")
    .select("*, categories(name)")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  return data as (Product & { categories: { name: string } | null }) | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await load(id);
  const title = p?.name ?? "Product";
  const description = p?.description
    ? p.description.slice(0, 160)
    : `Order ${title} from Ipanz Store. Free pickup at C201, delivery RM0.50.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · Ipanz Store`,
      description,
      url: `/product/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Ipanz Store`,
      description,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (!IS_CONFIGURED) return <SetupNotice />;
  const { id } = await params;
  const raw = await load(id);
  if (!raw) notFound();
  const product: Product = { ...raw, price: Number(raw.price) };

  return <ProductDetails product={product} categoryName={raw.categories?.name} />;
}
