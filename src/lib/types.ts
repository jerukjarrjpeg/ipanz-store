export type Category = { id: string; name: string; sort_order: number };

export type Product = {
  id: string;
  name: string;
  description: string;
  category_id: string | null;
  price: number;
  unit: string;
  stock: number;
  image_path: string | null;
  is_active: boolean;
  created_at: string;
};

export type Fulfilment = "pickup" | "delivery";
export type PaymentMethod = "cash" | "qr_transfer";
export type OrderStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type OrderItem = {
  name: string;
  unit: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

/** Shape returned by the place_order() database function. */
export type PlacedOrder = {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  fulfilment: Fulfilment;
  delivery_address: string;
  notes: string;
  payment_method: PaymentMethod;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items: OrderItem[];
};

export type AdminOrderItem = {
  id: string;
  product_name: string;
  unit: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type AdminOrder = Omit<PlacedOrder, "items"> & {
  stock_restored: boolean;
  order_items: AdminOrderItem[];
};
