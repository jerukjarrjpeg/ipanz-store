import { imageUrl } from "@/lib/format";
import { BoxIcon } from "./Icons";

export default function ProductImage({ path, alt, className = "" }: { path: string | null; alt: string; className?: string }) {
  const src = imageUrl(path);
  return (
    <div className={`relative overflow-hidden bg-brand-bg ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
      ) : (
        <div className="grid h-full w-full place-items-center text-ink-mute/40"><BoxIcon /></div>
      )}
    </div>
  );
}
