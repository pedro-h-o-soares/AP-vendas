import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import { StatusBadge } from "../../components/StatusBadge";
import type { Incident } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { IncidentForm } from "./IncidentForm";

const typeLabels = { "missing-item": "Item faltante", "wrong-product": "Produto incorreto", other: "Outra divergência" };
const priorityLabels = { low: "Baixa", medium: "Média", high: "Alta" };
const statusLabels = { open: "Aberta", "in-progress": "Em tratamento", "awaiting-supplier": "Aguardando fornecedor", resolved: "Resolvida" };

export function IncidentsPage() {
  const { incidents, orders } = usePrototypeStore();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [orderId, setOrderId] = useState(orders[0]?.id ?? "");
  const allowed = Boolean(user && can(user.role, "edit-logistics"));
  const columns: DataTableColumn<Incident>[] = [
    { key: "priority", header: "Prioridade", render: (incident) => priorityLabels[incident.priority] },
    { key: "type", header: "Tipo", render: (incident) => typeLabels[incident.type] },
    { key: "order", header: "Pedido", render: (incident) => orders.find(({ id }) => id === incident.orderId)?.orderNumber ?? incident.orderId },
    { key: "client", header: "Cliente", render: (incident) => incident.clientName },
    { key: "supplier", header: "Fornecedor", render: (incident) => incident.supplierName },
    { key: "owner", header: "Responsável", render: (incident) => incident.owner ?? "Não atribuído" },
    { key: "status", header: "Status", render: (incident) => <StatusBadge tone={incident.status === "resolved" ? "success" : incident.priority === "high" ? "danger" : "warning"}>{statusLabels[incident.status]}</StatusBadge> },
  ];

  return (
    <section aria-labelledby="incidents-title">
      <header className="page-header"><div><span className="page-eyebrow">Operação</span><h1 id="incidents-title">Ocorrências</h1><p>Divergências ligadas a pedidos, embarques, clientes e fornecedores.</p></div>{allowed && <button className="button-primary" type="button" onClick={() => setCreating((value) => !value)}>{creating ? "Fechar formulário" : "Nova ocorrência"}</button>}</header>
      <PrototypeNotice />
      {creating && <section className="incident-panel" aria-label="Nova ocorrência"><label>Pedido<select aria-label="Pedido da ocorrência" value={orderId} onChange={(event) => setOrderId(event.target.value)}>{orders.map((order) => <option key={order.id} value={order.id}>{order.orderNumber ?? order.clientName} — {order.clientName}</option>)}</select></label><IncidentForm orderId={orderId} /></section>}
      <section className="orders-table-panel" aria-label="Lista de ocorrências"><DataTable ariaLabel="Ocorrências" columns={columns} rows={incidents} getRowId={(incident) => incident.id} emptyMessage="Nenhuma ocorrência registrada" /></section>
    </section>
  );
}
