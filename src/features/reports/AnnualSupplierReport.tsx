import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { KpiCard } from "../../components/KpiCard";
import type { Installment, Order, PostalShipment } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { formatLocalDate } from "../../domain/localDate";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function AnnualSupplierReport({ supplierId, year }: { supplierId: string; year: number }) {
  const { checks, installments, orders, parties, postalShipments } = usePrototypeStore();
  const supplierOrders = orders.filter(({ supplierId: id, shipment }) => id === supplierId && (!shipment?.shippedAt || shipment.shippedAt.startsWith(`${year}-`)));
  const supplierName = supplierOrders[0]?.supplierName ?? parties.find(({ id }) => id === supplierId)?.name ?? "Fornecedor";
  const orderIds = new Set(supplierOrders.map(({ id }) => id));
  const orderPostalIds = new Set(supplierOrders.flatMap(({ postalShipmentIds }) => postalShipmentIds ?? []));
  const orderCheckIds = new Set(supplierOrders.flatMap(({ checkIds }) => checkIds ?? []));
  const checkPostalIds = new Set(checks.filter(({ orderId }) => orderIds.has(orderId)).map(({ postalShipmentId }) => postalShipmentId).filter(Boolean));
  const linkedPostalShipments = postalShipments.filter((shipment) => orderPostalIds.has(shipment.id)
    || Boolean(shipment.orderId && orderIds.has(shipment.orderId))
    || checkPostalIds.has(shipment.id)
    || shipment.checkIds.some((checkId) => orderCheckIds.has(checkId)));
  const financial = installments.filter(({ orderId }) => orderIds.has(orderId));
  const merchandise = supplierOrders.reduce((sum, order) => sum + (order.values?.merchandise ?? 0), 0);
  const net = supplierOrders.reduce((sum, order) => sum + (order.values?.net ?? 0), 0);
  const orderColumns: DataTableColumn<Order>[] = [
    { key: "number", header: "Pedido", render: (row) => row.orderNumber ?? "Em cotação" },
    { key: "client", header: "Cliente", render: (row) => row.clientName },
    { key: "shipment", header: "Embarque", render: (row) => row.shipment?.shippedAt ? formatLocalDate(row.shipment.shippedAt) : "—" },
    { key: "merchandise", header: "Mercadoria", align: "end", render: (row) => currency.format(row.values?.merchandise ?? 0) },
    { key: "net", header: "Líquido", align: "end", render: (row) => currency.format(row.values?.net ?? 0) },
  ];
  const financialColumns: DataTableColumn<Installment>[] = [
    { key: "parcel", header: "Parcela", render: (row) => `${row.sequence}/${row.totalInstallments}` },
    { key: "due", header: "Vencimento", render: (row) => formatLocalDate(row.dueAt) },
    { key: "expected", header: "Previsto", align: "end", render: (row) => currency.format(row.expectedAmount) },
    { key: "status", header: "Status", render: (row) => row.status === "overdue" ? "Atrasado" : row.status },
  ];
  const postalColumns: DataTableColumn<PostalShipment>[] = [
    { key: "recipient", header: "Destinatário", render: (row) => row.recipient ?? "—" },
    { key: "service", header: "Serviço", render: (row) => row.service ?? row.carrier },
    { key: "tracking", header: "Rastreio", render: (row) => row.trackingCode },
    { key: "cost", header: "Custo", align: "end", render: (row) => currency.format(row.cost ?? 0) },
  ];

  return <section className="annual-report" aria-labelledby="annual-report-title">
    <div className="section-heading"><div><span className="page-eyebrow">Visão agrupada · {year}</span><h2 id="annual-report-title">Controle anual — {supplierName}</h2></div></div>
    <div className="kpi-grid annual-report__summary">
      <KpiCard label="Pedidos no ano" value={supplierOrders.length} detail="Registros vinculados" />
      <KpiCard label="Mercadoria anual" value={currency.format(merchandise)} detail="Total dos pedidos" />
      <KpiCard label="Líquido anual" value={currency.format(net)} detail="Após frete e ajustes" />
    </div>
    <section className="report-group"><h3>Pedidos e valores</h3><p>Pedido 3824 e demais registros do fornecedor, em uma tabela concisa.</p><DataTable ariaLabel="Pedidos anuais" columns={orderColumns} rows={supplierOrders} getRowId={(row) => row.id} emptyMessage="Nenhum pedido no período." /></section>
    <section className="report-group"><h3>Vencimentos</h3><DataTable ariaLabel="Vencimentos anuais" columns={financialColumns} rows={financial} getRowId={(row) => row.id} emptyMessage="Nenhum vencimento vinculado." /></section>
    <section className="report-group"><h3>Correios e rastreamento</h3><DataTable ariaLabel="Postagens vinculadas" columns={postalColumns} rows={linkedPostalShipments} getRowId={(row) => row.id} emptyMessage="Nenhuma postagem vinculada aos pedidos deste fornecedor." /></section>
  </section>;
}
