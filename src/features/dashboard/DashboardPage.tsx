import { AlertTriangle, Clock3, PackageCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { KpiCard } from "../../components/KpiCard";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import { StatusBadge, type StatusTone } from "../../components/StatusBadge";
import type { Order, OrderStatus } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { OrderStatusChart } from "./OrderStatusChart";

const statusLabels: Record<OrderStatus, string> = {
  draft: "Rascunho",
  quote: "Orçamento",
  "awaiting-stock": "Aguardando estoque",
  "quote-sent": "Orçamento enviado",
  "awaiting-supplier": "Aguardando fornecedor",
  "awaiting-client": "Aguardando cliente",
  confirmed: "Confirmado",
  preparing: "Em preparação",
  "shipment-informed": "Embarque informado",
  "in-transit": "Em trânsito",
  delivered: "Entregue",
  incident: "Com ocorrência",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusTone = (status: OrderStatus): StatusTone => {
  if (status === "incident" || status === "cancelled") return "danger";
  if (status === "delivered" || status === "completed") return "success";
  if (status.startsWith("awaiting")) return "warning";
  return "info";
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardPage() {
  const { user } = useAuth();
  const { orders, incidents, installments, payments, users } = usePrototypeStore();
  const [responsible, setResponsible] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [region, setRegion] = useState("all");
  const [period, setPeriod] = useState("all");

  const suppliers = [...new Set(orders.map((order) => order.supplierName))].sort();
  const regions = [...new Set(orders.map((order) => order.region).filter(Boolean))] as string[];
  const orderDate = (order: Order) => order.orderedAt ?? order.shipments?.[0]?.shippedAt;
  const datedOrders = orders.filter((order) => orderDate(order));
  const maximumDemoDate = Math.max(
    ...datedOrders.map((order) => new Date(`${orderDate(order)}T00:00:00`).getTime()),
  );
  const filteredOrders = orders.filter((order) => {
    const date = orderDate(order);
    const withinPeriod = period === "all" || (
      date !== undefined &&
      new Date(`${date}T00:00:00`).getTime() >= maximumDemoDate - (Number(period) - 1) * 86_400_000
    );
    return withinPeriod &&
      (responsible === "all" || order.ownerId === responsible) &&
      (supplier === "all" || order.supplierName === supplier) &&
      (region === "all" || order.region === region);
  });
  const filteredOrderIds = new Set(filteredOrders.map((order) => order.id));

  const statusValues = useMemo(() => {
    const counts = new Map<OrderStatus, number>();
    filteredOrders.forEach((order) => counts.set(order.status, (counts.get(order.status) ?? 0) + 1));
    return [...counts].map(([status, count]) => ({ status, count, label: statusLabels[status] }));
  }, [filteredOrders]);

  const recentColumns: DataTableColumn<Order>[] = [
    { key: "order", header: "Pedido", render: (order) => order.orderNumber ?? order.oguraNumber ?? "Em cotação" },
    { key: "client", header: "Cliente", render: (order) => order.clientName },
    { key: "supplier", header: "Fornecedor", render: (order) => order.supplierName },
    { key: "status", header: "Status", render: (order) => <StatusBadge tone={statusTone(order.status)}>{statusLabels[order.status]}</StatusBadge> },
  ];

  const openIncidents = incidents.filter(
    (incident) => !["resolved", "cancelled"].includes(incident.status) && filteredOrderIds.has(incident.orderId),
  );
  const awaiting = filteredOrders.filter((order) => order.status.startsWith("awaiting"));
  const inTransit = filteredOrders.filter((order) => order.status === "in-transit" || order.status === "shipment-informed");
  const delivered = filteredOrders.filter((order) => order.status === "delivered" || order.status === "completed");
  const filteredInstallments = installments.filter((installment) => filteredOrderIds.has(installment.orderId));
  const filteredPayments = payments.filter((payment) => filteredOrderIds.has(payment.orderId));
  const expected = filteredInstallments.reduce((sum, installment) => sum + installment.expectedAmount, 0);
  const received = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const overdue = filteredInstallments.filter((installment) => installment.status === "overdue").reduce((sum, installment) => sum + installment.expectedAmount, 0);
  const canViewFinance = user?.role === "admin" || user?.role === "finance";

  return (
    <section className="dashboard-page" aria-label="Dashboard operacional">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">Visão operacional</span>
          <h1>Dashboard</h1>
          <p>Acompanhe o que exige ação e mantenha os pedidos em movimento.</p>
        </div>
      </header>
      <PrototypeNotice />

      <FilterBar>
        <label>Período<select aria-label="Período" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todo o período</option><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option></select></label>
        <label>Responsável<select aria-label="Responsável" value={responsible} onChange={(event) => setResponsible(event.target.value)}><option value="all">Todos</option>{users.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
        <label>Fornecedor<select aria-label="Fornecedor" value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="all">Todos</option>{suppliers.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label>Região<select aria-label="Região" value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">Todas</option>{regions.map((name) => <option key={name}>{name}</option>)}</select></label>
      </FilterBar>

      <section aria-labelledby="operational-kpis" className="dashboard-section">
        <h2 id="operational-kpis">Operação agora</h2>
        <div className="kpi-grid">
          <KpiCard label="Aguardando retorno" value={awaiting.length} detail={<><Clock3 size={16} /> Cliente ou fornecedor</>} tone="warning" />
          <KpiCard label="Em transporte" value={inTransit.length} detail={<><Truck size={16} /> Cargas acompanhadas</>} tone="info" />
          <KpiCard label="Entregues" value={delivered.length} detail={<><PackageCheck size={16} /> Pedidos finalizados</>} />
          <KpiCard label="Ocorrências abertas" value={openIncidents.length} detail={<><AlertTriangle size={16} /> Exigem tratativa</>} tone="danger" />
        </div>
      </section>

      <section aria-labelledby="priorities-heading" className="dashboard-section dashboard-priorities">
        <div className="section-heading"><div><span className="page-eyebrow">Fila de ação</span><h2 id="priorities-heading">Prioridades de hoje</h2></div></div>
        <div className="priority-grid">
          {openIncidents.map((incident) => <article className="priority-card" key={incident.id}><StatusBadge tone="danger">Ocorrência</StatusBadge><h3>{incident.title}</h3><p>{incident.clientName} · {incident.supplierName}</p></article>)}
          {awaiting.map((order) => <article className="priority-card" key={order.id}><StatusBadge tone="warning">Retorno pendente</StatusBadge><h3>{order.clientName}</h3><p>{order.supplierName} · {statusLabels[order.status]}</p></article>)}
        </div>
      </section>

      <div className="dashboard-grid">
        <section aria-labelledby="recent-orders" className="dashboard-panel">
          <h2 id="recent-orders">Pedidos recentes</h2>
          <DataTable ariaLabel="Pedidos recentes" columns={recentColumns} rows={[...filteredOrders].reverse().slice(0, 5)} getRowId={(order) => order.id} emptyMessage="Nenhum pedido para os filtros selecionados" />
        </section>
        <section className="dashboard-panel"><OrderStatusChart values={statusValues} /></section>
      </div>

      {canViewFinance && (
        <section aria-labelledby="finance-heading" className="dashboard-section finance-summary">
          <div className="section-heading"><div><span className="page-eyebrow">Acesso restrito</span><h2 id="finance-heading">Resumo financeiro</h2></div></div>
          <div className="kpi-grid kpi-grid--finance">
            <KpiCard label="Previsto" value={currency.format(expected)} detail="Parcelas cadastradas" />
            <KpiCard label="Recebido" value={currency.format(received)} detail="Pagamentos registrados" />
            <KpiCard label="Em atraso" value={currency.format(overdue)} detail="Títulos vencidos" tone="danger" />
          </div>
        </section>
      )}
    </section>
  );
}
