import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import type { Party } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { PartyDetailDrawer } from "./PartyDetailDrawer";

const percentage = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 });

export function SuppliersPage() {
  const { parties } = usePrototypeStore();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState("");
  const suppliers = parties.filter(({ kind }) => kind === "supplier");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return suppliers.filter((party) => !term || [party.name, party.contact, party.email].join(" ").toLocaleLowerCase("pt-BR").includes(term));
  }, [search, suppliers]);
  const selected = parties.find(({ id }) => id === selectedId);
  const columns: DataTableColumn<Party>[] = [
    { key: "name", header: "Fornecedor", render: (party) => party.name },
    { key: "contact", header: "Contato", render: (party) => party.phone ?? party.email ?? party.contact ?? "—" },
    { key: "commission", header: "Comissão", render: (party) => party.commissionRate === undefined ? "—" : percentage.format(party.commissionRate) },
    { key: "discount", header: "Desconto à vista", render: (party) => party.cashDiscountRate === undefined ? "—" : percentage.format(party.cashDiscountRate) },
  ];

  return (
    <section aria-labelledby="suppliers-title">
      <header className="page-header"><div><span className="page-eyebrow">Relacionamentos</span><h1 id="suppliers-title">Fornecedores</h1><p>Regras comerciais, pedidos, embarques e acertos relacionados.</p></div></header>
      <PrototypeNotice />
      <FilterBar label="Filtros de fornecedores"><label>Buscar<input aria-label="Buscar fornecedores" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, contato ou e-mail" /></label></FilterBar>
      <section className="orders-table-panel" aria-label="Lista de fornecedores"><DataTable ariaLabel="Fornecedores" columns={columns} rows={filtered} getRowId={(party) => party.id} emptyMessage="Nenhum fornecedor para a busca informada" rowAction={{ label: (party) => `Ver ${party.name}`, onClick: (party) => setSelectedId(party.id) }} /></section>
      <PartyDetailDrawer party={selected} open={Boolean(selected)} canEdit={Boolean(user && can(user.role, "edit-parties"))} onClose={() => setSelectedId(undefined)} />
    </section>
  );
}
