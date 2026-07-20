import { useState } from "react";
import { Drawer } from "../../components/Drawer";
import type { Installment, ISODate, Order } from "../../domain/types";
import { PaymentForm } from "./PaymentForm";
import { usePrototypeStore } from "../../state/PrototypeStore";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface InstallmentDrawerProps {
  installment?: Installment;
  order?: Order;
  open: boolean;
  onClose: () => void;
}

const valueOrDash = (value?: string | number) => value ?? "—";

export function InstallmentDrawer({ installment, order, open, onClose }: InstallmentDrawerProps) {
  const { updateInstallment } = usePrototypeStore();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    expectedAmount: "", dueAt: "", bank: "", branch: "", account: "", operation: "", notes: "",
  });
  if (!installment) return null;

  const startEditing = () => {
    setEditForm({
      expectedAmount: String(installment.expectedAmount),
      dueAt: installment.dueAt,
      bank: installment.bank ?? "",
      branch: installment.branch ?? "",
      account: installment.account ?? "",
      operation: installment.operation ?? "",
      notes: installment.notes ?? "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    const changes: Partial<Pick<Installment, "expectedAmount" | "dueAt" | "bank" | "branch" | "account" | "operation" | "notes">> = {};
    const parsed = Number.parseFloat(editForm.expectedAmount);
    if (!Number.isNaN(parsed)) changes.expectedAmount = parsed;
    if (editForm.dueAt) changes.dueAt = editForm.dueAt as ISODate;
    if (editForm.bank) changes.bank = editForm.bank;
    if (editForm.branch) changes.branch = editForm.branch;
    if (editForm.account) changes.account = editForm.account;
    if (editForm.operation) changes.operation = editForm.operation;
    if (editForm.notes) changes.notes = editForm.notes;
    updateInstallment(installment.id, changes);
    setEditing(false);
  };

  const title = `Parcela ${installment.sequence} de ${installment.totalInstallments}`;
  return (
    <Drawer title={title} open={open} onClose={onClose}>
      <div className="finance-detail">
        <p className="order-reference">{order?.clientName ?? "Cliente não informado"} · {order?.supplierName ?? "Fornecedor não informado"}</p>
        <dl className="finance-facts">
          <div><dt>Destinatário</dt><dd>{installment.recipientName ?? installment.recipient}</dd></div>
          <div><dt>Valor previsto</dt><dd>{editing ? <input type="number" step="0.01" value={editForm.expectedAmount} onChange={(e) => setEditForm((f) => ({ ...f, expectedAmount: e.target.value }))} /> : currency.format(installment.expectedAmount)}</dd></div>
          <div><dt>Valor realizado</dt><dd>{installment.actualAmount === undefined ? "—" : currency.format(installment.actualAmount)}</dd></div>
          <div><dt>Vencimento</dt><dd>{editing ? <input type="date" value={editForm.dueAt} onChange={(e) => setEditForm((f) => ({ ...f, dueAt: e.target.value }))} /> : installment.dueAt}</dd></div>
          <div><dt>Data da baixa</dt><dd>{valueOrDash(installment.paidAt)}</dd></div>
          <div><dt>Diferença</dt><dd>{installment.difference === undefined ? "—" : currency.format(installment.difference)}</dd></div>
          <div><dt>Dados bancários</dt><dd>{editing ? <><input placeholder="Banco" value={editForm.bank} onChange={(e) => setEditForm((f) => ({ ...f, bank: e.target.value }))} /> <input placeholder="Agência" value={editForm.branch} onChange={(e) => setEditForm((f) => ({ ...f, branch: e.target.value }))} /> <input placeholder="Conta" value={editForm.account} onChange={(e) => setEditForm((f) => ({ ...f, account: e.target.value }))} /></> : [installment.bank, installment.branch, installment.account].filter(Boolean).join(" · ") || "Não informados"}</dd></div>
          <div><dt>Operação</dt><dd>{editing ? <input value={editForm.operation} onChange={(e) => setEditForm((f) => ({ ...f, operation: e.target.value }))} /> : valueOrDash(installment.operation)}</dd></div>
          <div><dt>Observações</dt><dd>{editing ? <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} /> : valueOrDash(installment.notes)}</dd></div>
          <div><dt>Pedido vinculado</dt><dd>{order?.orderNumber ?? order?.id ?? installment.orderId}</dd></div>
        </dl>
        <div className="finance-actions">
          {editing ? (
            <>
              <button className="button-primary" type="button" onClick={saveEdit}>Salvar</button>
              <button className="button-secondary" type="button" onClick={() => setEditing(false)}>Cancelar</button>
            </>
          ) : (
            <button className="button-secondary" type="button" onClick={startEditing}>Editar</button>
          )}
        </div>
        <PaymentForm installment={installment} />
      </div>
    </Drawer>
  );
}
