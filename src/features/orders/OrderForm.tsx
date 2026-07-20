import { useMemo, useState } from "react";
import { Drawer } from "../../components/Drawer";
import { FormField } from "../../components/FormField";
import type { OrderItem } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
}

export function OrderForm({ open, onClose }: OrderFormProps) {
  const { parties, createOrder } = usePrototypeStore();
  const clients = useMemo(() => parties.filter((party) => party.kind === "client"), [parties]);
  const suppliers = useMemo(() => parties.filter((party) => party.kind === "supplier"), [parties]);
  const [clientId, setClientId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const [clientPaymentTerms, setClientPaymentTerms] = useState("");
  const [clientInstallmentCount, setClientInstallmentCount] = useState(1);
  const [clientInstallmentInterval, setClientInstallmentInterval] = useState(30);
  const [clientFirstDueDays, setClientFirstDueDays] = useState(30);

  const [supplierPaymentType, setSupplierPaymentType] = useState<"cash" | "installments">("cash");
  const [supplierInstallmentCount, setSupplierInstallmentCount] = useState(1);
  const [supplierInstallmentInterval, setSupplierInstallmentInterval] = useState(30);
  const [supplierFirstDueDays, setSupplierFirstDueDays] = useState(30);

  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const reset = () => {
    setClientId("");
    setSupplierId("");
    setClientPaymentTerms("");
    setClientInstallmentCount(1);
    setClientInstallmentInterval(30);
    setClientFirstDueDays(30);
    setSupplierPaymentType("cash");
    setSupplierInstallmentCount(1);
    setSupplierInstallmentInterval(30);
    setSupplierFirstDueDays(30);
    setDescription("");
    setQuantity(1);
    setUnitPrice(0);
    setItems([]);
    setErrors([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const addItem = () => {
    if (!description.trim() || quantity <= 0 || unitPrice <= 0) {
      setErrors(["Informe a descrição, quantidade e preço unitário válidos."]);
      return;
    }
    setItems((current) => [
      ...current,
      {
        id: `order-item-${current.length + 1}`,
        description: description.trim(),
        unit: "un",
        quantity,
        unitPrice,
        total: quantity * unitPrice,
      },
    ]);
    setDescription("");
    setQuantity(1);
    setUnitPrice(0);
    setErrors([]);
  };

  const submit = () => {
    const nextErrors: string[] = [];
    if (!clientId) nextErrors.push("Selecione um cliente.");
    if (!supplierId) nextErrors.push("Selecione um fornecedor.");
    if (items.length === 0) nextErrors.push("Adicione pelo menos um item.");
    if (!clientPaymentTerms.trim()) nextErrors.push("Informe as condições de pagamento do cliente.");
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }
    const client = clients.find((party) => party.id === clientId)!;
    const supplier = suppliers.find((party) => party.id === supplierId)!;
    const selectedSupplier = parties.find((party) => party.id === supplierId);
    createOrder({
      clientId: client.id,
      clientName: client.name,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      paymentTerms: clientPaymentTerms,
      installmentConfig: { count: clientInstallmentCount, intervalDays: clientInstallmentInterval, firstDueDays: clientFirstDueDays },
      supplierPaymentConfig: supplierPaymentType === "cash"
        ? { type: "cash" }
        : { type: "installments", count: supplierInstallmentCount, intervalDays: supplierInstallmentInterval, firstDueDays: supplierFirstDueDays },
    });
    close();
  };

  return (
    <Drawer title="Novo pedido" open={open} onClose={close}>
      <div className="order-form">
        <FormField label="Cliente" error={errors.find((e) => e.includes("cliente"))}>
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Selecione</option>
            {clients.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
          </select>
        </FormField>
        <FormField label="Fornecedor" error={errors.find((e) => e.includes("fornecedor"))}>
          <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
            <option value="">Selecione</option>
            {suppliers.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
          </select>
        </FormField>
        <FormField label="Descrição do item">
          <input value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        <FormField label="Quantidade">
          <input min="1" type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </FormField>
        <FormField label="Preço unitário">
          <input min="0" step="0.01" type="number" value={unitPrice || ""} onChange={(event) => setUnitPrice(Number(event.target.value))} />
        </FormField>
        <div className="order-form__actions">
          <button type="button" className="button-secondary" onClick={addItem}>Adicionar item</button>
        </div>
        {items.length > 0 && (
          <ul className="order-form__items">
            {items.map((item) => <li key={item.id}>{item.description} · {item.quantity} {item.unit} · {item.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</li>)}
          </ul>
        )}
        <fieldset className="order-form__section"><legend>Condições do cliente (a receber)</legend>
          <FormField label="Condição de pagamento">
            <input value={clientPaymentTerms} onChange={(event) => setClientPaymentTerms(event.target.value)} placeholder="Ex: 30/45/60 dias" />
          </FormField>
          <FormField label="Número de parcelas">
            <input min="1" type="number" value={clientInstallmentCount} onChange={(event) => setClientInstallmentCount(Number(event.target.value))} />
          </FormField>
          <FormField label="Intervalo entre parcelas (dias)">
            <input min="1" type="number" value={clientInstallmentInterval} onChange={(event) => setClientInstallmentInterval(Number(event.target.value))} />
          </FormField>
          <FormField label="Primeiro vencimento (dias)">
            <input min="1" type="number" value={clientFirstDueDays} onChange={(event) => setClientFirstDueDays(Number(event.target.value))} />
          </FormField>
        </fieldset>
        <fieldset className="order-form__section"><legend>Condições do fornecedor (a pagar)</legend>
          <FormField label="Tipo de pagamento">
            <select value={supplierPaymentType} onChange={(event) => setSupplierPaymentType(event.target.value as "cash" | "installments")}>
              <option value="cash">À vista (com desconto do fornecedor)</option>
              <option value="installments">Parcelado</option>
            </select>
          </FormField>
          {supplierPaymentType === "installments" && <>
            <FormField label="Número de parcelas">
              <input min="1" type="number" value={supplierInstallmentCount} onChange={(event) => setSupplierInstallmentCount(Number(event.target.value))} />
            </FormField>
            <FormField label="Intervalo entre parcelas (dias)">
              <input min="1" type="number" value={supplierInstallmentInterval} onChange={(event) => setSupplierInstallmentInterval(Number(event.target.value))} />
            </FormField>
            <FormField label="Primeiro vencimento (dias)">
              <input min="1" type="number" value={supplierFirstDueDays} onChange={(event) => setSupplierFirstDueDays(Number(event.target.value))} />
            </FormField>
          </>}
          {supplierPaymentType === "cash" && <p className="form-help">O valor será calculado com base no desconto cadastrado para o fornecedor ({parties.find((p) => p.id === supplierId)?.cashDiscountRate != null ? `${(parties.find((p) => p.id === supplierId)!.cashDiscountRate! * 100).toFixed(1)}%` : "nenhum desconto cadastrado"}).</p>}
        </fieldset>
        {errors.length > 0 && <div className="form-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
        <div className="order-form__submit">
          <button className="button-primary" type="button" onClick={submit}>Criar pedido</button>
        </div>
      </div>
    </Drawer>
  );
}
