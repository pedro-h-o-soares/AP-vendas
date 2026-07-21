import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BadgeAlert, TriangleAlert } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { FormField } from "../../components/FormField";
import { StatusBadge } from "../../components/StatusBadge";
import { useModalFocus } from "../../components/useModalFocus";
import type { Incident, IncidentPriority, IncidentStatus, IncidentType, Order, Shipment } from "../../domain/types";
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
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
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
    setShowIncidentDetails(Boolean(incident));
    setShowIncidentForm(false);
  };

  return (
    <section className={`shipment-delivery-actions${compact ? " shipment-delivery-actions--compact" : ""}`} aria-label="Ações de entrega">
      <DeliveryForm shipment={shipment} showHeading={!compact} compact={compact} />
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
          className={`action-icon action-icon--warning${linkedIncident ? " action-icon--linked" : ""}`}
          onClick={() => linkedIncident ? setShowIncidentDetails(true) : setShowIncidentForm(true)}
          aria-label={linkedIncident ? `Ver ocorrência vinculada: ${linkedIncident.title}` : "Registrar ocorrência"}
          title={linkedIncident ? `Ocorrência vinculada: ${linkedIncident.title}` : "Registrar ocorrência"}
        >
          {linkedIncident ? <BadgeAlert aria-hidden="true" size={18} /> : <TriangleAlert aria-hidden="true" size={18} />}
        </button>
      )}
      {linkedIncident && (
        <ShipmentIncidentDetailsPopup
          incident={linkedIncident}
          open={showIncidentDetails}
          onClose={() => {
            setShowIncidentDetails(false);
            setConfirmingCancel(false);
          }}
          confirmingCancel={confirmingCancel}
          onCancelRequest={() => setConfirmingCancel(true)}
          onCancelDismiss={() => setConfirmingCancel(false)}
          onCancelConfirm={() => {
            updateIncidentStatus(linkedIncident.id, "cancelled");
            setConfirmingCancel(false);
          }}
        />
      )}
    </section>
  );
}

interface ShipmentIncidentDetailsPopupProps {
  incident: Incident;
  open: boolean;
  onClose: () => void;
  confirmingCancel: boolean;
  onCancelRequest: () => void;
  onCancelDismiss: () => void;
  onCancelConfirm: () => void;
}

function ShipmentIncidentDetailsPopup({
  incident,
  open,
  onClose,
  confirmingCancel,
  onCancelRequest,
  onCancelDismiss,
  onCancelConfirm,
}: ShipmentIncidentDetailsPopupProps) {
  const titleId = useId();
  const popupRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useModalFocus(open, onClose, popupRef, closeRef);

  if (!open) return null;

  return createPortal(
    <div className="dialog-backdrop dialog-backdrop--center" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={popupRef} className="incident-popup" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="dialog-header">
          <div>
            <span className="page-eyebrow">Ocorrência do embarque</span>
            <h2 id={titleId}>{incident.title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Fechar ${incident.title}`}>×</button>
        </header>
        <div className="shipment-incident-detail" aria-label="Detalhes da ocorrência">
          <div className="shipment-incident-detail__heading">
            <strong>{incident.title}</strong>
            <StatusBadge tone={incident.status === "cancelled" ? "neutral" : incident.status === "resolved" ? "success" : "warning"}>
              {incidentStatusLabels[incident.status]}
            </StatusBadge>
          </div>
          <dl>
            <div><dt>Tipo</dt><dd>{incidentTypeLabels[incident.type]}</dd></div>
            <div><dt>Prioridade</dt><dd>{incidentPriorityLabels[incident.priority]}</dd></div>
            <div><dt>Descrição</dt><dd>{incident.description}</dd></div>
          </dl>
          <div className="incident-popup__actions">
            {incident.status !== "cancelled" && (
              <button className="button-secondary" type="button" onClick={onCancelRequest}>Cancelar ocorrência</button>
            )}
            <button className="button-primary" type="button" onClick={onClose}>Fechar detalhes</button>
          </div>
        </div>
        <ConfirmDialog
          title="Cancelar ocorrência"
          open={confirmingCancel}
          onCancel={onCancelDismiss}
          onConfirm={onCancelConfirm}
          confirmLabel="Cancelar ocorrência"
        >
          <p>A ocorrência continuará vinculada ao embarque, mas ficará marcada como cancelada.</p>
        </ConfirmDialog>
      </section>
    </div>,
    document.body,
  );
}
