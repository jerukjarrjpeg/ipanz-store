import Catalogue from "@/components/Catalogue";
import Logo from "@/components/Logo";
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
  const loadError = prods.error || cats.error;
  const products = (prods.data ?? []).map((p: any) => ({ ...p, price: Number(p.price) })) as Product[];
  const categories = (cats.data ?? []) as Category[];

  return (
    <>
      <section className="mt-2 overflow-hidden rounded-[2rem] bg-brand-green px-6 py-10 text-white sm:px-12 sm:py-16">
        <Logo light />
        <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.05] sm:text-6xl">
          Snacks and drinks, ordered in a minute.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/85">
          Pick what you like, check out, and send your order to us on WhatsApp. We’ll confirm it there.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#shop" className="btn bg-white px-7 py-3.5 text-base text-brand-greenDark shadow-soft hover:bg-brand-greenSoft">
            Start shopping
          </a>
        </div>
        <dl className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["Pickup", "Free", "bg-white/15"],
            ["Delivery", "RM0.50 per order", "bg-brand-orange/90"],
            ["Ordering", "Through WhatsApp", "bg-brand-red/90"],
          ].map(([k, v, bg]) => (
            <div key={k} className={`rounded-2xl px-5 py-4 ${bg}`}>
              <dt className="text-sm text-white/80">{k}</dt>
              <dd className="text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="shop" className="scroll-mt-20 pt-12">
        <h2 className="mb-5 text-2xl font-bold sm:text-3xl">Shop</h2>
        {loadError ? (
          <div className="card px-6 py-10 text-center">
            <h3 className="text-lg font-bold">We couldn’t load the products</h3>
            <p className="mt-1 text-ink-mute">Please refresh the page in a moment. If this keeps happening, check the Supabase setup in the README.</p>
          </div>
        ) : (
          <Catalogue products={products} categories={categories} />
        )}
      </section>
    </>
  );
}
