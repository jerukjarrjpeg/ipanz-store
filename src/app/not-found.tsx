"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="card mx-auto mt-10 max-w-md p-10 text-center">
      <h1 className="text-2xl font-bold">{t.notFoundTitle}</h1>
      <p className="mt-2 text-ink-mute">{t.notFoundDesc}</p>
      <Link href="/#shop" className="btn-primary mt-6">
        {t.backToShop}
      </Link>
    </div>
  );
}
