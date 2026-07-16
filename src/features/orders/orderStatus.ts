import type { OrderStatus } from "../../domain/types";
import type { StatusTone } from "../../components/StatusBadge";

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "Rascunho",
  quote: "Orçamento",
  "awaiting-stock": "Aguardando estoque",
  "quote-sent": "Orçamento enviado",
  "awaiting-supplier": "Aguardando fornecedor",
  "awaiting-client": "Aguardando cliente",
  confirmed: "Confirmado",
  preparing: "Em preparação",
  "shipment-informed": "Embarque informado",
  "in-transit": "Em trânsito",
  delivered: "Entregue",
  incident: "Com ocorrência",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const orderStatusTone = (status: OrderStatus): StatusTone => {
  if (["delivered", "completed", "confirmed"].includes(status)) return "success";
  if (["incident", "cancelled"].includes(status)) return "danger";
  if (["awaiting-stock", "awaiting-supplier", "awaiting-client"].includes(status)) return "warning";
  return "info";
};
