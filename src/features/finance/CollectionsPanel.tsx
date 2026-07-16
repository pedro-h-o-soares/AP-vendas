import { useState, type FormEvent } from "react";
import { toLocalISODate } from "../../domain/localDate";
import { usePrototypeStore } from "../../state/PrototypeStore";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function CollectionsPanel() {
  const { collectionContacts, installments, orders, recordCollectionContact } = usePrototypeStore();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string>();
  const today = toLocalISODate();
  const overdue = installments.filter((installment) =>
    installment.dueAt < today
    && installment.expectedAmount - (installment.actualAmount ?? 0) > 0,
  );

  const submit = (event: FormEvent<HTMLFormElement>, installmentId: string) => {
    event.preventDefault();
    const cleanNote = (notes[installmentId] ?? "").trim();
    if (!cleanNote) return;
    recordCollectionContact(installmentId, cleanNote);
    setNotes((current) => ({ ...current, [installmentId]: "" }));
    setSavedId(installmentId);
  };

  return (
    <section className="collections-panel" aria-labelledby="collections-heading">
      <header className="section-heading">
        <div><span className="page-eyebrow">Carteira vencida</span><h2 id="collections-heading">Cobranças abertas</h2></div>
      </header>
      {overdue.length > 0 ? overdue.map((installment) => {
        const order = orders.find(({ id }) => id === installment.orderId);
        const contacts = collectionContacts.filter(({ installmentId }) => installmentId === installment.id);
        const lastContact = contacts.at(-1);
        return (
          <article
            aria-label={`Cobrança ${order?.clientName ?? "Cliente não informado"} parcela ${installment.sequence}`}
            className="collection-card"
            key={installment.id}
          >
            <div className="collection-card__heading">
              <div><strong>{order?.clientName ?? "Cliente não informado"}</strong><span>Pedido {order?.orderNumber ?? installment.orderId} · {order?.supplierName ?? "Fornecedor não informado"}</span></div>
              <strong>{currency.format(Math.max(0, installment.expectedAmount - (installment.actualAmount ?? 0)))}</strong>
            </div>
            <dl className="finance-facts">
              <div><dt>Último contato</dt><dd>{lastContact?.date ?? "Nenhum contato nesta sessão"}</dd></div>
              <div><dt>Próxima data</dt><dd>A definir · demonstração</dd></div>
              <div><dt>Visita ou coleta</dt><dd>Coleta indicada · demonstração</dd></div>
            </dl>
            <form className="collection-contact" onSubmit={(event) => submit(event, installment.id)}>
              <label>Observação do contato<textarea required rows={3} value={notes[installment.id] ?? ""} onChange={(event) => { setNotes((current) => ({ ...current, [installment.id]: event.target.value })); setSavedId(undefined); }} /></label>
              <button className="button-primary" type="submit">Registrar contato</button>
            </form>
            {savedId === installment.id && <p className="session-notice" role="status">Contato registrado somente nesta sessão.</p>}
            {contacts.length > 0 && (
              <ul className="collection-history" aria-label={`Histórico da cobrança parcela ${installment.sequence}`}>
                {contacts.map((contact) => <li key={contact.id}><time dateTime={contact.date}>{contact.date}</time><span>{contact.note}</span></li>)}
              </ul>
            )}
          </article>
        );
      }) : <p className="data-table__empty" role="status">Nenhuma cobrança atrasada.</p>}
    </section>
  );
}
