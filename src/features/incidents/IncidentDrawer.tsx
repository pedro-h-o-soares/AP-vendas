import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { Drawer } from "../../components/Drawer";
import { StatusBadge } from "../../components/StatusBadge";
import type { Incident, IncidentStatus } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

const typeLabels = { "missing-item": "Item faltante", "wrong-product": "Produto incorreto", other: "Outra divergência" };
const priorityLabels = { low: "Baixa", medium: "Média", high: "Alta" };
const statusOptions: { value: IncidentStatus; label: string }[] = [
  { value: "open", label: "Aberta" },
  { value: "in-progress", label: "Em tratamento" },
  { value: "awaiting-supplier", label: "Aguardando fornecedor" },
  { value: "resolved", label: "Resolvida" },
];

interface IncidentDrawerProps {
  incident?: Incident;
  open: boolean;
  onClose: () => void;
}

export function IncidentDrawer({ incident, open, onClose }: IncidentDrawerProps) {
  const { user } = useAuth();
  const { updateIncidentStatus, contactIncidentSupplier } = usePrototypeStore();
  const allowed = Boolean(user && can(user.role, "edit-logistics"));

  if (!incident) return null;

  return (
    <Drawer title={incident.title} open={open} onClose={onClose}>
      <div className="incident-detail">
        <div className="incident-detail__heading">
          <StatusBadge tone={incident.priority === "high" ? "danger" : incident.priority === "medium" ? "warning" : "info"}>{priorityLabels[incident.priority]}</StatusBadge>
          <StatusBadge tone={incident.status === "resolved" ? "success" : "warning"}>{statusOptions.find((s) => s.value === incident.status)?.label ?? incident.status}</StatusBadge>
        </div>
        <dl className="incident-detail__facts">
          <div><dt>Tipo</dt><dd>{typeLabels[incident.type]}</dd></div>
          <div><dt>Cliente</dt><dd>{incident.clientName}</dd></div>
          <div><dt>Fornecedor</dt><dd>{incident.supplierName}</dd></div>
          <div><dt>Descrição</dt><dd>{incident.description}</dd></div>
          <div><dt>Responsável</dt><dd>{incident.owner ?? "Não atribuído"}</dd></div>
          <div><dt>Abertura</dt><dd>{incident.openedAt}</dd></div>
          {incident.resolvedAt && <div><dt>Resolução</dt><dd>{incident.resolvedAt}</dd></div>}
        </dl>
        {allowed && (
          <div className="incident-detail__actions">
            <label>
              <span>Status</span>
              <select value={incident.status} onChange={(event) => updateIncidentStatus(incident.id, event.target.value as IncidentStatus)}>
                {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </label>
            {incident.status !== "awaiting-supplier" && (
              <button className="button-primary" type="button" onClick={() => contactIncidentSupplier(incident.id)}>Acionar fornecedor</button>
            )}
          </div>
        )}
        {incident.timeline.length > 0 && (
          <section aria-labelledby="incident-timeline-title">
            <h3 id="incident-timeline-title">Histórico</h3>
            <ol className="incident-timeline">
              {incident.timeline.map((event) => <li key={event.id}><strong>{event.description}</strong><span>{event.date}</span></li>)}
            </ol>
          </section>
        )}
      </div>
    </Drawer>
  );
}
