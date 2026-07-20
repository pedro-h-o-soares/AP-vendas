import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { KpiCard } from "../../components/KpiCard";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import type { Order, OrderStatus } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { AnnualSupplierReport } from "./AnnualSupplierReport";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ReportsPage() {
  const { incidents, installments, orders, parties, settlements } = usePrototypeStore();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [client, setClient] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");
  const filtered = orders.filter((order) => {
    const date = order.orderedAt ?? order.shipments?.[0]?.shippedAt;
    const relatedRegion = order.region ?? parties.find(({ id }) => id === order.clientId)?.region;
    const hasDateBoundary = Boolean(start || end);
    const matchesDate = !hasDateBoundary || Boolean(date && (!start || date >= start) && (!end || date <= end));
    return (client === "all" || order.clientId === client)
      && (supplier === "all" || order.supplierId === supplier)
      && (status === "all" || order.status === status)
      && (region === "all" || relatedRegion === region)
      && matchesDate;
  });
  const filteredIds = new Set(filtered.map(({ id }) => id));
  const financial = installments.filter(({ orderId }) => filteredIds.has(orderId));
  const shipmentCount = filtered.filter(({ shipments }) => shipments?.length).length;
  const incidentCount = incidents.filter(({ orderId }) => filteredIds.has(orderId)).length;
  const commissionTotal = settlements.flatMap(({ entries }) => entries).filter(({ orderId }) => filteredIds.has(orderId)).reduce((sum, entry) => sum + entry.commission, 0);
  const financeTotal = financial.reduce((sum, item) => sum + item.expectedAmount, 0);
  const columns = useMemo<DataTableColumn<Order>[]>(() => [
    { key: "number", header: "Pedido", render: (row) => row.orderNumber ?? "Em cotação" },
    { key: "client", header: "Cliente", render: (row) => row.clientName },
    { key: "supplier", header: "Fornecedor", render: (row) => row.supplierName },
    { key: "status", header: "Status", render: (row) => row.status },
    { key: "net", header: "Líquido", align: "end", render: (row) => currency.format(row.values?.net ?? 0) },
  ], []);
  const suppliers = [...new Map(orders.map((order) => [order.supplierId, order.supplierName])).entries()];
  const clients = [...new Map(orders.map((order) => [order.clientId, order.clientName])).entries()];
  const statuses = [...new Set(orders.map(({ status }) => status))] as OrderStatus[];
  const regions = [...new Set(orders.map((order) => order.region ?? parties.find(({ id }) => id === order.clientId)?.region).filter(Boolean))] as string[];

  return <section className="module-page">
    <header className="page-header"><div><span className="page-eyebrow">Análise operacional</span><h1>Relatórios</h1><p>Pedidos, movimentos financeiros, embarques, incidentes e comissões.</p></div></header>
    <PrototypeNotice />
    <FilterBar>
      <label>Período inicial<input aria-label="Período inicial" type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
      <label>Período final<input aria-label="Período final" type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      <label>Cliente<select value={client} onChange={(event) => setClient(event.target.value)}><option value="all">Todos</option>{clients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Fornecedor<select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="all">Todos</option>{suppliers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Status do pedido<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Região<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="all">Todas</option>{regions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </FilterBar>
    <div className="kpi-grid reports-summary">
      <KpiCard label="Pedidos" value={filtered.length} detail="No recorte selecionado" />
      <KpiCard label="Financeiro" value={currency.format(financeTotal)} detail={`${financial.length} vencimentos`} />
      <KpiCard label="Embarques" value={shipmentCount} detail="Pedidos com carga" />
      <KpiCard label="Incidentes" value={incidentCount} detail="Ocorrências vinculadas" tone={incidentCount ? "warning" : "default"} />
      <KpiCard label="Comissões" value={currency.format(commissionTotal)} detail="Comissões dos pedidos filtrados" />
    </div>
    <section className="module-panel"><h2>Pedidos no recorte</h2><DataTable ariaLabel="Pedidos do relatório" columns={columns} rows={filtered} getRowId={(row) => row.id} emptyMessage="Nenhum pedido encontrado." /></section>
    {(supplier === "all" || supplier === "party-brasil-flora") && <AnnualSupplierReport supplierId="party-brasil-flora" year={2026} />}
  </section>;
}
