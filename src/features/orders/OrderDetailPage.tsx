import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { StatusBadge } from "../../components/StatusBadge";
import type { OrderItem, OrderStatus } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { OrderTimeline, type OrderTimelineEvent } from "./OrderTimeline";

const tabs = ["Resumo", "Itens e valores", "Comunicações", "Carga e entrega", "Financeiro", "Ocorrências", "Histórico"] as const;
type Tab = typeof tabs[number];

const statusLabels: Partial<Record<OrderStatus, string>> = {
  "in-transit": "Em trânsito",
  delivered: "Entregue",
};

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, incidents, installments, payments, updateOrderStatus } = usePrototypeStore();
  const order = orders.find((candidate) => candidate.id === orderId);
  const [activeTab, setActiveTab] = useState<Tab>("Resumo");
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>();
  const [sessionEvents, setSessionEvents] = useState<OrderTimelineEvent[]>([]);

  const initialEvents = useMemo<OrderTimelineEvent[]>(() => {
    if (!order) return [];
    const events: OrderTimelineEvent[] = [];
    if (order.orderedAt) events.push({ id: "ordered", date: order.orderedAt, title: "Pedido registrado" });
    if (order.shipment?.shippedAt) events.push({ id: "shipment", date: order.shipment.shippedAt, title: "Embarque informado", detail: order.shipment.invoiceNumber ? `Nota ${order.shipment.invoiceNumber}` : undefined });
    return events;
  }, [order]);

  if (!order) {
    return <section><h1>Pedido não encontrado</h1><p>Confira o endereço ou retorne à lista de pedidos.</p><button type="button" onClick={() => navigate("/pedidos")}>Voltar para pedidos</button></section>;
  }

  const reference = order.orderNumber ?? order.oguraNumber ?? order.id;
  const orderIncidents = incidents.filter((incident) => incident.orderId === order.id);
  const orderInstallments = installments.filter((installment) => installment.orderId === order.id);
  const orderPayments = payments.filter((payment) => payment.orderId === order.id);
  const itemColumns: DataTableColumn<OrderItem>[] = [
    { key: "description", header: "Item", render: (item) => item.description },
    { key: "quantity", header: "Quantidade", render: (item) => `${item.quantity} ${item.unit}` },
    { key: "unitPrice", header: "Preço unitário", render: (item) => item.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), align: "end" },
    { key: "total", header: "Total", render: (item) => item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), align: "end" },
  ];

  const confirmStatus = () => {
    if (!pendingStatus) return;
    updateOrderStatus(order.id, pendingStatus);
    const label = statusLabels[pendingStatus] ?? pendingStatus;
    setSessionEvents((current) => [...current, { id: `status-${current.length + 1}`, date: new Date().toLocaleDateString("pt-BR"), title: `Status alterado para ${label.toLocaleLowerCase("pt-BR")}` }]);
    setPendingStatus(undefined);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Resumo":
        return <div className="detail-grid"><article><h3>Partes</h3><p><strong>Cliente:</strong> {order.clientName}</p><p><strong>Fornecedor:</strong> {order.supplierName}</p></article><article><h3>Condições</h3><p>{order.paymentTerms}</p><p><StatusBadge tone="info">{order.status}</StatusBadge></p></article></div>;
      case "Itens e valores":
        return <><DataTable columns={itemColumns} rows={order.items} getRowId={(item) => item.id} emptyMessage="Nenhum item registrado" /><p className="detail-total"><strong>Valor líquido:</strong> {order.values?.net.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "—"}</p></>;
      case "Comunicações":
        return order.communications?.length ? <ul>{order.communications.map((communication) => <li key={communication.id}>{communication.date} · {communication.channel} · {communication.description}</li>)}</ul> : <p>Nenhuma comunicação registrada.</p>;
      case "Carga e entrega":
        return <div className="detail-grid"><article><h3>Embarque</h3><p>Data: {order.shipment?.shippedAt ?? "Não informado"}</p><p>Nota: {order.shipment?.invoiceNumber ?? "—"}</p></article><article><h3>Entrega</h3><p>Previsão: {order.shipment?.expectedDeliveryAt ?? "Não informada"}</p><p>Motorista: {order.shipment?.driverName ?? "—"}</p></article></div>;
      case "Financeiro":
        return <div className="detail-grid"><article><h3>Parcelas</h3><p>{orderInstallments.length} registrada(s)</p></article><article><h3>Pagamentos</h3><p>{orderPayments.length} registrado(s)</p></article></div>;
      case "Ocorrências":
        return orderIncidents.length ? <ul>{orderIncidents.map((incident) => <li key={incident.id}><strong>{incident.title}</strong> · {incident.status}</li>)}</ul> : <p>Nenhuma ocorrência registrada.</p>;
      case "Histórico":
        return <OrderTimeline events={[...initialEvents, ...sessionEvents]} />;
    }
  };

  return (
    <section aria-labelledby="order-title">
      <header className="page-header"><div><button className="back-link" type="button" onClick={() => navigate("/pedidos")}>← Pedidos</button><h1 id="order-title">Pedido {reference}</h1><p>{order.clientName} · {order.supplierName}</p></div><div className="order-actions"><button type="button" onClick={() => setPendingStatus("in-transit")}>Marcar em trânsito</button><button type="button" onClick={() => setPendingStatus("delivered")}>Marcar como entregue</button></div></header>

      <div className="order-tabs" role="tablist" aria-label="Detalhes do pedido">
        {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>
      <section className="order-tab-panel" role="tabpanel" aria-label={activeTab}>
        <p className="order-reference">Pedido {reference}</p>
        {renderTab()}
      </section>

      <ConfirmDialog title="Confirmar alteração de status" open={Boolean(pendingStatus)} onCancel={() => setPendingStatus(undefined)} onConfirm={confirmStatus}>
        <p>Deseja alterar o pedido {reference} para {pendingStatus ? statusLabels[pendingStatus] : "este status"}?</p>
      </ConfirmDialog>
    </section>
  );
}
