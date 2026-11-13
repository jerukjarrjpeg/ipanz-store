"use client";

import Link from "next/link";
import Logo from "./Logo";
import { CartIcon } from "./Icons";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n";

export default function Header() {
  const { count } = useCart();
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Ipanz Store home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <div
            className="flex items-center rounded-full bg-brand-bg p-0.5 text-xs font-semibold ring-1 ring-black/5"
            role="group"
            aria-label={t.langAria}
          >
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "en" ? "bg-white text-ink shadow-sm" : "text-ink-mute hover:text-ink"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("bm")}
              aria-pressed={lang === "bm"}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "bm" ? "bg-white text-ink shadow-sm" : "text-ink-mute hover:text-ink"
              }`}
            >
              BM
            </button>
          </div>

          <Link
            href="/#shop"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink-mute transition hover:bg-black/5 hover:text-ink sm:block"
          >
            {t.navShop}
          </Link>
          <Link
            href="/cart"
            aria-label={t.cartAria(count)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-brand-bg text-ink transition hover:bg-black/10"
          >
            <CartIcon />
            {count > 0 && (
              <span
                key={count}
                className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white"
              >
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
