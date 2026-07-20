import { useMemo, useState } from "react";
import { Drawer } from "../../components/Drawer";
import { StatusBadge } from "../../components/StatusBadge";
import type { Order, Party } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";
import { orderStatusLabels, orderStatusTone } from "../orders/orderStatus";
import { PartyForm } from "./PartyForm";

interface PartyDetailDrawerProps {
  party?: Party;
  open: boolean;
  canEdit: boolean;
  onClose: () => void;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percentage = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 });

const partyOrders = (orders: Order[], party: Party) =>
  orders.filter((order) => party.kind === "client" ? order.clientId === party.id : order.supplierId === party.id);

export function PartyDetailDrawer({ party, open, canEdit, onClose }: PartyDetailDrawerProps) {
  const { installments, orders, payments, updateParty } = usePrototypeStore();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const relatedOrders = useMemo(() => party ? partyOrders(orders, party) : [], [orders, party]);

  if (!party) return null;
  const orderIds = new Set(relatedOrders.map(({ id }) => id));
  const financialRecipient = party.kind === "client" ? "client" : "supplier";
  const relatedInstallments = installments.filter((installment) => orderIds.has(installment.orderId) && installment.recipient === financialRecipient);
  const relatedPayments = payments.filter((payment) => orderIds.has(payment.orderId) && payment.recipient === financialRecipient);
  const commercialTotal = relatedOrders.reduce((total, order) => total + (order.values?.net ?? 0), 0);
  const expectedTotal = relatedInstallments.reduce((total, item) => total + item.expectedAmount, 0);
  const paidTotal = relatedPayments.reduce((total, item) => total + item.amount, 0);
  const expectedLabel = party.kind === "client" ? "A receber do cliente" : "A pagar ao fornecedor";
  const paidLabel = party.kind === "client" ? "Recebido do cliente" : "Pago ao fornecedor";
  const differenceLabel = party.kind === "client" ? "Diferença do cliente" : "Diferença do fornecedor";

  const close = () => {
    setEditing(false);
    setSaved(false);
    onClose();
  };

  return (
    <Drawer title={party.name} open={open} onClose={close}>
      {editing ? (
        <PartyForm
          party={party}
          kind={party.kind}
          onCancel={() => setEditing(false)}
          onSave={(changed) => {
            updateParty(changed);
            setEditing(false);
            setSaved(true);
          }}
        />
      ) : (
        <div className="party-detail">
          {saved && <p className="session-notice" role="status">Cadastro atualizado somente nesta sessão.</p>}
          <div className="party-detail__toolbar">
            <StatusBadge tone="info">{party.kind === "client" ? "Cliente" : "Fornecedor"}</StatusBadge>
            {canEdit && <button className="button-secondary" type="button" onClick={() => setEditing(true)}>Editar cadastro</button>}
          </div>

          <section aria-labelledby="party-contact-title">
            <h3 id="party-contact-title">Contato e localização</h3>
            <dl className="party-detail__facts">
              <div><dt>Contato</dt><dd>{party.contact ?? "Não informado"}</dd></div>
              <div><dt>Telefone</dt><dd>{party.phone ?? "Não informado"}</dd></div>
              <div><dt>E-mail</dt><dd>{party.email ?? "Não informado"}</dd></div>
              <div><dt>Cidade</dt><dd>{party.city ?? "Não informada"}</dd></div>
              <div><dt>Estado</dt><dd>{party.state ?? "Não informado"}</dd></div>
              <div><dt>Região</dt><dd>{party.region ?? "Não informada"}</dd></div>
              <div><dt>Condições usuais</dt><dd>{party.usualPaymentTerms ?? "Não informadas"}</dd></div>
              {party.kind === "supplier" && <div><dt>Comissão</dt><dd>{party.commissionRate === undefined ? "Não informada" : percentage.format(party.commissionRate)}</dd></div>}
              {party.kind === "supplier" && <div><dt>Desconto à vista</dt><dd>{party.cashDiscountRate === undefined ? "Não informado" : percentage.format(party.cashDiscountRate)}</dd></div>}
            </dl>
          </section>

          <section aria-labelledby="party-orders-title">
            <h3 id="party-orders-title">Histórico de pedidos</h3>
            {relatedOrders.length ? <ul className="party-detail__list">{relatedOrders.slice(0, 5).map((order) => <li key={order.id}><strong>{order.orderNumber ?? "Orçamento"}</strong><span>{party.kind === "client" ? order.supplierName : order.clientName}</span><StatusBadge tone={orderStatusTone(order.status)}>{orderStatusLabels[order.status]}</StatusBadge></li>)}</ul> : <p>Nenhum pedido relacionado.</p>}
          </section>

          <section aria-labelledby="party-finance-title">
            <h3 id="party-finance-title">Resumo financeiro</h3>
            <dl className="party-detail__facts">
              <div><dt>Valor comercial líquido</dt><dd>{currency.format(commercialTotal)}</dd></div>
              <div><dt>{expectedLabel}</dt><dd>{currency.format(expectedTotal)}</dd></div>
              <div><dt>{paidLabel}</dt><dd>{currency.format(paidTotal)}</dd></div>
              <div><dt>{differenceLabel}</dt><dd>{currency.format(paidTotal - expectedTotal)}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </Drawer>
  );
}
