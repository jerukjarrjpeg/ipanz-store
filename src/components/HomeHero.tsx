"use client";

import Logo from "./Logo";
import { useLanguage } from "@/lib/i18n";

export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section className="mt-2 overflow-hidden rounded-[2rem] bg-brand-green px-6 py-10 text-white sm:px-12 sm:py-16">
      <Logo light />
      <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.05] sm:text-6xl">
        {t.heroTitle}
      </h1>
      <p className="mt-4 max-w-lg text-lg text-white/85">
        {t.heroSubtitle}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="#shop"
          className="btn bg-white px-7 py-3.5 text-base text-brand-greenDark shadow-soft hover:bg-brand-greenSoft"
        >
          {t.startShopping}
        </a>
      </div>
      <dl className="mt-10 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/15 px-5 py-4">
          <dt className="text-sm text-white/80">{t.heroPickupTitle}</dt>
          <dd className="text-lg font-semibold">{t.heroPickupDesc}</dd>
        </div>
        <div className="rounded-2xl bg-brand-orange/90 px-5 py-4">
          <dt className="text-sm text-white/80">{t.heroDeliveryTitle}</dt>
          <dd className="text-lg font-semibold">{t.heroDeliveryDesc}</dd>
        </div>
        <div className="rounded-2xl bg-brand-red/90 px-5 py-4">
          <dt className="text-sm text-white/80">{t.heroOrderingTitle}</dt>
          <dd className="text-lg font-semibold">{t.heroOrderingDesc}</dd>
        </div>
      </dl>
    </section>
  );
}
