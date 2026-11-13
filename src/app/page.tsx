import HomeHero from "@/components/HomeHero";
import ShopSection from "@/components/ShopSection";
import SetupNotice from "@/components/SetupNotice";
import { IS_CONFIGURED } from "@/lib/config";
import { supabaseServer } from "@/lib/supabase";
import type { Category, Product } from "@/lib/types";

// Always render fresh stock levels.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!IS_CONFIGURED) return <SetupNotice />;

  const sb = supabaseServer();
  const [prods, cats] = await Promise.all([
    sb.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    sb.from("categories").select("*").order("sort_order").order("name"),
  ]);
  const loadError = Boolean(prods.error || cats.error);
  const products = (prods.data ?? []).map((p: any) => ({ ...p, price: Number(p.price) })) as Product[];
  const categories = (cats.data ?? []) as Category[];

  return (
    <>
      <HomeHero />
      <ShopSection products={products} categories={categories} hasError={loadError} />
    </>
  );
}
