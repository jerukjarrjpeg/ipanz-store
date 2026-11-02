import { WHATSAPP_NUMBER } from "./config";
import { rm } from "./format";
import type { PlacedOrder } from "./types";

export function waLink(message: string, number: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Built from the order returned by the database, so prices/totals are authoritative. */
export function buildOrderMessage(o: PlacedOrder): string {
  const lines: string[] = [];
  lines.push("*Ipanz Store - New Order*");
  lines.push(`Order no: ${o.order_number}`);
  lines.push("");
  lines.push("*Items*");
  o.items.forEach((it, i) => {
    lines.push(`${i + 1}. ${it.name} (${it.unit}) x${it.quantity} @ ${rm(it.unit_price)} = ${rm(it.line_total)}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${rm(o.subtotal)}`);
  lines.push(o.fulfilment === "delivery" ? `Delivery fee: ${rm(o.delivery_fee)}` : "Delivery fee: FREE (pickup)");
  lines.push(`*Total: ${rm(o.total)}*`);
  lines.push("");
  lines.push(`Method: ${o.fulfilment === "delivery" ? "Delivery" : "Pickup"}`);
  lines.push(`Name: ${o.customer_name}`);
  lines.push(`WhatsApp: ${o.customer_phone}`);
  if (o.fulfilment === "delivery") lines.push(`Address: ${o.delivery_address}`);
  if (o.notes) lines.push(`Notes: ${o.notes}`);
  lines.push(
    o.payment_method === "qr_transfer"
      ? "Payment: QR bank transfer (I will send my proof of payment in this chat)"
      : "Payment: Pay on pickup / delivery"
  );
  return lines.join("\n");
}

export function buildProofMessage(o: PlacedOrder): string {
  return [
    `Hi Ipanz Store, I have paid ${rm(o.total)} by QR transfer for order ${o.order_number}.`,
    `Name: ${o.customer_name}`,
    "My payment screenshot is attached below.",
  ].join("\n");
}
