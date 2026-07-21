import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { FormField } from "../../components/FormField";
import type { IncidentPriority, IncidentType, Order, Shipment } from "../../domain/types";
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

export function ShipmentDeliveryActions({ order, shipment, compact = false }: ShipmentDeliveryActionsProps) {
  const { user } = useAuth();
  const { createIncident } = usePrototypeStore();
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("other");
  const [incidentPriority, setIncidentPriority] = useState<IncidentPriority>("medium");
  const [incidentDescription, setIncidentDescription] = useState("");
  const allowed = Boolean(user && can(user.role, "edit-logistics"));

  if (!allowed) return null;

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
    <section className={`shipment-delivery-actions${compact ? " shipment-delivery-actions--compact" : ""}`} aria-label="Ações de entrega">
      <DeliveryForm shipment={shipment} showHeading={!compact} />
      {showIncidentForm ? (
        <div className="order-form">
          <FormField label="Tipo"><select value={incidentType} onChange={(event) => setIncidentType(event.target.value as IncidentType)}>{Object.entries(incidentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          <FormField label="Prioridade"><select value={incidentPriority} onChange={(event) => setIncidentPriority(event.target.value as IncidentPriority)}>{Object.entries(incidentPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          <FormField label="Descrição"><textarea value={incidentDescription} onChange={(event) => setIncidentDescription(event.target.value)} /></FormField>
          <div className="order-form__submit"><button className="button-primary" type="button" onClick={submitIncident}>Registrar</button><button className="button-secondary" type="button" onClick={() => setShowIncidentForm(false)}>Cancelar</button></div>
        </div>
      ) : (
        <button
          type="button"
          className="action-icon action-icon--warning"
          onClick={() => setShowIncidentForm(true)}
          aria-label="Registrar ocorrência"
          title="Registrar ocorrência"
        >
          <TriangleAlert aria-hidden="true" size={18} />
        </button>
      )}
    </section>
  );
}
