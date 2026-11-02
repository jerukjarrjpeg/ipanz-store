"use client";

import Link from "next/link";
import Logo from "./Logo";
import { CartIcon } from "./Icons";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Ipanz Store home"><Logo /></Link>
        <nav className="flex items-center gap-2">
          <Link href="/#shop" className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink-mute transition hover:bg-black/5 hover:text-ink sm:block">
            Shop
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-brand-bg text-ink transition hover:bg-black/10"
          >
            <CartIcon />
            {count > 0 && (
              <span key={count} className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-brand-red px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
