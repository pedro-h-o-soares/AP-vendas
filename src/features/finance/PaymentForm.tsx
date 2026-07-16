import { useMemo, useRef, useState, type FormEvent } from "react";
import { can } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { FormField } from "../../components/FormField";
import { calculateDifference } from "../../domain/calculations";
import { toLocalISODate } from "../../domain/localDate";
import type { Installment, PaymentMethod } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const parseMoney = (value: string): number => {
  const normalized = value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const methodOptions: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "check", label: "Cheque" },
  { value: "boleto", label: "Boleto" },
  { value: "deposit", label: "Depósito" },
  { value: "direct", label: "Direto" },
];

export function PaymentForm({ installment }: { installment: Installment }) {
  const { user } = useAuth();
  const { recordPayment } = usePrototypeStore();
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [bank, setBank] = useState("");
  const [branch, setBranch] = useState("");
  const [account, setAccount] = useState("");
  const [operation, setOperation] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [checkOwner, setCheckOwner] = useState("");
  const [goodForAt, setGoodForAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [recordedDifference, setRecordedDifference] = useState<number>();
  const numericAmount = useMemo(() => parseMoney(amount), [amount]);
  const existingAmount = installment.status === "partially-paid" ? installment.actualAmount ?? 0 : 0;
  const difference = calculateDifference(installment.expectedAmount, existingAmount + numericAmount);
  const settled = ["paid", "overpaid", "settled"].includes(installment.status);
  const canRecord = Boolean(user && can(user.role, "record-payment") && !settled);
  const showBank = method === "pix" || method === "boleto" || method === "deposit";
  const bankRequired = method === "deposit";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRecord) return;
    if (numericAmount <= 0) {
      setAmountError("Informe um valor pago válido, por exemplo 11000 ou 11.000,00.");
      amountRef.current?.focus();
      return;
    }
    recordPayment({
      orderId: installment.orderId,
      installmentId: installment.id,
      paidAt: toLocalISODate(),
      amount: numericAmount,
      expectedAmount: installment.expectedAmount,
      difference,
      method,
      recipient: installment.recipient,
      recipientName: installment.recipientName,
      operation: method === "check"
        ? `Cheque ${checkNumber} · ${checkOwner} · bom para ${goodForAt}`
        : operation || undefined,
      bank: showBank ? bank || undefined : undefined,
      branch: showBank ? branch || undefined : undefined,
      account: showBank ? account || undefined : undefined,
      notes: notes || undefined,
    });
    setRecordedDifference(difference);
    setAmount("");
    setSubmitted(true);
  };

  return (
    <form className="payment-form" onSubmit={submit}>
      <h3>Registrar baixa</h3>
      <div className="payment-form__summary">
        <span>Valor previsto</span>
        <strong>{currency.format(installment.expectedAmount)}</strong>
      </div>
      <FormField label="Valor pago" error={amountError}>
        <input
          inputMode="decimal"
          name="amount"
          onChange={(event) => { setAmount(event.target.value); setAmountError(""); setSubmitted(false); }}
          placeholder="0,00"
          required
          ref={amountRef}
          value={amount}
        />
      </FormField>
      <FormField label="Meio de pagamento">
        <select value={method} onChange={(event) => { setMethod(event.target.value as PaymentMethod); setSubmitted(false); }}>
          {methodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </FormField>

      {method === "check" && (
        <div className="payment-form__conditional">
          <FormField label="Número do cheque"><input required value={checkNumber} onChange={(event) => setCheckNumber(event.target.value)} /></FormField>
          <FormField label="Titular do cheque"><input required value={checkOwner} onChange={(event) => setCheckOwner(event.target.value)} /></FormField>
          <FormField label="Bom para"><input required type="date" value={goodForAt} onChange={(event) => setGoodForAt(event.target.value)} /></FormField>
        </div>
      )}

      {showBank && (
        <div className="payment-form__conditional">
          <FormField label="Banco"><input required={bankRequired} value={bank} onChange={(event) => setBank(event.target.value)} /></FormField>
          <FormField label="Agência"><input required={bankRequired} value={branch} onChange={(event) => setBranch(event.target.value)} /></FormField>
          <FormField label="Conta"><input required={bankRequired} value={account} onChange={(event) => setAccount(event.target.value)} /></FormField>
        </div>
      )}

      {(method === "pix" || method === "boleto" || method === "direct") && (
        <FormField label={method === "pix" ? "Chave ou operação PIX" : method === "boleto" ? "Número do boleto" : "Operação direta"}>
          <input value={operation} onChange={(event) => setOperation(event.target.value)} />
        </FormField>
      )}
      <FormField label="Observações"><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></FormField>

      <div className={`payment-difference${(submitted ? recordedDifference ?? difference : difference) < 0 ? " payment-difference--negative" : ""}`} aria-live="polite">
        <span>Diferença</span>
        <strong>{currency.format(submitted ? recordedDifference ?? difference : difference)}</strong>
      </div>
      {canRecord ? <button className="button-primary" type="submit">Registrar baixa</button> : <p className="permission-note">{settled ? "Parcela já liquidada. Nova baixa bloqueada." : "Perfil sem permissão para registrar baixas financeiras."}</p>}
      {submitted && <p className="session-notice" role="status">Baixa registrada somente nesta sessão.</p>}
    </form>
  );
}
