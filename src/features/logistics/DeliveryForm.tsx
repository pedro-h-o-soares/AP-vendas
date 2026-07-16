import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { can } from "../../auth/permissions";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { toLocalISODate } from "../../domain/localDate";
import type { Shipment } from "../../domain/types";
import { usePrototypeStore } from "../../state/PrototypeStore";

interface DeliveryFormProps {
  shipment: Shipment;
}

export function DeliveryForm({ shipment }: DeliveryFormProps) {
  const { user } = useAuth();
  const { orderTimelineEvents, recordDelivery } = usePrototypeStore();
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const allowed = Boolean(user && can(user.role, "edit-logistics"));
  const deliveryEvent = [...orderTimelineEvents].reverse().find(
    ({ orderId, title }) => orderId === shipment.orderId && title === "Entrega confirmada",
  );

  if (!allowed) {
    return <p className="permission-note">Perfil sem permissão para alterar a entrega.</p>;
  }

  return (
    <section className="delivery-form" aria-labelledby={`delivery-${shipment.id}`}>
      <h3 id={`delivery-${shipment.id}`}>Confirmação de entrega</h3>
      {saved && <p className="session-notice" role="status">Entrega registrada somente nesta sessão.</p>}
      {deliveryEvent && <p><strong>{deliveryEvent.title}</strong> — {deliveryEvent.detail}</p>}
      {!shipment.deliveredAt && (
        <button className="button-primary" type="button" onClick={() => setConfirming(true)}>
          Confirmar entrega
        </button>
      )}
      {shipment.deliveredAt && !deliveryEvent && <p>Entrega registrada em {shipment.deliveredAt}.</p>}
      <ConfirmDialog
        title="Confirmar entrega"
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          recordDelivery(shipment.id, toLocalISODate());
          setConfirming(false);
          setSaved(true);
        }}
        confirmLabel="Confirmar entrega"
      >
        <p>O desembarque e a conferência do material serão registrados somente nesta sessão.</p>
      </ConfirmDialog>
    </section>
  );
}
