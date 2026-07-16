import { useMemo, useState, type KeyboardEvent } from "react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import { StatusBadge } from "../../components/StatusBadge";
import type { FinancialStatus, Installment, PaymentMethod } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { CollectionsPanel } from "./CollectionsPanel";
import { InstallmentDrawer } from "./InstallmentDrawer";

type FinanceTab = "receivable" | "payable" | "collections" | "movements";
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const tabs: { value: FinanceTab; label: string }[] = [
  { value: "receivable", label: "A receber" },
  { value: "payable", label: "A pagar" },
  { value: "collections", label: "Cobranças" },
  { value: "movements", label: "Movimentações" },
];
const statusLabels: Record<FinancialStatus, string> = {
  receivable: "A receber", payable: "A pagar", "due-soon": "Próximo do vencimento", overdue: "Atrasado",
  "partially-paid": "Pago parcialmente", paid: "Pago", "under-review": "Em conferência", difference: "Com diferença",
  overpaid: "Com diferença", settled: "Pago",
};
const methodLabels: Record<PaymentMethod, string> = { pix: "PIX", check: "Cheque", boleto: "Boleto", deposit: "Depósito", direct: "Direto" };
const isPayable = (installment: Installment) => installment.recipient === "supplier" || installment.recipient === "driver";

export function FinancePage() {
  const { installments, orders, parties, payments } = usePrototypeStore();
  const [tab, setTab] = useState<FinanceTab>("receivable");
  const [selectedId, setSelectedId] = useState<string>();
  const [status, setStatus] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [client, setClient] = useState("");
  const [supplier, setSupplier] = useState("");
  const [region, setRegion] = useState("");
  const [method, setMethod] = useState("");
  const clients = parties.filter(({ kind }) => kind === "client");
  const suppliers = parties.filter(({ kind }) => kind === "supplier");
  const regionForOrder = (order?: (typeof orders)[number]) =>
    order?.region ?? clients.find(({ id }) => id === order?.clientId)?.region;
  const regions = Array.from(new Set(orders.map((order) => regionForOrder(order)).filter(Boolean))) as string[];

  const orderFor = (installment: Installment) => orders.find(({ id }) => id === installment.orderId);
  const filtered = useMemo(() => installments.filter((installment) => {
    const order = orders.find(({ id }) => id === installment.orderId);
    const matchesDirection = tab === "payable" ? isPayable(installment) : !isPayable(installment);
    return matchesDirection
      && (!status || installment.status === status)
      && (!dueAt || installment.dueAt === dueAt)
      && (!client || order?.clientId === client)
      && (!supplier || order?.supplierId === supplier)
      && (!region || (order?.region ?? parties.find(({ id }) => id === order?.clientId)?.region) === region)
      && (!method || installment.method === method);
  }), [client, dueAt, installments, method, orders, parties, region, status, supplier, tab]);
  const selected = installments.find(({ id }) => id === selectedId);
  const selectedOrder = selected ? orderFor(selected) : undefined;
  const columns: DataTableColumn<Installment>[] = [
    { key: "sequence", header: "Parcela", render: (item) => `${item.sequence}/${item.totalInstallments}` },
    { key: "destination", header: "Destinatário", render: (item) => item.recipientName ?? item.recipient },
    { key: "order", header: "Pedido", render: (item) => orderFor(item)?.orderNumber ?? item.orderId },
    { key: "due", header: "Vencimento", render: (item) => item.dueAt },
    { key: "expected", header: "Previsto", align: "end", render: (item) => currency.format(item.expectedAmount) },
    { key: "actual", header: "Realizado", align: "end", render: (item) => item.actualAmount === undefined ? "—" : currency.format(item.actualAmount) },
    { key: "method", header: "Meio", render: (item) => item.method ? methodLabels[item.method] : "Não informado" },
    { key: "status", header: "Status", render: (item) => <StatusBadge tone={item.status === "overpaid" || item.status === "difference" ? "warning" : "info"}>{statusLabels[item.status]}</StatusBadge> },
  ];
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const next = tabs[nextIndex];
    setTab(next.value);
    document.getElementById(`finance-tab-${next.value}`)?.focus();
  };

  return (
    <section aria-labelledby="finance-title">
      <header className="page-header"><div><span className="page-eyebrow">Controle de caixa</span><h1 id="finance-title">Financeiro</h1><p>Parcelas, baixas, cobranças e movimentações relacionadas aos pedidos.</p></div></header>
      <PrototypeNotice />
      <div className="finance-tabs" role="tablist" aria-label="Visões financeiras">
        {tabs.map((item, index) => <button aria-controls={`finance-panel-${item.value}`} aria-selected={tab === item.value} id={`finance-tab-${item.value}`} key={item.value} onClick={() => setTab(item.value)} onKeyDown={(event) => handleTabKeyDown(event, index)} role="tab" tabIndex={tab === item.value ? 0 : -1} type="button">{item.label}</button>)}
      </div>
      {tabs.map((panel) => (
        <div
          aria-labelledby={`finance-tab-${panel.value}`}
          hidden={tab !== panel.value}
          id={`finance-panel-${panel.value}`}
          key={panel.value}
          role="tabpanel"
          tabIndex={tab === panel.value ? 0 : -1}
        >
        {tab === panel.value && <>
      {(tab === "receivable" || tab === "payable") && <FilterBar label="Filtros financeiros">
        <label>Status financeiro<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Vencimento<input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
        <label>Cliente<select value={client} onChange={(event) => setClient(event.target.value)}><option value="">Todos</option>{clients.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>
        <label>Fornecedor<select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="">Todos</option>{suppliers.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</select></label>
        <label>Região<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">Todas</option>{regions.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Meio de pagamento<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="">Todos</option>{Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </FilterBar>}

      {(tab === "receivable" || tab === "payable") && (
        <section className="orders-table-panel" aria-label={tab === "receivable" ? "Contas a receber" : "Contas a pagar"}>
          <div className="finance-list-heading"><h2>{tab === "receivable" ? "Contas a receber" : "Contas a pagar"}</h2>{filtered.find(({ status: value }) => !["paid", "overpaid", "settled"].includes(value)) && <button className="button-primary" type="button" onClick={() => setSelectedId(filtered.find(({ status: value }) => !["paid", "overpaid", "settled"].includes(value))!.id)}>Registrar baixa</button>}</div>
          <DataTable ariaLabel={tab === "receivable" ? "Parcelas a receber" : "Parcelas a pagar"} columns={columns} rows={filtered} getRowId={(item) => item.id} emptyMessage="Nenhuma parcela para os filtros selecionados" rowAction={{ label: (item) => `Ver parcela ${item.sequence} de ${item.totalInstallments}`, onClick: (item) => setSelectedId(item.id) }} />
        </section>
      )}
      {tab === "collections" && <CollectionsPanel />}
      {tab === "movements" && (
        <section className="orders-table-panel" aria-labelledby="movements-heading"><h2 id="movements-heading">Movimentações registradas</h2><ul className="finance-movements">{payments.map((payment) => <li key={payment.id}><strong>{methodLabels[payment.method]}</strong><span>{payment.recipientName ?? payment.recipient}</span><span>{currency.format(payment.amount)}</span><time dateTime={payment.paidAt}>{payment.paidAt}</time></li>)}</ul></section>
      )}
        </>}
        </div>
      ))}
      <InstallmentDrawer installment={selected} order={selectedOrder} open={Boolean(selected)} onClose={() => setSelectedId(undefined)} />
    </section>
  );
}
