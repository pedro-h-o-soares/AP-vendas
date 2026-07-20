import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { FormField } from "../../components/FormField";
import type { IncidentPriority, IncidentType } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

interface IncidentFormProps {
  orderId: string;
}

const titles: Record<IncidentType, string> = {
  "missing-item": "Item faltante",
  "wrong-product": "Produto incorreto",
  other: "Outra divergência",
};

export function IncidentForm({ orderId }: IncidentFormProps) {
  const { user } = useAuth();
  const { contactIncidentSupplier, createIncident, incidents, orders } = usePrototypeStore();
  const [type, setType] = useState<IncidentType>("missing-item");
  const [priority, setPriority] = useState<IncidentPriority>("medium");
  const [description, setDescription] = useState("");
  const [incidentId, setIncidentId] = useState<string>();
  const [error, setError] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const order = orders.find(({ id }) => id === orderId);
  const incident = incidents.find(({ id }) => id === incidentId);
  const allowed = Boolean(user && can(user.role, "edit-logistics"));

  if (!allowed) return <p className="permission-note">Perfil sem permissão para registrar ocorrências.</p>;
  if (!order) return <p>Pedido não encontrado.</p>;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (type === "other" && !description.trim()) {
      setError("Descreva a outra divergência.");
      descriptionRef.current?.focus();
      return;
    }
    const created = createIncident({
      orderId,
      shipmentId: order.shipments?.[0]?.id,
      clientName: order.clientName,
      supplierName: order.supplierName,
      title: titles[type],
      description: description.trim() || titles[type],
      type,
      priority,
      owner: user?.name,
    });
    setIncidentId(created.id);
    setError("");
  };

  if (incident) {
    return (
      <section className="incident-result" aria-label="Ocorrência registrada">
        <p className="session-notice" role="status">Ocorrência registrada somente nesta sessão.</p>
        <h3>{incident.title}</h3>
        {incident.status !== "awaiting-supplier" && <button className="button-primary" type="button" onClick={() => contactIncidentSupplier(incident.id)}>Acionar fornecedor</button>}
        <ol className="incident-timeline">
          {incident.timeline.map((event) => <li key={event.id}><strong>{event.description}</strong><span>{event.date}</span></li>)}
        </ol>
      </section>
    );
  }

  return (
    <form className="incident-form" onSubmit={submit} noValidate>
      <FormField label="Tipo de ocorrência"><select value={type} onChange={(event) => { setType(event.target.value as IncidentType); setError(""); }}><option value="missing-item">Item faltante</option><option value="wrong-product">Produto incorreto</option><option value="other">Outra divergência</option></select></FormField>
      <FormField label="Prioridade"><select value={priority} onChange={(event) => setPriority(event.target.value as IncidentPriority)}><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option></select></FormField>
      <FormField label="Descrição" error={error}><textarea ref={descriptionRef} value={description} onChange={(event) => setDescription(event.target.value)} required={type === "other"} rows={4} /></FormField>
      <button className="button-primary" type="submit">Registrar ocorrência</button>
    </form>
  );
}
