import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import { StatusBadge, type StatusTone } from "../../components/StatusBadge";
import type { Order, OrderStatus } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { QuoteWizard } from "./QuoteWizard";

const statusLabels: Record<OrderStatus, string> = {
  draft: "Rascunho", quote: "Orçamento", "awaiting-stock": "Aguardando estoque",
  "quote-sent": "Orçamento enviado", "awaiting-supplier": "Aguardando fornecedor",
  "awaiting-client": "Aguardando cliente", confirmed: "Confirmado", preparing: "Em preparação",
  "shipment-informed": "Embarque informado", "in-transit": "Em trânsito", delivered: "Entregue",
  incident: "Com ocorrência", completed: "Concluído", cancelled: "Cancelado",
};

const statusTone = (status: OrderStatus): StatusTone => {
  if (["delivered", "completed", "confirmed"].includes(status)) return "success";
  if (["incident", "cancelled"].includes(status)) return "danger";
  if (["awaiting-stock", "awaiting-supplier", "awaiting-client"].includes(status)) return "warning";
  return "info";
};

const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))].sort();

export function OrdersPage() {
  const { orders } = usePrototypeStore();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [supplier, setSupplier] = useState("");
  const [owner, setOwner] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [orderedAt, setOrderedAt] = useState("");

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return orders.filter((order) => {
      const haystack = [order.orderNumber, order.clientName, order.supplierName].join(" ").toLocaleLowerCase("pt-BR");
      return (!normalizedSearch || haystack.includes(normalizedSearch))
        && (!status || order.status === status)
        && (!supplier || order.supplierId === supplier)
        && (!owner || order.ownerName === owner)
        && (!city || order.city === city)
        && (!region || order.region === region)
        && (!orderedAt || order.orderedAt === orderedAt);
    });
  }, [city, orderedAt, orders, owner, region, search, status, supplier]);

  const columns: DataTableColumn<Order>[] = [
    { key: "number", header: "Número", render: (order) => order.orderNumber ?? "Orçamento" },
    { key: "client", header: "Cliente", render: (order) => order.clientName },
    { key: "supplier", header: "Fornecedor", render: (order) => order.supplierName },
    { key: "date", header: "Data do pedido", render: (order) => order.orderedAt ?? "—" },
    { key: "shipment", header: "Embarque", render: (order) => order.shipment?.shippedAt ?? "—" },
    { key: "owner", header: "Responsável", render: (order) => order.ownerName ?? "—" },
    { key: "status", header: "Status", render: (order) => <StatusBadge tone={statusTone(order.status)}>{statusLabels[order.status]}</StatusBadge> },
  ];

  return (
    <section aria-labelledby="orders-title">
      <header className="page-header">
        <div><span className="page-eyebrow">Operação comercial</span><h1 id="orders-title">Pedidos</h1><p>Orçamentos e pedidos integrados em uma única jornada.</p></div>
        <button className="button-primary" type="button" onClick={() => setWizardOpen(true)}>Novo orçamento</button>
      </header>
      <PrototypeNotice />

      <FilterBar label="Filtros de pedidos">
        <label>Buscar<input aria-label="Buscar pedidos" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, fornecedor ou número" /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Fornecedor<select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="">Todos</option>{orders.map((order) => order.supplierId).filter((id, index, ids) => ids.indexOf(id) === index).map((id) => <option key={id} value={id}>{orders.find((order) => order.supplierId === id)?.supplierName}</option>)}</select></label>
        <label>Responsável<select value={owner} onChange={(event) => setOwner(event.target.value)}><option value="">Todos</option>{unique(orders.map((order) => order.ownerName)).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Cidade<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">Todas</option>{unique(orders.map((order) => order.city)).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Região<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">Todas</option>{unique(orders.map((order) => order.region)).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Data do pedido<input type="date" value={orderedAt} onChange={(event) => setOrderedAt(event.target.value)} /></label>
      </FilterBar>

      <section className="orders-table-panel" aria-label="Lista de pedidos">
        <DataTable ariaLabel="Pedidos" columns={columns} rows={filteredOrders} getRowId={(order) => order.id} emptyMessage="Nenhum pedido para os filtros selecionados" rowAction={{ label: () => "Ver pedido", onClick: (order) => navigate(`/pedidos/${order.id}`) }} />
      </section>
      <QuoteWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </section>
  );
}
