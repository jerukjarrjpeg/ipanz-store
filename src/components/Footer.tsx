import Link from "next/link";
import Logo from "./Logo";
import { WHATSAPP_NUMBER } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>Orders are placed through WhatsApp. Pickup is free; delivery is RM0.50 per order.</p>
        <div className="flex items-center gap-4">
          <a className="font-medium text-ink hover:text-brand-green" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
            Chat on WhatsApp
          </a>
          <Link className="hover:text-ink" href="/admin">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
