import { Drawer } from "../../components/Drawer";
import { StatusBadge } from "../../components/StatusBadge";
import type { Order, Shipment } from "../../domain/types";
import { DeliveryForm } from "./DeliveryForm";

interface ShipmentDrawerProps {
  order?: Order;
  shipment?: Shipment;
  open: boolean;
  onClose: () => void;
}

const paymentLabels = {
  pix: "PIX",
  check: "Cheque",
  boleto: "Boleto",
  deposit: "Depósito",
  direct: "Direto",
};

const checkLabels = { pending: "Pendente", matched: "Conferido", divergent: "Com divergência" };

export function ShipmentDrawer({ order, shipment, open, onClose }: ShipmentDrawerProps) {
  if (!order || !shipment) return null;
  const title = `Embarque ${order.orderNumber ?? order.id}`;
  return (
    <Drawer title={title} open={open} onClose={onClose}>
      <div className="logistics-detail">
        <div className="logistics-detail__heading">
          <div><strong>{order.clientName}</strong><span>{order.supplierName}</span></div>
          <StatusBadge tone={shipment.deliveredAt ? "success" : "info"}>{shipment.deliveredAt ? "Entregue" : "Em acompanhamento"}</StatusBadge>
        </div>
        <dl className="logistics-facts">
          <div><dt>Informe de carga</dt><dd>{shipment.loadReport ?? "Não informado"}</dd></div>
          <div><dt>Nota</dt><dd>{shipment.noteNumber ?? "Não informada"}</dd></div>
          <div><dt>Nota fiscal</dt><dd>{shipment.invoiceNumber ?? "Não informada"}</dd></div>
          <div><dt>Guia de vendas</dt><dd>{shipment.salesGuide ?? "Não informada"}</dd></div>
          <div><dt>Cópia do cliente</dt><dd>{shipment.clientCopy ?? "Não informada"}</dd></div>
          <div><dt>Cópia do fornecedor</dt><dd>{shipment.supplierCopy ?? "Não informada"}</dd></div>
          <div><dt>Motorista</dt><dd>{shipment.driverName ?? "Não informado"}</dd></div>
          <div><dt>Rota</dt><dd>{shipment.route ?? "Não informada"}</dd></div>
          <div><dt>Saída</dt><dd>{shipment.shippedAt ?? "Não informada"}</dd></div>
          <div><dt>Previsão</dt><dd>{shipment.expectedDeliveryAt ?? "Não informada"}</dd></div>
          <div><dt>Entrega</dt><dd>{shipment.deliveredAt ?? "Pendente"}</dd></div>
          <div><dt>Forma de pagamento</dt><dd>{shipment.driverPaymentMethod ? paymentLabels[shipment.driverPaymentMethod] : "Não informada"}</dd></div>
          <div><dt>Recibo do motorista</dt><dd>{shipment.driverReceipt ?? "Não informado"}</dd></div>
          <div><dt>Conferência do material</dt><dd>{shipment.materialCheck ? checkLabels[shipment.materialCheck] : "Não informada"}</dd></div>
        </dl>
        <DeliveryForm shipment={shipment} />
      </div>
    </Drawer>
  );
}
