import { StatusBadge } from "../../components/StatusBadge";

export interface OrderTimelineEvent {
  id: string;
  date: string;
  title: string;
  detail?: string;
}

interface OrderTimelineProps {
  events: OrderTimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  if (events.length === 0) {
    return <p role="status">Nenhum evento registrado para este pedido.</p>;
  }

  return (
    <ol className="order-timeline" aria-label="Histórico do pedido">
      {events.map((event) => (
        <li key={event.id}>
          <StatusBadge tone="info">{event.date}</StatusBadge>
          <div>
            <strong>{event.title}</strong>
            {event.detail && <p>{event.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
