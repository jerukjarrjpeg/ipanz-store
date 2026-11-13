"use client";

import Link from "next/link";
import Logo from "./Logo";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <p>{t.footerNote}</p>
        <div className="flex items-center gap-4">
          <a
            className="font-medium text-ink hover:text-brand-green"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.chatOnWhatsApp}
          </a>
          <Link className="hover:text-ink" href="/admin">
            {t.adminLink}
          </Link>
        </div>
      </div>
    </footer>
  );
}
