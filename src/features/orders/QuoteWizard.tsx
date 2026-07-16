import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "../../components/Drawer";
import { FormField } from "../../components/FormField";
import type { Order, OrderItem } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

interface QuoteWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  "Partes",
  "Itens e quantidades",
  "Estoque, preço e prazo",
  "Condições de pagamento",
  "Revisão",
];

export function QuoteWizard({ open, onClose }: QuoteWizardProps) {
  const { parties, createQuote, convertQuoteToOrder, updateOrderStatus } = usePrototypeStore();
  const clients = useMemo(() => parties.filter((party) => party.kind === "client"), [parties]);
  const suppliers = useMemo(() => parties.filter((party) => party.kind === "supplier"), [parties]);
  const [step, setStep] = useState(0);
  const [clientId, setClientId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmedQuote, setConfirmedQuote] = useState<Order>();
  const [notice, setNotice] = useState("");
  const syncedQuoteIds = useRef(new Set<string>());

  useEffect(() => {
    if (!confirmedQuote || confirmedQuote.status !== "confirmed" || syncedQuoteIds.current.has(confirmedQuote.id)) return;
    syncedQuoteIds.current.add(confirmedQuote.id);
    updateOrderStatus(confirmedQuote.id, "confirmed");
  }, [confirmedQuote, updateOrderStatus]);

  const resetWizard = useCallback(() => {
    setStep(0);
    setClientId("");
    setSupplierId("");
    setDescription("");
    setQuantity(1);
    setItems([]);
    setPaymentTerms("");
    setErrors([]);
    setConfirmedQuote(undefined);
    setNotice("");
  }, []);

  const closeWizard = useCallback(() => {
    resetWizard();
    onClose();
  }, [onClose, resetWizard]);

  const continueWizard = () => {
    const nextErrors: string[] = [];
    if (step === 0) {
      if (!clientId) nextErrors.push("Selecione um cliente.");
      if (!supplierId) nextErrors.push("Selecione um fornecedor.");
    }
    if (step === 1 && items.length === 0) nextErrors.push("Adicione pelo menos um item.");
    if (step === 2) {
      if (items.some((item) => !item.stockConfirmed)) nextErrors.push("Confirme o estoque de todos os itens.");
      if (items.some((item) => item.unitPrice <= 0)) nextErrors.push("Informe o preço unitário de todos os itens.");
      if (items.some((item) => !item.leadTime?.trim())) nextErrors.push("Informe o prazo de todos os itens.");
    }
    if (step === 3 && !paymentTerms.trim()) nextErrors.push("Informe as condições de pagamento.");
    setErrors(nextErrors);
    if (nextErrors.length === 0) setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const addItem = () => {
    if (!description.trim() || quantity <= 0) {
      setErrors(["Informe a descrição e uma quantidade válida."]);
      return;
    }
    setItems((current) => [
      ...current,
      {
        id: `quote-item-${current.length + 1}`,
        description: description.trim(),
        unit: "un",
        quantity,
        unitPrice: 0,
        total: 0,
        stockConfirmed: false,
        leadTime: "",
      },
    ]);
    setDescription("");
    setQuantity(1);
    setErrors([]);
  };

  const updateItem = (itemId: string, changes: Partial<OrderItem>) => {
    setItems((current) => current.map((item) => {
      if (item.id !== itemId) return item;
      const changed = { ...item, ...changes };
      return { ...changed, total: changed.quantity * changed.unitPrice };
    }));
  };

  const confirmQuote = () => {
    const client = clients.find((party) => party.id === clientId);
    const supplier = suppliers.find((party) => party.id === supplierId);
    if (!client || !supplier || items.length === 0) return;
    const created = createQuote({
      clientId: client.id,
      clientName: client.name,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      paymentTerms,
    });
    setConfirmedQuote({ ...created, status: "confirmed" });
    setNotice("Orçamento confirmado. Os dados permanecem apenas nesta sessão.");
  };

  const convertQuote = () => {
    if (!confirmedQuote) return;
    const orderNumber = `ORC-${new Date().getFullYear()}-${confirmedQuote.id.split("-").at(-1)}`;
    const order = convertQuoteToOrder(confirmedQuote.id, orderNumber);
    setConfirmedQuote(order);
    setNotice(`Orçamento convertido em pedido ${orderNumber}.`);
  };

  return (
    <Drawer title="Novo orçamento" open={open} onClose={closeWizard}>
      <nav className="wizard-steps" aria-label="Etapas do orçamento">
        {steps.map((label, index) => (
          <span key={label} aria-current={index === step ? "step" : undefined}>{index + 1}. {label}</span>
        ))}
      </nav>

      {notice && <p className="session-notice" role="status">{notice}</p>}
      {errors.length > 0 && step !== 0 && <div className="wizard-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}

      {!confirmedQuote && step === 0 && (
        <div className="wizard-fields">
          <FormField label="Cliente" error={errors.find((error) => error.includes("cliente"))}>
            <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Selecione</option>
              {clients.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
            </select>
          </FormField>
          <FormField label="Fornecedor" error={errors.find((error) => error.includes("fornecedor"))}>
            <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">Selecione</option>
              {suppliers.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
            </select>
          </FormField>
        </div>
      )}

      {!confirmedQuote && step === 1 && (
        <div className="wizard-fields">
          <FormField label="Descrição do item"><input value={description} onChange={(event) => setDescription(event.target.value)} /></FormField>
          <FormField label="Quantidade"><input min="1" type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /></FormField>
          <button type="button" onClick={addItem}>Adicionar item</button>
          <ul>{items.map((item) => <li key={item.id}>{item.description} · {item.quantity} {item.unit}</li>)}</ul>
        </div>
      )}

      {!confirmedQuote && step === 2 && (
        <div className="wizard-fields">
          {items.map((item) => (
            <article className="quote-item-confirmation" key={item.id}>
              <h3>{item.description}</h3>
              <label className="check-field"><input aria-label={`Estoque confirmado — ${item.description}`} type="checkbox" checked={item.stockConfirmed ?? false} onChange={(event) => updateItem(item.id, { stockConfirmed: event.target.checked })} /> Estoque confirmado</label>
              <FormField label={`Preço unitário — ${item.description}`}><input min="0" step="0.01" type="number" value={item.unitPrice || ""} onChange={(event) => updateItem(item.id, { unitPrice: Number(event.target.value) })} /></FormField>
              <FormField label={`Prazo — ${item.description}`}><input value={item.leadTime ?? ""} onChange={(event) => updateItem(item.id, { leadTime: event.target.value })} /></FormField>
            </article>
          ))}
        </div>
      )}

      {!confirmedQuote && step === 3 && (
        <FormField label="Condições de pagamento"><input value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} /></FormField>
      )}

      {!confirmedQuote && step === 4 && (
        <section className="quote-review">
          <h3>Revisão do orçamento</h3>
          <p>{clients.find((party) => party.id === clientId)?.name} → {suppliers.find((party) => party.id === supplierId)?.name}</p>
          <p>{items.length} item(ns) · {paymentTerms}</p>
        </section>
      )}

      <footer className="wizard-actions">
        {!confirmedQuote && step > 0 && <button type="button" onClick={() => { setErrors([]); setStep((current) => current - 1); }}>Voltar</button>}
        {!confirmedQuote && step < 4 && <button className="button-primary" type="button" onClick={continueWizard}>Continuar</button>}
        {!confirmedQuote && step === 4 && <button className="button-primary" type="button" onClick={confirmQuote}>Confirmar orçamento</button>}
        {confirmedQuote?.status === "confirmed" && <button className="button-primary" type="button" onClick={convertQuote}>Converter em pedido</button>}
      </footer>
    </Drawer>
  );
}
