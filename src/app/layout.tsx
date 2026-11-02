import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "Ipanz Store - Snacks, drinks and more", template: "%s · Ipanz Store" },
  description: "Browse, add to cart and order from Ipanz Store through WhatsApp. Free pickup, RM0.50 delivery.",
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
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-4 sm:px-6">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
