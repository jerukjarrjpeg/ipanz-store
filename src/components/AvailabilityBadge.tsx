import { availability } from "@/lib/format";

const tones = {
  ok: "bg-brand-greenSoft text-brand-greenDark",
  low: "bg-brand-orangeSoft text-[#B35A00]",
  out: "bg-brand-redSoft text-brand-red",
} as const;

export default function AvailabilityBadge({ stock }: { stock: number }) {
  const a = availability({ stock });
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tones[a.tone]}`}>{a.label}</span>;
}
