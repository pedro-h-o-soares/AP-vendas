import type { Order } from "../../domain/types";

export function selectAnnualSupplierOrders(orders: Order[], supplierId: string, year: number): Order[] {
  return orders.filter((order) => {
    const canonicalDate = order.orderedAt ?? order.shipment?.shippedAt;
    return order.supplierId === supplierId && canonicalDate?.startsWith(`${year}-`);
  });
}
