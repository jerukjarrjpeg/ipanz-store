/** Text-based brand mark: wordmark plus a three-stripe device in the store colours. */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex flex-col gap-[3px]" aria-hidden>
        <span className="h-[5px] w-6 rounded-full bg-brand-orange" />
        <span className="h-[5px] w-6 rounded-full bg-brand-green" />
        <span className="h-[5px] w-6 rounded-full bg-brand-red" />
      </span>
      <span className={`text-[19px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Ipanz <span className={`font-semibold ${light ? "text-white/80" : "text-brand-green"}`}>Store</span>
      </span>
    </span>
  );
}
