import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FormField } from "../../components/FormField";
import { StatusBadge } from "../../components/StatusBadge";
import type { FinancialStatus, ISODate, Installment, OrderItem, OrderStatus, OrderTimelineEvent, Shipment } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { toLocalISODate } from "../../domain/localDate";
import { OrderTimeline } from "./OrderTimeline";
import { orderStatusLabels, orderStatusTone } from "./orderStatus";
import { ShipmentDeliveryActions } from "../logistics/ShipmentDeliveryActions";

const tabs = ["Resumo", "Itens e valores", "Carga e entrega", "Financeiro", "Histórico"] as const;
type Tab = typeof tabs[number];

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = Boolean(user && can(user.role, "edit-order"));
  const canManageDelivery = Boolean(user && can(user.role, "edit-logistics"));
  const { orders, incidents, installments, payments, orderTimelineEvents, updateOrderStatus, appendOrderTimelineEvent, createShipment, updateShipment, updateOrder, updateOrderItems } = usePrototypeStore();
  const order = orders.find((candidate) => candidate.id === orderId);
  const [activeTab, setActiveTab] = useState<Tab>("Resumo");
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>();
  const [editing, setEditing] = useState(false);
  const [editShipmentId, setEditShipmentId] = useState<string>();
  const [shipShippedAt, setShipShippedAt] = useState("");
  const [shipInvoice, setShipInvoice] = useState("");
  const [shipDriver, setShipDriver] = useState("");
  const [shipRoute, setShipRoute] = useState("");
  const [shipExpectedAt, setShipExpectedAt] = useState("");

  const [editingResumo, setEditingResumo] = useState(false);
  const [resumoClientName, setResumoClientName] = useState("");
  const [resumoSupplierName, setResumoSupplierName] = useState("");
  const [resumoPaymentTerms, setResumoPaymentTerms] = useState("");

  const [editingItens, setEditingItens] = useState(false);
  const [editItems, setEditItems] = useState<OrderItem[]>([]);

  const initialEvents = useMemo<OrderTimelineEvent[]>(() => {
    if (!order) return [];
    const events: OrderTimelineEvent[] = [];
    if (order.orderedAt) events.push({ id: "ordered", orderId: order.id, date: order.orderedAt, title: "Pedido registrado" });
    if (order.shipments?.[0]?.shippedAt) events.push({ id: "shipment", orderId: order.id, date: order.shipments[0].shippedAt, title: "Embarque informado", detail: order.shipments[0].invoiceNumber ? `Nota ${order.shipments[0].invoiceNumber}` : undefined });
    return events;
  }, [order]);

  if (!order) {
    return <section><h1>Pedido não encontrado</h1><p>Confira o endereço ou retorne à lista de pedidos.</p><button type="button" onClick={() => navigate("/pedidos")}>Voltar para pedidos</button></section>;
  }

  const reference = order.orderNumber ?? order.oguraNumber ?? order.id;
  const orderIncidents = incidents.filter((incident) => incident.orderId === order.id);
  const orderInstallments = installments.filter((installment) => installment.orderId === order.id);
  const orderPayments = payments.filter((payment) => payment.orderId === order.id);
  const persistedEvents = orderTimelineEvents.filter((event) => event.orderId === order.id);
  const itemColumns: DataTableColumn<OrderItem>[] = [
    { key: "description", header: "Item", render: (item) => item.description },
    { key: "quantity", header: "Quantidade", render: (item) => `${item.quantity} ${item.unit}` },
    { key: "unitPrice", header: "Preço unitário", render: (item) => item.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), align: "end" },
    { key: "total", header: "Total", render: (item) => item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), align: "end" },
  ];
  const shipmentColumns: DataTableColumn<Shipment>[] = [
    { key: "shippedAt", header: "Data de saída", render: (s) => s.shippedAt ?? "—" },
    { key: "invoice", header: "NF", render: (s) => s.invoiceNumber ?? "—" },
    { key: "driver", header: "Motorista", render: (s) => s.driverName ?? "—" },
    { key: "route", header: "Rota", render: (s) => s.route ?? "—" },
    { key: "forecast", header: "Previsão", render: (s) => s.expectedDeliveryAt ?? "—" },
    { key: "delivery", header: "Entrega", render: (s) => s.deliveredAt ?? "Pendente" },
  ];
  const installmentStatusLabels: Record<FinancialStatus, string> = {
    receivable: "A receber", payable: "A pagar", "due-soon": "Próximo do vencimento", overdue: "Atrasado",
    "partially-paid": "Pago parcialmente", paid: "Pago", "under-review": "Em conferência", difference: "Com diferença",
    overpaid: "Com diferença", settled: "Pago",
  };
  const installmentStatusTone = (status: FinancialStatus) => {
    if (status === "overdue") return "danger" as const;
    if (status === "paid" || status === "overpaid" || status === "settled") return "success" as const;
    if (status === "due-soon" || status === "partially-paid" || status === "difference" || status === "under-review") return "warning" as const;
    return "info" as const;
  };
  const installmentColumns: DataTableColumn<Installment>[] = [
    { key: "sequence", header: "Parcela", render: (inst) => `${inst.sequence}/${inst.totalInstallments}` },
    { key: "dueAt", header: "Vencimento", render: (inst) => inst.dueAt },
    { key: "expectedAmount", header: "Valor", render: (inst) => inst.expectedAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), align: "end" },
    { key: "status", header: "Status", render: (inst) => <StatusBadge tone={installmentStatusTone(inst.status)}>{installmentStatusLabels[inst.status]}</StatusBadge> },
  ];

  const confirmStatus = () => {
    if (!pendingStatus) return;
    updateOrderStatus(order.id, pendingStatus);
    const label = orderStatusLabels[pendingStatus];
    appendOrderTimelineEvent({ orderId: order.id, date: toLocalISODate(), title: `Status alterado para ${label.toLocaleLowerCase("pt-BR")}` });
    setPendingStatus(undefined);
  };

  const startEditShipment = () => {
    setEditShipmentId(undefined);
    setEditing(true);
    setShipShippedAt(toLocalISODate());
    setShipInvoice("");
    setShipDriver("");
    setShipRoute("");
    setShipExpectedAt("");
  };

  const startEditExistingShipment = (shipment: Shipment) => {
    setEditShipmentId(shipment.id);
    setEditing(true);
    setShipShippedAt(shipment.shippedAt ?? "");
    setShipInvoice(shipment.invoiceNumber ?? "");
    setShipDriver(shipment.driverName ?? "");
    setShipRoute(shipment.route ?? "");
    setShipExpectedAt(shipment.expectedDeliveryAt ?? "");
  };

  const saveShipment = () => {
    if (editShipmentId) {
      updateShipment(editShipmentId, {
        shippedAt: shipShippedAt as ISODate,
        invoiceNumber: shipInvoice || undefined,
        driverName: shipDriver || undefined,
        route: shipRoute || undefined,
        expectedDeliveryAt: (shipExpectedAt || undefined) as ISODate | undefined,
      });
    } else {
      createShipment(order.id, {
        shippedAt: shipShippedAt as ISODate,
        invoiceNumber: shipInvoice || undefined,
        driverName: shipDriver || undefined,
        route: shipRoute || undefined,
        expectedDeliveryAt: (shipExpectedAt || undefined) as ISODate | undefined,
      });
    }
    setEditing(false);
    setEditShipmentId(undefined);
  };

  const startEditResumo = () => {
    setResumoClientName(order.clientName);
    setResumoSupplierName(order.supplierName);
    setResumoPaymentTerms(order.paymentTerms);
    setEditingResumo(true);
  };

  const cancelEditResumo = () => {
    setEditingResumo(false);
  };

  const saveEditResumo = () => {
    updateOrder(order.id, {
      clientName: resumoClientName,
      supplierName: resumoSupplierName,
      paymentTerms: resumoPaymentTerms,
    });
    setEditingResumo(false);
  };

  const startEditItens = () => {
    setEditItems(order.items.map((item) => ({ ...item })));
    setEditingItens(true);
  };

  const cancelEditItens = () => {
    setEditingItens(false);
    setEditItems([]);
  };

  const saveEditItens = () => {
    updateOrderItems(order.id, editItems);
    setEditingItens(false);
    setEditItems([]);
  };

  const updateEditItem = (itemId: string, field: string, value: string | number) => {
    setEditItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          const qty = field === "quantity" ? Number(value) : item.quantity;
          const price = field === "unitPrice" ? Number(value) : item.unitPrice;
          updated.total = qty * price;
        }
        return updated;
      }),
    );
  };

  const addEditItem = () => {
    const newId = `new-${Date.now()}`;
    setEditItems((prev) => [...prev, { id: newId, description: "", unit: "un", quantity: 0, unitPrice: 0, total: 0 }]);
  };

  const removeEditItem = (itemId: string) => {
    setEditItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const receivableInstallments = orderInstallments.filter((i) => i.recipient === "client" || i.recipient === "representative");
  const payableInstallments = orderInstallments.filter((i) => i.recipient === "supplier");

  const renderTab = () => {
    switch (activeTab) {
      case "Resumo":
        if (editingResumo) {
          return <div className="detail-grid"><article><h3>Partes</h3><FormField label="Cliente"><input value={resumoClientName} onChange={(e) => setResumoClientName(e.target.value)} /></FormField><FormField label="Fornecedor"><input value={resumoSupplierName} onChange={(e) => setResumoSupplierName(e.target.value)} /></FormField></article><article><h3>Condições</h3><FormField label="Condições de pagamento"><input value={resumoPaymentTerms} onChange={(e) => setResumoPaymentTerms(e.target.value)} /></FormField><p><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabels[order.status]}</StatusBadge></p></article><div className="order-form__submit"><button className="button-primary" type="button" onClick={saveEditResumo}>Salvar</button><button className="button-secondary" type="button" onClick={cancelEditResumo}>Cancelar</button></div></div>;
        }
        return <div className="detail-grid"><article><h3>Partes</h3><p><strong>Cliente:</strong> {order.clientName}</p><p><strong>Fornecedor:</strong> {order.supplierName}</p></article><article><h3>Condições</h3><p>{order.paymentTerms}</p><p><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabels[order.status]}</StatusBadge></p></article>{canEdit && <div className="order-form__submit"><button type="button" className="button-secondary" onClick={startEditResumo}>Editar resumo</button></div>}</div>;
      case "Itens e valores":
        if (editingItens) {
          return <><table className="order-edit-items"><thead><tr><th>Item</th><th>Quantidade</th><th>Un.</th><th>Preço unitário</th><th>Total</th><th></th></tr></thead><tbody>{editItems.map((item) => <tr key={item.id}><td><input value={item.description} onChange={(e) => updateEditItem(item.id, "description", e.target.value)} /></td><td><input type="number" value={item.quantity} onChange={(e) => updateEditItem(item.id, "quantity", Number(e.target.value))} /></td><td><input value={item.unit} onChange={(e) => updateEditItem(item.id, "unit", e.target.value)} /></td><td><input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateEditItem(item.id, "unitPrice", Number(e.target.value))} /></td><td>{item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td><td><button className="button-secondary" type="button" onClick={() => removeEditItem(item.id)}>Remover</button></td></tr>)}</tbody></table><button type="button" className="button-secondary" onClick={addEditItem}>Adicionar item</button><div className="order-form__submit"><button className="button-primary" type="button" onClick={saveEditItens}>Salvar</button><button className="button-secondary" type="button" onClick={cancelEditItens}>Cancelar</button></div></>;
        }
        return <><DataTable columns={itemColumns} rows={order.items} getRowId={(item) => item.id} emptyMessage="Nenhum item registrado" /><p className="detail-total"><strong>Valor líquido:</strong> {order.values?.net.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "—"}</p>{canEdit && <div className="order-form__submit"><button type="button" className="button-secondary" onClick={startEditItens}>Editar itens</button></div>}</>;
      case "Carga e entrega":
        return <div className="detail-grid detail-grid--full"><article><h3>Embarques ({order.shipments?.length ?? 0})</h3>
          <DataTable
            columns={shipmentColumns}
            rows={order.shipments ?? []}
            getRowId={(s) => s.id}
            emptyMessage="Nenhum embarque informado."
            rowActions={canEdit || canManageDelivery ? (shipment) => (
              <>
                {canEdit && (
                  <button className="action-icon" type="button" onClick={() => startEditExistingShipment(shipment)} aria-label="Editar embarque" title="Editar embarque">
                    <Pencil aria-hidden="true" size={18} />
                  </button>
                )}
                {canManageDelivery && <ShipmentDeliveryActions order={order} shipment={shipment} compact />}
              </>
            ) : undefined}
          />
          {editing ? <div className="order-form">
            <FormField label="Data de saída"><input type="date" value={shipShippedAt} onChange={(e) => setShipShippedAt(e.target.value)} /></FormField>
            <FormField label="Nota fiscal"><input value={shipInvoice} onChange={(e) => setShipInvoice(e.target.value)} /></FormField>
            <FormField label="Motorista"><input value={shipDriver} onChange={(e) => setShipDriver(e.target.value)} /></FormField>
            <FormField label="Rota"><input value={shipRoute} onChange={(e) => setShipRoute(e.target.value)} /></FormField>
            <FormField label="Previsão de entrega"><input type="date" value={shipExpectedAt} onChange={(e) => setShipExpectedAt(e.target.value)} /></FormField>
            <div className="order-form__submit"><button className="button-primary" type="button" onClick={saveShipment}>{editShipmentId ? "Salvar" : "Adicionar"}</button><button className="button-secondary" type="button" onClick={() => { setEditing(false); setEditShipmentId(undefined); }}>Cancelar</button></div>
          </div> : canEdit && <div className="order-form__submit"><button type="button" className="button-secondary" onClick={startEditShipment}>Adicionar embarque</button></div>}
          {orderIncidents.length > 0 && <><h4>Ocorrências na entrega</h4><ul>{orderIncidents.map((incident) => <li key={incident.id}><strong>{incident.title}</strong> · {incident.status}<br />{incident.description}</li>)}</ul></>}
        </article></div>;
      case "Financeiro":
        return <div className="detail-grid detail-grid--full"><article><h3>A receber</h3><DataTable columns={installmentColumns} rows={receivableInstallments} getRowId={(inst) => inst.id} emptyMessage="Nenhum registro." /></article><article><h3>A pagar</h3><DataTable columns={installmentColumns} rows={payableInstallments} getRowId={(inst) => inst.id} emptyMessage="Nenhum registro." /></article></div>;
      case "Histórico":
        return <OrderTimeline events={[...initialEvents, ...persistedEvents]} />;
    }
  };

  return (
    <section aria-labelledby="order-title">
      <header className="page-header"><div><button className="back-link" type="button" onClick={() => navigate("/pedidos")}>← Pedidos</button><h1 id="order-title">Pedido {reference}</h1><p>{order.clientName} · {order.supplierName}</p></div>{canEdit && <div className="order-actions"><button type="button" onClick={() => setPendingStatus("in-transit")}>Marcar em trânsito</button><button type="button" onClick={() => setPendingStatus("delivered")}>Marcar como entregue</button></div>}</header>

      <div className="order-tabs" role="tablist" aria-label="Detalhes do pedido">
        {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>
      <section className="order-tab-panel" role="tabpanel" aria-label={activeTab}>
        <p className="order-reference">Pedido {reference}</p>
        {renderTab()}
      </section>

      <ConfirmDialog title="Confirmar alteração de status" open={Boolean(pendingStatus)} onCancel={() => setPendingStatus(undefined)} onConfirm={confirmStatus}>
        <p>Deseja alterar o pedido {reference} para {pendingStatus ? orderStatusLabels[pendingStatus] : "este status"}?</p>
      </ConfirmDialog>
    </section>
  );
}
