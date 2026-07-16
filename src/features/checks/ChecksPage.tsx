import { useState, type KeyboardEvent } from "react";
import { can } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import { StatusBadge, type StatusTone } from "../../components/StatusBadge";
import { toLocalISODate } from "../../domain/localDate";
import type { Check, FinancialStatus, PostalShipment, PostalStatus } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { CheckDrawer } from "./CheckDrawer";
import { PostalShipmentForm } from "./PostalShipmentForm";

type ChecksTab = "checks" | "postal";
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const tabs: { value: ChecksTab; label: string }[] = [{ value: "checks", label: "Cheques" }, { value: "postal", label: "Correios" }];
const postalLabels: Record<PostalStatus, string> = { prepared: "Preparada", posted: "Postado", "in-transit": "Em trânsito", delivered: "Entregue", returned: "Devolvido" };
const postalTones: Record<PostalStatus, StatusTone> = { prepared: "neutral", posted: "info", "in-transit": "info", delivered: "success", returned: "danger" };
const checkLabels: Record<FinancialStatus, string> = {
  receivable: "A receber", payable: "A pagar", "due-soon": "Próximo do vencimento", overdue: "Atrasado",
  "partially-paid": "Pago parcialmente", paid: "Pago", "under-review": "Em conferência", difference: "Com diferença",
  overpaid: "Com diferença", settled: "Liquidado",
};
const checkTone = (status: FinancialStatus): StatusTone => {
  if (["paid", "settled"].includes(status)) return "success";
  if (["overdue", "difference", "overpaid"].includes(status)) return status === "overdue" ? "danger" : "warning";
  return "info";
};

const Fact = ({ label, value }: { label: string; value?: React.ReactNode }) => <div><dt>{label}</dt><dd>{value ?? "—"}</dd></div>;

export function ChecksPage() {
  const { user } = useAuth();
  const { checks, postalShipments, updatePostalShipmentStatus } = usePrototypeStore();
  const [tab, setTab] = useState<ChecksTab>("checks");
  const [selectedId, setSelectedId] = useState<string>();
  const canManage = Boolean(user && can(user.role, "manage-checks"));
  const selected = checks.find(({ id }) => id === selectedId);
  const columns: DataTableColumn<Check>[] = [
    { key: "number", header: "Número", render: (check) => check.number },
    { key: "owner", header: "Titular", render: (check) => check.owner },
    { key: "goodFor", header: "Bom para", render: (check) => check.goodForAt },
    { key: "amount", header: "Valor", align: "end", render: (check) => currency.format(check.amount) },
    { key: "status", header: "Status", render: (check) => <StatusBadge tone={checkTone(check.status)}>{checkLabels[check.status]}</StatusBadge> },
  ];
  const changeTab = (value: ChecksTab) => { setTab(value); setSelectedId(undefined); };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number | undefined;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    changeTab(tabs[next].value);
    document.getElementById(`checks-tab-${tabs[next].value}`)?.focus();
  };
  const setPostalStatus = (shipment: PostalShipment, status: PostalStatus) => {
    updatePostalShipmentStatus(shipment.id, status, status === "delivered" ? toLocalISODate() : undefined);
  };

  return (
    <section aria-labelledby="checks-title">
      <header className="page-header">
        <div><span className="page-eyebrow">Controle financeiro e envio</span><h1 id="checks-title">Cheques e Correios</h1><p>Cheques recebidos, postagens simuladas, custos e rastreamento.</p></div>
        {canManage && checks[0] && <button className="button-primary" onClick={() => setSelectedId(checks[0].id)} type="button">Simular postagem</button>}
      </header>
      <PrototypeNotice />
      <div className="checks-tabs" role="tablist" aria-label="Cheques e Correios">
        {tabs.map((item, index) => <button aria-controls={`checks-panel-${item.value}`} aria-selected={tab === item.value} id={`checks-tab-${item.value}`} key={item.value} onClick={() => changeTab(item.value)} onKeyDown={(event) => handleTabKeyDown(event, index)} role="tab" tabIndex={tab === item.value ? 0 : -1} type="button">{item.label}</button>)}
      </div>
      <div aria-labelledby={`checks-tab-${tab}`} id={`checks-panel-${tab}`} role="tabpanel" tabIndex={0}>
        {tab === "checks" ? (
          <section className="orders-table-panel" aria-label="Cheques recebidos">
            <DataTable ariaLabel="Cheques recebidos" columns={columns} rows={checks} getRowId={(check) => check.id} emptyMessage="Nenhum cheque registrado" rowAction={{ label: (check) => `Ver cheque ${check.number}`, onClick: (check) => setSelectedId(check.id) }} />
          </section>
        ) : (
          <div className="postal-list">
            {postalShipments.map((shipment) => (
              <article aria-label={`Postagem para ${shipment.recipient ?? "destinatário não informado"}`} className="postal-card" key={shipment.id}>
                <header><div><span>{shipment.carrier}</span><h2>{shipment.recipient ?? "Destinatário não informado"}</h2></div><StatusBadge tone={postalTones[shipment.status]}>{postalLabels[shipment.status]}</StatusBadge></header>
                <dl className="postal-facts">
                  <Fact label="Serviço" value={shipment.service} /><Fact label="Código postal" value={shipment.postalCode} />
                  <Fact label="Rastreio" value={shipment.trackingCode} /><Fact label="Custo" value={shipment.cost === undefined ? undefined : currency.format(shipment.cost)} />
                  <Fact label="Fatura" value={shipment.invoice} /><Fact label="Postado" value={shipment.postedAt} />
                  <Fact label="Previsão" value={shipment.expectedDeliveryAt} /><Fact label="Entrega" value={shipment.deliveredAt} />
                  <Fact label="Valor pago" value={shipment.paidAmount === undefined ? undefined : currency.format(shipment.paidAmount)} />
                  <Fact label="Valor a receber" value={shipment.receivableAmount === undefined ? undefined : currency.format(shipment.receivableAmount)} />
                  <Fact label="Diferença" value={shipment.difference === undefined ? undefined : currency.format(shipment.difference)} />
                  <Fact label="Responsável" value={shipment.responsible} /><Fact label="Observações" value={shipment.notes} />
                </dl>
                {canManage && shipment.status === "prepared" && <button className="button-primary" onClick={() => setPostalStatus(shipment, "posted")} type="button">Marcar como postado</button>}
                {canManage && (shipment.status === "posted" || shipment.status === "in-transit") && <button className="button-primary" onClick={() => setPostalStatus(shipment, "delivered")} type="button">Marcar como entregue</button>}
              </article>
            ))}
          </div>
        )}
      </div>
      {selected && <CheckDrawer check={selected} onClose={() => setSelectedId(undefined)}><PostalShipmentForm checkId={selected.id} /></CheckDrawer>}
    </section>
  );
}
