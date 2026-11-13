"use client";

import { useState } from "react";
import { PAYMENT_QR_PATH } from "@/lib/config";
import { rm } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { DownloadIcon } from "./Icons";

export default function QrPanel({ total }: { total?: number }) {
  const { t } = useLanguage();
  const [missing, setMissing] = useState(false);

  return (
    <div className="rounded-3xl bg-brand-bg p-4 sm:p-5">
      <p className="text-sm font-semibold">{t.qrTitle}</p>
      <p className="mt-1 text-sm text-ink-mute">
        {t.qrDesc(typeof total === "number" ? rm(total) : undefined)}
      </p>
      <div className="mt-4 flex flex-col items-center gap-3">
        {missing ? (
          <div className="grid h-56 w-full max-w-xs place-items-center rounded-2xl border-2 border-dashed border-black/15 p-4 text-center text-sm text-ink-mute">
            {t.qrMissing}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={PAYMENT_QR_PATH}
            alt={t.qrAlt}
            onError={() => setMissing(true)}
            className="max-h-[26rem] w-full max-w-xs rounded-2xl bg-white object-contain shadow-soft"
          />
        )}
        {!missing && (
          <a href={PAYMENT_QR_PATH} download="ipanz-store-payment-qr.jpeg" className="btn-secondary">
            <DownloadIcon /> {t.downloadQr}
          </a>
        )}
      </div>
    </div>
  );
}
