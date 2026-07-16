import { Drawer } from "../../components/Drawer";
import type { Installment, Order } from "../../domain/types";
import { PaymentForm } from "./PaymentForm";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface InstallmentDrawerProps {
  installment?: Installment;
  order?: Order;
  open: boolean;
  onClose: () => void;
}

const valueOrDash = (value?: string | number) => value ?? "—";

export function InstallmentDrawer({ installment, order, open, onClose }: InstallmentDrawerProps) {
  if (!installment) return null;
  const title = `Parcela ${installment.sequence} de ${installment.totalInstallments}`;
  return (
    <Drawer title={title} open={open} onClose={onClose}>
      <div className="finance-detail">
        <p className="order-reference">{order?.clientName ?? "Cliente não informado"} · {order?.supplierName ?? "Fornecedor não informado"}</p>
        <dl className="finance-facts">
          <div><dt>Destinatário</dt><dd>{installment.recipientName ?? installment.recipient}</dd></div>
          <div><dt>Valor previsto</dt><dd>{currency.format(installment.expectedAmount)}</dd></div>
          <div><dt>Valor realizado</dt><dd>{installment.actualAmount === undefined ? "—" : currency.format(installment.actualAmount)}</dd></div>
          <div><dt>Vencimento</dt><dd>{installment.dueAt}</dd></div>
          <div><dt>Data da baixa</dt><dd>{valueOrDash(installment.paidAt)}</dd></div>
          <div><dt>Diferença</dt><dd>{installment.difference === undefined ? "—" : currency.format(installment.difference)}</dd></div>
          <div><dt>Dados bancários</dt><dd>{[installment.bank, installment.branch, installment.account].filter(Boolean).join(" · ") || "Não informados"}</dd></div>
          <div><dt>Operação</dt><dd>{valueOrDash(installment.operation)}</dd></div>
          <div><dt>Observações</dt><dd>{valueOrDash(installment.notes)}</dd></div>
          <div><dt>Pedido vinculado</dt><dd>{order?.orderNumber ?? order?.id ?? installment.orderId}</dd></div>
        </dl>
        <PaymentForm installment={installment} />
      </div>
    </Drawer>
  );
}
