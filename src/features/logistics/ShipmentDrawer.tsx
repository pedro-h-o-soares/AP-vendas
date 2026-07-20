import { useState } from "react";
import { Drawer } from "../../components/Drawer";
import { FormField } from "../../components/FormField";
import { StatusBadge } from "../../components/StatusBadge";
import type { ISODate, IncidentPriority, IncidentType, Order, Shipment } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
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

const incidentTypeLabels: Record<IncidentType, string> = {
  "missing-item": "Item faltante",
  "wrong-product": "Produto incorreto",
  "other": "Outra divergência",
};

const incidentPriorityLabels: Record<IncidentPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export function ShipmentDrawer({ order, shipment, open, onClose }: ShipmentDrawerProps) {
  const { incidents, updateShipment, createIncident } = usePrototypeStore();
  const [editing, setEditing] = useState(false);
  const [editShippedAt, setEditShippedAt] = useState("");
  const [editInvoice, setEditInvoice] = useState("");
  const [editDriver, setEditDriver] = useState("");
  const [editRoute, setEditRoute] = useState("");
  const [editExpectedAt, setEditExpectedAt] = useState("");

  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("other");
  const [incidentPriority, setIncidentPriority] = useState<IncidentPriority>("medium");
  const [incidentDescription, setIncidentDescription] = useState("");

  if (!order || !shipment) return null;
  const title = `Embarque ${order.orderNumber ?? order.id}`;
  const orderIncidents = incidents.filter((inc) => inc.orderId === order.id);

  const startEdit = () => {
    setEditShippedAt(shipment.shippedAt ?? "");
    setEditInvoice(shipment.invoiceNumber ?? "");
    setEditDriver(shipment.driverName ?? "");
    setEditRoute(shipment.route ?? "");
    setEditExpectedAt(shipment.expectedDeliveryAt ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = () => {
    updateShipment(shipment.id, {
      shippedAt: editShippedAt as ISODate,
      invoiceNumber: editInvoice || undefined,
      driverName: editDriver || undefined,
      route: editRoute || undefined,
      expectedDeliveryAt: (editExpectedAt || undefined) as ISODate | undefined,
    });
    setEditing(false);
  };

  const submitIncident = () => {
    createIncident({
      orderId: order.id,
      shipmentId: shipment.id,
      clientName: order.clientName,
      supplierName: order.supplierName,
      title: incidentTypeLabels[incidentType],
      description: incidentDescription,
      type: incidentType,
      priority: incidentPriority,
    });
    setIncidentType("other");
    setIncidentPriority("medium");
    setIncidentDescription("");
    setShowIncidentForm(false);
  };

  return (
    <Drawer title={title} open={open} onClose={onClose}>
      <div className="logistics-detail">
        <div className="logistics-detail__heading">
          <div><strong>{order.clientName}</strong><span>{order.supplierName}</span></div>
          <StatusBadge tone={shipment.deliveredAt ? "success" : "info"}>{shipment.deliveredAt ? "Entregue" : "Em acompanhamento"}</StatusBadge>
        </div>
        {editing ? (
          <div className="order-form">
            <FormField label="Saída"><input type="date" value={editShippedAt} onChange={(e) => setEditShippedAt(e.target.value)} /></FormField>
            <FormField label="Nota fiscal"><input value={editInvoice} onChange={(e) => setEditInvoice(e.target.value)} /></FormField>
            <FormField label="Motorista"><input value={editDriver} onChange={(e) => setEditDriver(e.target.value)} /></FormField>
            <FormField label="Rota"><input value={editRoute} onChange={(e) => setEditRoute(e.target.value)} /></FormField>
            <FormField label="Previsão"><input type="date" value={editExpectedAt} onChange={(e) => setEditExpectedAt(e.target.value)} /></FormField>
            <div className="order-form__submit"><button className="button-primary" type="button" onClick={saveEdit}>Salvar</button><button type="button" onClick={cancelEdit}>Cancelar</button></div>
          </div>
        ) : (
          <>
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
            <div className="order-form__submit"><button type="button" className="button-secondary" onClick={startEdit}>Editar remessa</button></div>
          </>
        )}
        <DeliveryForm shipment={shipment} />

        <section><h4>Ocorrências</h4>
          {orderIncidents.length ? <ul>{orderIncidents.map((inc) => <li key={inc.id}><strong>{inc.title}</strong> · {inc.status}<br />{inc.description}</li>)}</ul> : <p>Nenhuma ocorrência registrada.</p>}
          {showIncidentForm ? (
            <div className="order-form">
              <FormField label="Tipo"><select value={incidentType} onChange={(e) => setIncidentType(e.target.value as IncidentType)}>{Object.entries(incidentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
              <FormField label="Prioridade"><select value={incidentPriority} onChange={(e) => setIncidentPriority(e.target.value as IncidentPriority)}>{Object.entries(incidentPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
              <FormField label="Descrição"><textarea value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} /></FormField>
              <div className="order-form__submit"><button className="button-primary" type="button" onClick={submitIncident}>Registrar</button><button type="button" onClick={() => setShowIncidentForm(false)}>Cancelar</button></div>
            </div>
          ) : <button type="button" className="button-secondary" onClick={() => setShowIncidentForm(true)}>Registrar ocorrência</button>}
        </section>
      </div>
    </Drawer>
  );
}
