import { useState } from "react";
import { Check, Minus } from "lucide-react";
import { can, type Permission } from "../../auth/permissions";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { PrototypeNotice } from "../../components/PrototypeNotice";
import type { Role, UserProfile } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { UserForm } from "./UserForm";

const roleLabel: Record<Role, string> = { admin: "Administrador", commercial: "Comercial", finance: "Financeiro/Administrativo" };
const permissionRows: { permission: Permission; label: string }[] = [
  { permission: "view-dashboard", label: "Dashboard" },
  { permission: "view-orders", label: "Pedidos" },
  { permission: "edit-order", label: "Editar pedidos" },
  { permission: "view-parties", label: "Clientes e fornecedores" },
  { permission: "edit-parties", label: "Editar clientes e fornecedores" },
  { permission: "view-logistics", label: "Logística" },
  { permission: "edit-logistics", label: "Editar logística" },
  { permission: "view-finance", label: "Financeiro" },
  { permission: "record-payment", label: "Registrar pagamentos" },
  { permission: "view-checks", label: "Cheques e Correios" },
  { permission: "manage-checks", label: "Gerenciar cheques" },
  { permission: "view-settlements", label: "Acertos" },
  { permission: "manage-settlements", label: "Gerenciar acertos" },
  { permission: "view-reports", label: "Relatórios" },
  { permission: "manage-users", label: "Usuários" },
];

function PermissionMark({ allowed, role, label }: { allowed: boolean; role: string; label: string }) {
  const Icon = allowed ? Check : Minus;
  return <span aria-label={`${role}: ${label} — ${allowed ? "permitido" : "não permitido"}`} className={allowed ? "permission-yes" : "permission-no"}><Icon aria-hidden="true" size={17} /></span>;
}

export function UsersPage() {
  const { updateUser, users } = usePrototypeStore();
  const [editing, setEditing] = useState<UserProfile | null>();
  const [deactivating, setDeactivating] = useState<UserProfile | null>(null);
  const columns: DataTableColumn<UserProfile>[] = [
    { key: "name", header: "Nome", render: (row) => row.name },
    { key: "email", header: "E-mail", render: (row) => row.email },
    { key: "role", header: "Papel", render: (row) => roleLabel[row.role] },
    { key: "active", header: "Status", render: (row) => row.active ? "Ativo" : "Inativo" },
    { key: "actions", header: "Ações", render: (row) => <div className="table-actions"><button type="button" onClick={() => setEditing(row)}>Editar {row.name}</button>{row.active ? <button type="button" onClick={() => setDeactivating(row)}>Desativar {row.name}</button> : <button type="button" onClick={() => updateUser({ ...row, active: true })}>Ativar {row.name}</button>}</div> },
  ];

  return <section className="module-page">
    <header className="page-header"><div><span className="page-eyebrow">Administração</span><h1>Usuários e perfis</h1><p>Acessos simulados durante esta sessão.</p></div><button className="button-primary" type="button" onClick={() => setEditing(null)}>Novo usuário</button></header>
    <PrototypeNotice />
    <section className="module-panel"><h2>Usuários</h2><DataTable ariaLabel="Usuários" columns={columns} rows={users} getRowId={(row) => row.id} emptyMessage="Nenhum usuário cadastrado." /></section>
    {editing !== undefined && <section className="module-panel" aria-label={editing ? `Editar ${editing.name}` : "Novo usuário"}><h2>{editing ? "Editar usuário" : "Novo usuário"}</h2><UserForm user={editing ?? undefined} onSaved={() => setEditing(undefined)} /></section>}
    <section className="module-panel permission-matrix"><h2>Matriz de permissões</h2><p>As mesmas regras controlam menus, rotas e ações.</p><div className="data-table__scroll"><table className="data-table" aria-label="Matriz de permissões"><thead><tr><th>Permissão</th><th>Administrador</th><th>Comercial</th><th>Financeiro/Administrativo</th></tr></thead><tbody>{permissionRows.map(({ permission, label }) => <tr key={permission}><th scope="row">{label}</th>{(["admin", "commercial", "finance"] as Role[]).map((role) => <td data-label={roleLabel[role]} key={role}><PermissionMark allowed={can(role, permission)} role={roleLabel[role]} label={label} /></td>)}</tr>)}</tbody></table></div></section>
    <ConfirmDialog title="Desativar usuário" open={Boolean(deactivating)} onCancel={() => setDeactivating(null)} confirmLabel="Confirmar desativação" onConfirm={() => { if (deactivating) updateUser({ ...deactivating, active: false }); setDeactivating(null); }}><p>O perfil de {deactivating?.name} perderá o acesso nesta sessão. Deseja continuar?</p></ConfirmDialog>
  </section>;
}
