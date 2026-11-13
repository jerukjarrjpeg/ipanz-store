import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { LanguageProvider } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://ipanz-store.vercel.app"),
  title: {
    default: "Ipanz Store",
    template: "%s · Ipanz Store",
  },
  description:
    "Order snacks, chilled drinks, and quick treats in seconds from Ipanz Store with instant WhatsApp checkout. Free pickup at C201 and fast RM0.50 delivery.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_MY",
    url: "https://ipanz-store.vercel.app",
    siteName: "Ipanz Store",
    title: "Ipanz Store",
    description:
      "Order snacks, chilled drinks, and quick treats in seconds from Ipanz Store with instant WhatsApp checkout. Free pickup at C201 and fast RM0.50 delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ipanz Store - Snacks, drinks and more with quick WhatsApp ordering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ipanz Store",
    description:
      "Order snacks, chilled drinks, and quick treats in seconds from Ipanz Store with instant WhatsApp checkout. Free pickup at C201 and fast RM0.50 delivery.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F5F7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <LanguageProvider>
          <CartProvider>
            <Header />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-4 sm:px-6">{children}</main>
            <Footer />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
