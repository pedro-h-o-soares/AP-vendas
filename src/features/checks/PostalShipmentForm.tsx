import { useMemo, useRef, useState, type FormEvent } from "react";
import { can } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { FormField } from "../../components/FormField";
import { toLocalISODate } from "../../domain/localDate";
import { usePrototypeStore } from "../../state/PrototypeStore";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const parseMoney = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const normalized = value.trim().replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const addLocalDays = (date: Date, days: number) => {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  return toLocalISODate(result);
};

export function PostalShipmentForm({ checkId }: { checkId: string }) {
  const { user } = useAuth();
  const { checks, postalShipments, createPostalShipment } = usePrototypeStore();
  const check = checks.find(({ id }) => id === checkId);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const recipientRef = useRef<HTMLInputElement>(null);
  const [service, setService] = useState("");
  const [recipient, setRecipient] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cost, setCost] = useState("");
  const [invoice, setInvoice] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [receivableAmount, setReceivableAmount] = useState("");
  const [paymentBy, setPaymentBy] = useState("");
  const [responsible, setResponsible] = useState(check?.responsible ?? "OGURA REP");
  const [notes, setNotes] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [recipientError, setRecipientError] = useState("");
  const [submittedDifference, setSubmittedDifference] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const canManage = Boolean(user && can(user.role, "manage-checks"));
  const linkedShipment = check?.postalShipmentId
    ? postalShipments.find(({ id }) => id === check.postalShipmentId)
    : undefined;
  const alreadyLinked = Boolean(check?.postalShipmentId);
  const difference = useMemo(() => {
    const paid = parseMoney(paidAmount);
    const receivable = parseMoney(receivableAmount);
    return paid === undefined || receivable === undefined ? undefined : receivable - paid;
  },
    [paidAmount, receivableAmount],
  );
  const displayedDifference = submitted ? submittedDifference : difference;
  const invalidateFinancialSnapshot = () => {
    setSubmitted(false);
    setSubmittedDifference(undefined);
  };

  if (!check) return <p className="permission-note">Cheque não encontrado.</p>;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage || alreadyLinked) return;
    const nextServiceError = service ? "" : "Selecione o serviço postal.";
    const nextRecipientError = recipient.trim() ? "" : "Informe o destinatário.";
    setServiceError(nextServiceError);
    setRecipientError(nextRecipientError);
    if (nextServiceError || nextRecipientError) {
      if (nextServiceError) serviceRef.current?.focus();
      else recipientRef.current?.focus();
      return;
    }
    const now = new Date();
    const trackingCode = `OG${String(postalShipments.length + 1).padStart(9, "0")}BR`;
    createPostalShipment({
      orderId: check.orderId,
      checkIds: [check.id],
      recipient: recipient.trim(),
      city: city.trim() || undefined,
      state: state || undefined,
      carrier: "Correios",
      service: service === "sedex" ? "SEDEX" : "PAC",
      trackingCode,
      cost: parseMoney(cost),
      invoice: invoice.trim() || undefined,
      postedAt: undefined,
      expectedDeliveryAt: addLocalDays(now, service === "sedex" ? 2 : 5),
      status: "prepared",
      paidAmount: parseMoney(paidAmount),
      receivableAmount: parseMoney(receivableAmount),
      difference,
      paymentBy: paymentBy.trim() || undefined,
      responsible: responsible.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSubmittedDifference(difference);
    setSubmitted(true);
  };

  return (
    <form className="postal-form" onSubmit={submit} noValidate>
      <h3>Simular postagem</h3>
      <div className="postal-form__grid">
        <FormField label="Serviço postal" error={serviceError}>
          <select ref={serviceRef} value={service} onChange={(event) => { setService(event.target.value); setServiceError(""); setSubmitted(false); }} required>
            <option value="">Selecione</option>
            <option value="pac">PAC</option>
            <option value="sedex">SEDEX</option>
          </select>
        </FormField>
        <FormField label="Destinatário" error={recipientError}>
          <input ref={recipientRef} value={recipient} onChange={(event) => { setRecipient(event.target.value); setRecipientError(""); setSubmitted(false); }} required />
        </FormField>
        <FormField label="Cidade"><input value={city} onChange={(event) => setCity(event.target.value)} /></FormField>
        <FormField label="Estado">
          <select value={state} onChange={(event) => setState(event.target.value)}>
            <option value="">Selecione</option>
            {['ES', 'MG', 'PR', 'RJ', 'SC', 'SP'].map((uf) => <option key={uf}>{uf}</option>)}
          </select>
        </FormField>
        <FormField label="Custo da postagem"><input inputMode="decimal" value={cost} onChange={(event) => setCost(event.target.value)} /></FormField>
        <FormField label="Fatura"><input value={invoice} onChange={(event) => setInvoice(event.target.value)} /></FormField>
        <FormField label="Valor pago"><input inputMode="decimal" value={paidAmount} onChange={(event) => { setPaidAmount(event.target.value); invalidateFinancialSnapshot(); }} /></FormField>
        <FormField label="Valor a receber"><input inputMode="decimal" value={receivableAmount} onChange={(event) => { setReceivableAmount(event.target.value); invalidateFinancialSnapshot(); }} /></FormField>
        <FormField label="Pago por"><input value={paymentBy} onChange={(event) => setPaymentBy(event.target.value)} /></FormField>
        <FormField label="Responsável"><input value={responsible} onChange={(event) => setResponsible(event.target.value)} /></FormField>
        <FormField label="Observações"><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></FormField>
      </div>
      <div className="postal-form__difference"><span>Diferença</span><strong>{displayedDifference === undefined ? "—" : currency.format(displayedDifference)}</strong></div>
      {alreadyLinked && <p className="permission-note">Cheque já vinculado à postagem {linkedShipment?.trackingCode ?? check.postalShipmentId}. Nova simulação bloqueada.</p>}
      {canManage ? <button className="button-primary" disabled={alreadyLinked} type="submit">Simular postagem</button> : <p className="permission-note">Perfil sem permissão para simular postagens.</p>}
      {submitted && <p className="session-notice" role="status">Postagem preparada somente nesta sessão.</p>}
    </form>
  );
}
