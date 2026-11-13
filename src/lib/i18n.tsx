"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Language = "en" | "bm";

export interface Translations {
  // Navigation & Header
  navShop: string;
  cartAria: (count: number) => string;
  langAria: string;

  // Hero section
  heroTitle: string;
  heroSubtitle: string;
  startShopping: string;
  heroPickupTitle: string;
  heroPickupDesc: string;
  heroDeliveryTitle: string;
  heroDeliveryDesc: string;
  heroOrderingTitle: string;
  heroOrderingDesc: string;

  // Catalogue
  shopHeading: string;
  loadErrorTitle: string;
  loadErrorDesc: string;
  emptyProductsTitle: string;
  emptyProductsDesc: string;
  searchPlaceholder: string;
  searchAria: string;
  sortAria: string;
  sortNew: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  sortName: string;
  inStockOnly: string;
  categoriesAria: string;
  allCategories: string;
  noMatchesTitle: string;
  noMatchesDesc: string;
  clearFilters: string;

  // Product Card & Details
  perUnit: (unit: string) => string;
  addToCartAria: (name: string) => string;
  viewProductAria: (name: string) => string;
  backToAllProducts: string;
  decreaseQty: string;
  increaseQty: string;
  addToCart: string;
  addedToCart: string;
  soldOut: string;
  inStock: string;
  onlyLeft: (count: number) => string;
  inYourCart: (count: number) => string;
  viewCart: string;
  allStockInCart: string;

  // Cart
  yourCart: string;
  cartEmptyTitle: string;
  cartEmptyDesc: string;
  browseProducts: string;
  maxStockReached: string;
  decreaseItemAria: (name: string) => string;
  increaseItemAria: (name: string) => string;
  removeItemAria: (name: string) => string;
  summary: string;
  items: string;
  cartPickup: string;
  free: string;
  cartDelivery: string;
  cartDeliveryHint: string;
  goToCheckout: string;

  // Checkout
  backToCart: string;
  checkoutTitle: string;
  nothingToCheckoutTitle: string;
  nothingToCheckoutDesc: string;
  yourDetails: string;
  nameLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  fulfilmentHeading: string;
  pickupOptionTitle: string;
  pickupOptionHint: string;
  deliveryOptionTitle: string;
  deliveryOptionHint: string;
  deliveryAddressLabel: string;
  orderNotesLabel: string;
  optional: string;
  notesPlaceholder: string;
  paymentHeading: string;
  cashPaymentTitle: string;
  cashPaymentHint: string;
  qrPaymentTitle: string;
  qrPaymentHint: string;
  orderSummary: string;
  total: string;
  checkoutDelivery: string;
  checkoutPickup: string;
  placingOrder: string;
  placeOrder: string;
  checkoutDisclaimer: string;

  // Validation
  valName: string;
  valPhone: string;
  valAddress: string;
  valEmptyCart: string;
  valGenericError: string;

  // Order Confirmation
  orderSavedTitle: (orderNumber: string) => string;
  itemsReservedDesc: string;
  oneMoreStepTitle: string;
  oneMoreStepDesc: string;
  openWhatsAppBtn: string;
  sendProofBtn: string;
  continueShopping: string;

  // QR Panel
  qrTitle: string;
  qrDesc: (total?: string) => string;
  qrMissing: string;
  qrAlt: string;
  downloadQr: string;

  // Footer
  footerNote: string;
  chatOnWhatsApp: string;
  adminLink: string;

  // Not Found
  notFoundTitle: string;
  notFoundDesc: string;
  backToShop: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation & Header
    navShop: "Shop",
    cartAria: (count: number) => `Cart, ${count} item${count === 1 ? "" : "s"}`,
    langAria: "Change language",

    // Hero
    heroTitle: "Snacks and drinks, ordered in a minute.",
    heroSubtitle: "Pick what you like, check out, and send your order to us on WhatsApp. We’ll confirm it there.",
    startShopping: "Start shopping",
    heroPickupTitle: "Pickup",
    heroPickupDesc: "Free at C201",
    heroDeliveryTitle: "Delivery",
    heroDeliveryDesc: "RM0.50 per order",
    heroOrderingTitle: "Ordering",
    heroOrderingDesc: "Through WhatsApp",

    // Catalogue
    shopHeading: "Shop",
    loadErrorTitle: "We couldn’t load the products",
    loadErrorDesc: "Please refresh the page in a moment. If this keeps happening, check the Supabase setup in the README.",
    emptyProductsTitle: "The shelves are being stocked",
    emptyProductsDesc: "No products are listed yet. Please check back soon, or message us on WhatsApp to ask what’s available.",
    searchPlaceholder: "Search products",
    searchAria: "Search products",
    sortAria: "Sort products",
    sortNew: "Newest",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    sortName: "Name",
    inStockOnly: "In stock",
    categoriesAria: "Categories",
    allCategories: "All",
    noMatchesTitle: "Nothing matches your search",
    noMatchesDesc: "Try a different word or clear the filters.",
    clearFilters: "Clear filters",

    // Product Card & Details
    perUnit: (unit: string) => `per ${unit}`,
    addToCartAria: (name: string) => `Add ${name} to cart`,
    viewProductAria: (name: string) => `View ${name}`,
    backToAllProducts: "‹ All products",
    decreaseQty: "Decrease quantity",
    increaseQty: "Increase quantity",
    addToCart: "Add to cart",
    addedToCart: "Added",
    soldOut: "Sold out",
    inStock: "In stock",
    onlyLeft: (count: number) => `Only ${count} left`,
    inYourCart: (count: number) => `${count} in your cart.`,
    viewCart: "View cart",
    allStockInCart: "You already have all available stock in your cart.",

    // Cart
    yourCart: "Your cart",
    cartEmptyTitle: "Your cart is empty",
    cartEmptyDesc: "Add a few things you like and they’ll show up here.",
    browseProducts: "Browse products",
    maxStockReached: "Maximum available stock",
    decreaseItemAria: (name: string) => `Decrease ${name}`,
    increaseItemAria: (name: string) => `Increase ${name}`,
    removeItemAria: (name: string) => `Remove ${name}`,
    summary: "Summary",
    items: "Items",
    cartPickup: "Free Pickup at C201",
    free: "Free",
    cartDelivery: "Delivery",
    cartDeliveryHint: "Choose pickup or delivery at checkout. Delivery is charged once per order.",
    goToCheckout: "Go to checkout",

    // Checkout
    backToCart: "‹ Back to cart",
    checkoutTitle: "Checkout",
    nothingToCheckoutTitle: "Nothing to check out",
    nothingToCheckoutDesc: "Your cart is empty.",
    yourDetails: "Your details",
    nameLabel: "Name",
    phoneLabel: "WhatsApp number",
    phonePlaceholder: "e.g. 0123456789",
    fulfilmentHeading: "Pickup or delivery",
    pickupOptionTitle: "Pickup",
    pickupOptionHint: "Free at C201",
    deliveryOptionTitle: "Delivery",
    deliveryOptionHint: "RM0.50 for the whole order",
    deliveryAddressLabel: "Delivery address",
    orderNotesLabel: "Order notes",
    optional: "(optional)",
    notesPlaceholder: "Anything we should know?",
    paymentHeading: "Payment",
    cashPaymentTitle: "Pay on pickup or delivery",
    cashPaymentHint: "Pay us when you receive your order",
    qrPaymentTitle: "QR bank transfer",
    qrPaymentHint: "Optional. Send proof on WhatsApp",
    orderSummary: "Order summary",
    total: "Total",
    checkoutDelivery: "Delivery",
    checkoutPickup: "Free Pickup at C201",
    placingOrder: "Placing order…",
    placeOrder: "Place order",
    checkoutDisclaimer: "We’ll reserve your items, then open WhatsApp with your order ready to send. Your order is only passed to us once you send that message.",

    // Validation
    valName: "Please enter your name.",
    valPhone: "Please enter a valid WhatsApp number, e.g. 0123456789.",
    valAddress: "Please enter your full delivery address.",
    valEmptyCart: "Your cart is empty.",
    valGenericError: "We couldn’t place your order just now. Please check your connection and try again.",

    // Order Confirmation
    orderSavedTitle: (orderNumber: string) => `Order ${orderNumber} saved`,
    itemsReservedDesc: "Your items are reserved.",
    oneMoreStepTitle: "One more step:",
    oneMoreStepDesc: "send your order to us on WhatsApp. We can’t see it until you tap Send in WhatsApp.",
    openWhatsAppBtn: "Open WhatsApp to send order",
    sendProofBtn: "Send payment proof on WhatsApp",
    continueShopping: "Continue shopping",

    // QR Panel
    qrTitle: "Pay by QR bank transfer",
    qrDesc: (total?: string) =>
      `Scan this Malaysia National QR with your banking app or e-wallet${
        total ? ` and enter ${total}` : ""
      }. After placing your order, send your payment screenshot to us on WhatsApp.`,
    qrMissing: "Payment QR image not found. Add your QR image at public/payment-qr.jpeg.",
    qrAlt: "Ipanz Store payment QR code",
    downloadQr: "Download QR",

    // Footer
    footerNote: "Orders are placed through WhatsApp. Free pickup at C201; delivery is RM0.50 per order.",
    chatOnWhatsApp: "Chat on WhatsApp",
    adminLink: "Admin",

    // Not Found
    notFoundTitle: "We couldn’t find that page",
    notFoundDesc: "The product may have been removed or the link is incorrect.",
    backToShop: "Back to shop",
  },
  bm: {
    // Navigation & Header
    navShop: "Beli",
    cartAria: (count: number) => `Troli, ${count} item`,
    langAria: "Tukar bahasa",

    // Hero
    heroTitle: "Snek dan minuman, dipesan dalam seminit.",
    heroSubtitle: "Pilih apa yang anda suka, buat pesanan, dan hantar pesanan anda kepada kami di WhatsApp. Kami akan mengesahkannya di sana.",
    startShopping: "Mula membeli",
    heroPickupTitle: "Pengambilan",
    heroPickupDesc: "Percuma di C201",
    heroDeliveryTitle: "Penghantaran",
    heroDeliveryDesc: "RM0.50 setiap pesanan",
    heroOrderingTitle: "Pesanan",
    heroOrderingDesc: "Melalui WhatsApp",

    // Catalogue
    shopHeading: "Beli",
    loadErrorTitle: "Kami tidak dapat memuatkan produk",
    loadErrorDesc: "Sila muat semula halaman sebentar lagi. Jika ini berterusan, semak tetapan Supabase dalam README.",
    emptyProductsTitle: "Rak sedang diisi",
    emptyProductsDesc: "Tiada produk disenaraikan lagi. Sila kembali sebentar lagi, atau mesej kami di WhatsApp untuk bertanya apa yang ada.",
    searchPlaceholder: "Cari produk",
    searchAria: "Cari produk",
    sortAria: "Susun produk",
    sortNew: "Terbaharu",
    sortPriceAsc: "Harga: rendah ke tinggi",
    sortPriceDesc: "Harga: tinggi ke rendah",
    sortName: "Nama",
    inStockOnly: "Ada stok",
    categoriesAria: "Kategori",
    allCategories: "Semua",
    noMatchesTitle: "Tiada padanan carian anda",
    noMatchesDesc: "Cuba perkataan lain atau kosongkan penapis.",
    clearFilters: "Kosongkan penapis",

    // Product Card & Details
    perUnit: (unit: string) => `setiap ${unit}`,
    addToCartAria: (name: string) => `Tambah ${name} ke troli`,
    viewProductAria: (name: string) => `Lihat ${name}`,
    backToAllProducts: "‹ Semua produk",
    decreaseQty: "Kurangkan kuantiti",
    increaseQty: "Tambah kuantiti",
    addToCart: "Tambah ke troli",
    addedToCart: "Ditambah",
    soldOut: "Habis stok",
    inStock: "Ada stok",
    onlyLeft: (count: number) => `Tinggal ${count} sahaja`,
    inYourCart: (count: number) => `${count} dalam troli anda.`,
    viewCart: "Lihat troli",
    allStockInCart: "Anda sudah mempunyai semua stok yang ada di dalam troli anda.",

    // Cart
    yourCart: "Troli anda",
    cartEmptyTitle: "Troli anda kosong",
    cartEmptyDesc: "Tambah beberapa barang yang anda suka dan ia akan muncul di sini.",
    browseProducts: "Lihat produk",
    maxStockReached: "Stok maksimum tersedia",
    decreaseItemAria: (name: string) => `Kurangkan ${name}`,
    increaseItemAria: (name: string) => `Tambah ${name}`,
    removeItemAria: (name: string) => `Buang ${name}`,
    summary: "Ringkasan",
    items: "Item",
    cartPickup: "Pengambilan Percuma di C201",
    free: "Percuma",
    cartDelivery: "Penghantaran",
    cartDeliveryHint: "Pilih pengambilan atau penghantaran semasa pembayaran. Penghantaran dicaj sekali bagi setiap pesanan.",
    goToCheckout: "Teruskan ke pembayaran",

    // Checkout
    backToCart: "‹ Kembali ke troli",
    checkoutTitle: "Pembayaran",
    nothingToCheckoutTitle: "Tiada apa-apa untuk dibayar",
    nothingToCheckoutDesc: "Troli anda kosong.",
    yourDetails: "Maklumat anda",
    nameLabel: "Nama",
    phoneLabel: "Nombor WhatsApp",
    phonePlaceholder: "cth. 0123456789",
    fulfilmentHeading: "Pengambilan atau penghantaran",
    pickupOptionTitle: "Pengambilan",
    pickupOptionHint: "Percuma di C201",
    deliveryOptionTitle: "Penghantaran",
    deliveryOptionHint: "RM0.50 untuk keseluruhan pesanan",
    deliveryAddressLabel: "Alamat penghantaran",
    orderNotesLabel: "Nota pesanan",
    optional: "(pilihan)",
    notesPlaceholder: "Ada apa-apa yang perlu kami tahu?",
    paymentHeading: "Pembayaran",
    cashPaymentTitle: "Bayar semasa ambil atau hantar",
    cashPaymentHint: "Bayar kepada kami apabila anda menerima pesanan anda",
    qrPaymentTitle: "Pindahan bank melalui QR",
    qrPaymentHint: "Pilihan. Hantar bukti di WhatsApp",
    orderSummary: "Ringkasan pesanan",
    total: "Jumlah",
    checkoutDelivery: "Penghantaran",
    checkoutPickup: "Pengambilan Percuma di C201",
    placingOrder: "Membuat pesanan…",
    placeOrder: "Buat pesanan",
    checkoutDisclaimer: "Kami akan tempah item anda, kemudian buka WhatsApp dengan pesanan sedia untuk dihantar. Pesanan anda hanya diproses selepas anda menghantar mesej tersebut.",

    // Validation
    valName: "Sila masukkan nama anda.",
    valPhone: "Sila masukkan nombor WhatsApp yang sah, cth. 0123456789.",
    valAddress: "Sila masukkan alamat penghantaran lengkap anda.",
    valEmptyCart: "Troli anda kosong.",
    valGenericError: "Kami tidak dapat membuat pesanan anda sekarang. Sila semak sambungan anda dan cuba lagi.",

    // Order Confirmation
    orderSavedTitle: (orderNumber: string) => `Pesanan ${orderNumber} disimpan`,
    itemsReservedDesc: "Item anda telah ditempah.",
    oneMoreStepTitle: "Satu langkah lagi:",
    oneMoreStepDesc: "hantar pesanan anda kepada kami di WhatsApp. Kami tidak dapat melihatnya sehingga anda menekan Hantar di WhatsApp.",
    openWhatsAppBtn: "Buka WhatsApp untuk hantar pesanan",
    sendProofBtn: "Hantar bukti pembayaran di WhatsApp",
    continueShopping: "Teruskan membeli-belah",

    // QR Panel
    qrTitle: "Bayar melalui pindahan bank QR",
    qrDesc: (total?: string) =>
      `Imbas QR National Malaysia (DuitNow) ini dengan aplikasi perbankan atau e-dompet anda${
        total ? ` dan masukkan ${total}` : ""
      }. Selepas membuat pesanan, hantar tangkap layar pembayaran kepada kami di WhatsApp.`,
    qrMissing: "Imej QR pembayaran tidak dijumpai. Tambah imej QR anda di public/payment-qr.jpeg.",
    qrAlt: "Kod QR pembayaran Ipanz Store",
    downloadQr: "Muat turun QR",

    // Footer
    footerNote: "Pesanan dibuat melalui WhatsApp. Pengambilan percuma di C201; penghantaran RM0.50 setiap pesanan.",
    chatOnWhatsApp: "Sembang di WhatsApp",
    adminLink: "Admin",

    // Not Found
    notFoundTitle: "Kami tidak menjumpai halaman tersebut",
    notFoundDesc: "Produk mungkin telah dikeluarkan atau pautan salah.",
    backToShop: "Kembali ke kedai",
  },
};

const STORAGE_KEY = "ipanz-lang";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === "bm" || saved === "en") {
        setLangState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  const value = {
    lang,
    setLang,
    t: translations[lang],
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Graceful fallback for components rendered outside LanguageProvider
    return {
      lang: "en",
      setLang: () => {},
      t: translations.en,
    };
  }
  return ctx;
}
