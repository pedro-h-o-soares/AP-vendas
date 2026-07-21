import { useState } from "react";
import { BadgeAlert, TriangleAlert } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField } from "../../components/FormField";
import { StatusBadge } from "../../components/StatusBadge";
import type { IncidentPriority, IncidentStatus, IncidentType, Order, Shipment } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { DeliveryForm } from "./DeliveryForm";

interface ShipmentDeliveryActionsProps {
  order: Order;
  shipment: Shipment;
  compact?: boolean;
}

const incidentTypeLabels: Record<IncidentType, string> = {
  "missing-item": "Item faltante",
  "wrong-product": "Produto incorreto",
  other: "Outra divergência",
};

const incidentPriorityLabels: Record<IncidentPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const incidentStatusLabels: Record<IncidentStatus, string> = {
  open: "Aberta",
  "in-progress": "Em tratamento",
  "awaiting-supplier": "Aguardando fornecedor",
  resolved: "Resolvida",
  cancelled: "Cancelada",
};

export function ShipmentDeliveryActions({ order, shipment, compact = false }: ShipmentDeliveryActionsProps) {
  const { user } = useAuth();
  const { createIncident, incidents, updateIncidentStatus } = usePrototypeStore();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("other");
  const [incidentPriority, setIncidentPriority] = useState<IncidentPriority>("medium");
  const [incidentDescription, setIncidentDescription] = useState("");
  const allowed = Boolean(user && can(user.role, "edit-logistics"));
  const linkedIncident = incidents.find((incident) => incident.shipmentId === shipment.id);

  if (!allowed) return null;

  const submitIncident = () => {
    if (linkedIncident) return;
    const incident = createIncident({
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
    setShowIncidentForm(Boolean(incident));
  };

  return (
    <section className={`shipment-delivery-actions${compact ? " shipment-delivery-actions--compact" : ""}`} aria-label="Ações de entrega">
      <DeliveryForm shipment={shipment} showHeading={!compact} compact={compact} />
      {showIncidentForm && linkedIncident ? (
        <div className="shipment-incident-detail" aria-label="Detalhes da ocorrência">
          <div className="shipment-incident-detail__heading">
            <strong>{linkedIncident.title}</strong>
            <StatusBadge tone={linkedIncident.status === "cancelled" ? "neutral" : linkedIncident.status === "resolved" ? "success" : "warning"}>
              {incidentStatusLabels[linkedIncident.status]}
            </StatusBadge>
          </div>
          <dl>
            <div><dt>Tipo</dt><dd>{incidentTypeLabels[linkedIncident.type]}</dd></div>
            <div><dt>Prioridade</dt><dd>{incidentPriorityLabels[linkedIncident.priority]}</dd></div>
            <div><dt>Descrição</dt><dd>{linkedIncident.description}</dd></div>
          </dl>
          {linkedIncident.status !== "cancelled" && (
            <button className="button-secondary" type="button" onClick={() => setConfirmingCancel(true)}>Cancelar ocorrência</button>
          )}
          <button className="button-secondary" type="button" onClick={() => setShowIncidentForm(false)}>Fechar detalhes</button>
          <ConfirmDialog
            title="Cancelar ocorrência"
            open={confirmingCancel}
            onCancel={() => setConfirmingCancel(false)}
            onConfirm={() => {
              updateIncidentStatus(linkedIncident.id, "cancelled");
              setConfirmingCancel(false);
            }}
            confirmLabel="Cancelar ocorrência"
          >
            <p>A ocorrência continuará vinculada ao embarque, mas ficará marcada como cancelada.</p>
          </ConfirmDialog>
        </div>
      ) : showIncidentForm ? (
        <div className="order-form">
          <FormField label="Tipo"><select value={incidentType} onChange={(event) => setIncidentType(event.target.value as IncidentType)}>{Object.entries(incidentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          <FormField label="Prioridade"><select value={incidentPriority} onChange={(event) => setIncidentPriority(event.target.value as IncidentPriority)}>{Object.entries(incidentPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          <FormField label="Descrição"><textarea value={incidentDescription} onChange={(event) => setIncidentDescription(event.target.value)} /></FormField>
          <div className="order-form__submit"><button className="button-primary" type="button" onClick={submitIncident}>Registrar</button><button className="button-secondary" type="button" onClick={() => setShowIncidentForm(false)}>Cancelar</button></div>
        </div>
      ) : (
        <button
          type="button"
          className={`action-icon action-icon--warning${linkedIncident ? " action-icon--linked" : ""}`}
          onClick={() => setShowIncidentForm(true)}
          aria-label={linkedIncident ? `Ver ocorrência vinculada: ${linkedIncident.title}` : "Registrar ocorrência"}
          title={linkedIncident ? `Ocorrência vinculada: ${linkedIncident.title}` : "Registrar ocorrência"}
        >
          {linkedIncident ? <BadgeAlert aria-hidden="true" size={18} /> : <TriangleAlert aria-hidden="true" size={18} />}
        </button>
      )}
    </section>
  );
}
