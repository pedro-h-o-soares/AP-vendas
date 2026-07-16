import { useRef, useState, type FormEvent } from "react";
import { FormField } from "../../components/FormField";
import type { Party } from "../../domain/types";

interface PartyFormProps {
  party: Party;
  onSave: (party: Party) => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  contact?: string;
}

const optionalNumber = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  return Number(value) / 100;
};

export function PartyForm({ party, onSave, onCancel }: PartyFormProps) {
  const [draft, setDraft] = useState(party);
  const [errors, setErrors] = useState<FormErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof Party>(field: K, value: Party[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!draft.name.trim()) nextErrors.name = "Informe o nome ou razão social.";
    if (!draft.phone?.trim() && !draft.email?.trim()) {
      nextErrors.contact = "Informe um telefone ou e-mail.";
    }
    setErrors(nextErrors);
    if (nextErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (nextErrors.contact) {
      phoneRef.current?.focus();
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      phone: draft.phone?.trim() || undefined,
      email: draft.email?.trim() || undefined,
    });
  };

  return (
    <form className="party-form" noValidate onSubmit={submit}>
      <FormField label="Nome ou razão social" error={errors.name}>
        <input ref={nameRef} value={draft.name} onChange={(event) => setField("name", event.target.value)} />
      </FormField>
      <FormField label="Contato">
        <input value={draft.contact ?? ""} onChange={(event) => setField("contact", event.target.value)} />
      </FormField>
      <FormField label="Telefone" error={errors.contact}>
        <input ref={phoneRef} type="tel" value={draft.phone ?? ""} onChange={(event) => setField("phone", event.target.value)} />
      </FormField>
      <FormField label="E-mail">
        <input type="email" value={draft.email ?? ""} onChange={(event) => setField("email", event.target.value)} />
      </FormField>
      <FormField label="Cidade">
        <input value={draft.city ?? ""} onChange={(event) => setField("city", event.target.value)} />
      </FormField>
      <FormField label="Estado">
        <input maxLength={2} value={draft.state ?? ""} onChange={(event) => setField("state", event.target.value.toUpperCase())} />
      </FormField>
      <FormField label="Região">
        <input value={draft.region ?? ""} onChange={(event) => setField("region", event.target.value)} />
      </FormField>
      <FormField label="Condições usuais de pagamento">
        <input value={draft.usualPaymentTerms ?? ""} onChange={(event) => setField("usualPaymentTerms", event.target.value)} />
      </FormField>
      {draft.kind === "supplier" && (
        <>
          <FormField label="Comissão (%)">
            <input min="0" max="100" step="0.01" type="number" value={draft.commissionRate === undefined ? "" : draft.commissionRate * 100} onChange={(event) => setField("commissionRate", optionalNumber(event.target.value))} />
          </FormField>
          <FormField label="Desconto à vista (%)">
            <input min="0" max="100" step="0.01" type="number" value={draft.cashDiscountRate === undefined ? "" : draft.cashDiscountRate * 100} onChange={(event) => setField("cashDiscountRate", optionalNumber(event.target.value))} />
          </FormField>
        </>
      )}
      <FormField label="Observações">
        <textarea rows={3} value={draft.notes ?? ""} onChange={(event) => setField("notes", event.target.value)} />
      </FormField>
      <div className="party-form__actions">
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button className="button-primary" type="submit">Salvar alterações</button>
      </div>
    </form>
  );
}
