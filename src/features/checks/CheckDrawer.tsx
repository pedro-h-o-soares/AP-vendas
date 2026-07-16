import { Drawer } from "../../components/Drawer";
import { StatusBadge } from "../../components/StatusBadge";
import type { Check, FinancialStatus } from "../../domain/types";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const statusLabels: Record<FinancialStatus, string> = {
  receivable: "A receber",
  payable: "A pagar",
  "due-soon": "Próximo do vencimento",
  overdue: "Atrasado",
  "partially-paid": "Pago parcialmente",
  paid: "Pago",
  "under-review": "Em conferência",
  difference: "Com diferença",
  overpaid: "Com diferença",
  settled: "Liquidado",
};

interface CheckDrawerProps {
  check: Check;
  onClose?: () => void;
  children?: React.ReactNode;
}

export function CheckDrawer({ check, onClose = () => undefined, children }: CheckDrawerProps) {
  const facts = [
    ["Número", check.number],
    ["Titular", check.owner],
    ["Cliente", check.clientName],
    ["Fornecedor", check.supplierName],
    ["Valor", currency.format(check.amount)],
    ["Bom para", check.goodForAt],
    ["Destinatário", check.recipient],
    ["Responsável", check.responsible],
    ["Forma de uso", check.usage ?? "Não informada"],
  ];

  return (
    <Drawer title={`Cheque ${check.number}`} open onClose={onClose}>
      <div className="check-detail">
        <dl className="check-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          <div>
            <dt>Status</dt>
            <dd><StatusBadge tone="info">{statusLabels[check.status]}</StatusBadge></dd>
          </div>
        </dl>
        {children}
      </div>
    </Drawer>
  );
}
