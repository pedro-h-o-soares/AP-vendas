import { usePrototypeStore } from "../../state/PrototypeStore";
import { formatLocalPeriod } from "../../domain/localDate";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { SettlementEntry } from "../../domain/types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1 });

export function SettlementDetail({ settlementId }: { settlementId: string }) {
  const { settlements } = usePrototypeStore();
  const settlement = settlements.find(({ id }) => id === settlementId);
  if (!settlement) return <p role="status">Acerto não encontrado.</p>;
  const totals = settlement.entries.reduce((sum, entry) => ({
    merchandise: sum.merchandise + entry.merchandise,
    freight: sum.freight + entry.freight,
    tax: sum.tax + entry.tax,
    surplus: sum.surplus + entry.surplus,
    shortage: sum.shortage + entry.shortage,
    net: sum.net + entry.net,
    discount: sum.discount + entry.discount,
    commission: sum.commission + entry.commission,
  }), { merchandise: 0, freight: 0, tax: 0, surplus: 0, shortage: 0, net: 0, discount: 0, commission: 0 });
  const facts = [
    ["Mercadoria", currency.format(totals.merchandise)],
    ["Frete", currency.format(totals.freight)],
    ["ICMS", currency.format(totals.tax)],
    ["Sobra", currency.format(totals.surplus)],
    ["Falta", currency.format(totals.shortage)],
    ["Líquido", currency.format(totals.net)],
    ["Desconto à vista", `${currency.format(totals.discount)} · ${percent.format(settlement.entries[0]?.discountRate ?? 0)}`],
    ["Comissão", `${currency.format(totals.commission)} · ${percent.format(settlement.entries[0]?.commissionRate ?? 0)}`],
    ["Total a pagar", `${currency.format(settlement.amountPayable)} no relatório`],
    ["Pagamentos registrados", currency.format(settlement.paymentsTotal)],
    ["Extras", currency.format(settlement.extras)],
    ["Saldo", currency.format(settlement.balance)],
  ];
  const columns: DataTableColumn<SettlementEntry>[] = [
    { key: "client", header: "Cliente", render: (entry) => entry.clientName },
    { key: "net", header: "Líquido", render: (entry) => currency.format(entry.net) },
    { key: "discount", header: "Desconto", render: (entry) => currency.format(entry.discount) },
    { key: "commission", header: "Comissão", render: (entry) => currency.format(entry.commission) },
    { key: "payable", header: "A pagar", render: (entry) => currency.format(entry.payable) },
  ];

  return (
    <article className="settlement-report" aria-label={`Acerto ${settlement.supplierName}`}>
      <header className="settlement-report__header">
        <div><span className="page-eyebrow">{formatLocalPeriod(settlement.period)}</span><h2>Relatório de Acerto — {settlement.supplierName}</h2></div>
        <strong>{currency.format(settlement.reportTotal)}</strong>
      </header>
      <dl className="report-facts">
        {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <h3>Pedidos incluídos</h3>
      <DataTable ariaLabel="Pedidos incluídos no acerto" columns={columns} rows={settlement.entries} getRowId={(entry) => entry.orderId} emptyMessage="Nenhum pedido incluído." />
    </article>
  );
}
