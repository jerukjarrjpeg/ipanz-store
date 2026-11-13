"use client";

import { useLanguage } from "@/lib/i18n";

const tones = {
  ok: "bg-brand-greenSoft text-brand-greenDark",
  low: "bg-brand-orangeSoft text-[#B35A00]",
  out: "bg-brand-redSoft text-brand-red",
} as const;

export default function AvailabilityBadge({ stock }: { stock: number }) {
  const { t } = useLanguage();
  let label: string;
  let tone: "ok" | "low" | "out";

  if (stock <= 0) {
    label = t.soldOut;
    tone = "out";
  } else if (stock <= 5) {
    label = t.onlyLeft(stock);
    tone = "low";
  } else {
    label = t.inStock;
    tone = "ok";
  }

  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</span>;
}
