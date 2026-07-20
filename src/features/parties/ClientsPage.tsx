import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { Drawer } from "../../components/Drawer";
import { FilterBar } from "../../components/FilterBar";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import type { Party } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { PartyDetailDrawer } from "./PartyDetailDrawer";
import { PartyForm } from "./PartyForm";

export function ClientsPage() {
  const { parties, createParty } = usePrototypeStore();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const clients = parties.filter(({ kind }) => kind === "client");
  const regions = [...new Set(clients.map(({ region: value }) => value).filter(Boolean))] as string[];
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return clients.filter((party) => (!term || [party.name, party.contact, party.phone, party.email].join(" ").toLocaleLowerCase("pt-BR").includes(term)) && (!region || party.region === region));
  }, [clients, region, search]);
  const selected = parties.find(({ id }) => id === selectedId);
  const columns: DataTableColumn<Party>[] = [
    { key: "name", header: "Cliente", render: (party) => party.name },
    { key: "contact", header: "Contato", render: (party) => party.phone ?? party.email ?? party.contact ?? "—" },
    { key: "region", header: "Região", render: (party) => party.region ?? "—" },
    { key: "terms", header: "Condições usuais", render: (party) => party.usualPaymentTerms ?? "—" },
  ];

  return (
    <section aria-labelledby="clients-title">
      <header className="page-header"><div><span className="page-eyebrow">Relacionamentos</span><h1 id="clients-title">Clientes</h1><p>Contatos, condições e histórico operacional em uma única consulta.</p></div>{user && can(user.role, "edit-parties") && <button className="button-primary" type="button" onClick={() => setCreating(true)}>Criar cliente</button>}</header>
      <PrototypeNotice />
      <FilterBar label="Filtros de clientes">
        <label>Buscar<input aria-label="Buscar clientes" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, contato, telefone ou e-mail" /></label>
        <label>Região<select value={region} onChange={(event) => setRegion(event.target.value)}><option value="">Todas</option>{regions.map((value) => <option key={value}>{value}</option>)}</select></label>
      </FilterBar>
      <section className="orders-table-panel" aria-label="Lista de clientes"><DataTable ariaLabel="Clientes" columns={columns} rows={filtered} getRowId={(party) => party.id} emptyMessage="Nenhum cliente para os filtros selecionados" rowAction={{ label: (party) => `Ver ${party.name}`, onClick: (party) => setSelectedId(party.id) }} /></section>
      <PartyDetailDrawer party={selected} open={Boolean(selected)} canEdit={Boolean(user && can(user.role, "edit-parties"))} onClose={() => setSelectedId(undefined)} />
      <Drawer title="Novo cliente" open={creating} onClose={() => setCreating(false)}>
        <PartyForm kind="client" onCancel={() => setCreating(false)} onSave={(party) => { createParty(party); setCreating(false); }} />
      </Drawer>
    </section>
  );
}
