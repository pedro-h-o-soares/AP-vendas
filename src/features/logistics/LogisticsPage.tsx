import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import { StatusBadge } from "../../components/StatusBadge";
import type { Order } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { ShipmentDrawer } from "./ShipmentDrawer";

const status = (order: Order) => order.shipment?.deliveredAt ? "Entregue" : order.status === "in-transit" ? "Em trânsito" : "Embarque informado";

export function LogisticsPage() {
  const { orders } = usePrototypeStore();
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("");
  const shipments = orders.filter(({ shipment }) => Boolean(shipment));
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return shipments.filter((order) => {
      const searchable = [order.orderNumber, order.clientName, order.supplierName, order.shipment?.invoiceNumber, order.shipment?.driverName].join(" ").toLocaleLowerCase("pt-BR");
      return (!term || searchable.includes(term)) && (!shipmentStatus || status(order) === shipmentStatus);
    });
  }, [search, shipmentStatus, shipments]);
  const selected = orders.find(({ id }) => id === selectedId);
  const columns: DataTableColumn<Order>[] = [
    { key: "status", header: "Status", render: (order) => <StatusBadge tone={order.shipment?.deliveredAt ? "success" : "info"}>{status(order)}</StatusBadge> },
    { key: "client", header: "Cliente", render: (order) => order.clientName },
    { key: "supplier", header: "Fornecedor", render: (order) => order.supplierName },
    { key: "note", header: "Nota", render: (order) => order.shipment?.noteNumber ?? "—" },
    { key: "invoice", header: "Nota fiscal", render: (order) => order.shipment?.invoiceNumber ?? "—" },
    { key: "driver", header: "Motorista", render: (order) => order.shipment?.driverName ?? "—" },
    { key: "route", header: "Rota", render: (order) => order.shipment?.route ?? "—" },
    { key: "departure", header: "Saída", render: (order) => order.shipment?.shippedAt ?? "—" },
    { key: "forecast", header: "Previsão", render: (order) => order.shipment?.expectedDeliveryAt ?? "—" },
    { key: "delivery", header: "Entrega", render: (order) => order.shipment?.deliveredAt ?? "Pendente" },
  ];

  return (
    <section aria-labelledby="logistics-title">
      <header className="page-header"><div><span className="page-eyebrow">Operação</span><h1 id="logistics-title">Logística</h1><p>Embarques, documentos, motoristas e conferência de entrega.</p></div></header>
      <PrototypeNotice />
      <FilterBar label="Filtros de logística">
        <label>Buscar<input aria-label="Buscar embarques" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pedido, cliente, fornecedor ou NF" /></label>
        <label>Status<select value={shipmentStatus} onChange={(event) => setShipmentStatus(event.target.value)}><option value="">Todos</option><option>Embarque informado</option><option>Em trânsito</option><option>Entregue</option></select></label>
      </FilterBar>
      <section className="orders-table-panel" aria-label="Lista de embarques">
        <DataTable ariaLabel="Embarques" columns={columns} rows={filtered} getRowId={(order) => order.shipment!.id} emptyMessage="Nenhum embarque para os filtros selecionados" rowAction={{ label: (order) => `Ver embarque ${order.orderNumber ?? order.id}`, onClick: (order) => setSelectedId(order.id) }} />
      </section>
      <ShipmentDrawer order={selected} shipment={selected?.shipment} open={Boolean(selected)} onClose={() => setSelectedId(undefined)} />
    </section>
  );
}
