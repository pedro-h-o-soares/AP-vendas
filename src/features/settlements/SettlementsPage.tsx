import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import type { Settlement } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { SettlementDetail } from "./SettlementDetail";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function SettlementsPage() {
  const { settlements } = usePrototypeStore();
  const [supplier, setSupplier] = useState("all");
  const [period, setPeriod] = useState("all");
  const [selectedId, setSelectedId] = useState<string>();
  const filtered = settlements.filter((item) => (supplier === "all" || item.supplierId === supplier) && (period === "all" || item.period === period));
  const columns = useMemo<DataTableColumn<Settlement>[]>(() => [
    { key: "supplier", header: "Fornecedor", render: (row) => row.supplierName },
    { key: "period", header: "Período", render: (row) => row.period },
    { key: "orders", header: "Pedidos", render: (row) => row.orderIds.length },
    { key: "total", header: "Total", align: "end", render: (row) => currency.format(row.reportTotal) },
    { key: "status", header: "Status", render: (row) => row.status === "settled" ? "Acertado" : "Em conferência" },
  ], []);
  const suppliers = [...new Map(settlements.map((item) => [item.supplierId, item.supplierName])).entries()];
  const periods = [...new Set(settlements.map((item) => item.period))];

  return <section className="module-page">
    <header className="page-header"><div><span className="page-eyebrow">Comissões e acertos</span><h1>Acertos</h1><p>Conciliação por fornecedor e período.</p></div></header>
    <PrototypeNotice />
    <FilterBar>
      <label>Fornecedor<select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="all">Todos</option>{suppliers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Período<select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="all">Todos</option>{periods.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </FilterBar>
    <div className="module-panel"><DataTable ariaLabel="Acertos" columns={columns} rows={filtered} getRowId={(row) => row.id} emptyMessage="Nenhum acerto encontrado." rowAction={{ label: (row) => `Ver acerto ${row.supplierName}`, onClick: (row) => setSelectedId(row.id) }} /></div>
    {selectedId && <SettlementDetail settlementId={selectedId} />}
  </section>;
}
