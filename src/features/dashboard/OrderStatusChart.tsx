import type { OrderStatus } from "../../domain/types";

interface OrderStatusChartProps {
  values: Array<{ status: OrderStatus; label: string; count: number }>;
}

const colors = ["#6f58d9", "#4f8ff7", "#f59f3a", "#dc4c64", "#45a68d"];

export function OrderStatusChart({ values }: OrderStatusChartProps) {
  const total = values.reduce((sum, item) => sum + item.count, 0);
  const stops = values.map((item, index) => {
    const previousCount = values
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.count, 0);
    const start = total ? (previousCount / total) * 100 : 0;
    const end = total ? ((previousCount + item.count) / total) * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${end}%`;
  });

  return (
    <figure className="status-chart" aria-labelledby="status-chart-title">
      <figcaption id="status-chart-title">Pedidos por status</figcaption>
      <div className="status-chart__layout">
        <div
          className="status-chart__doughnut"
          role="img"
          aria-label={`${total} pedidos distribuídos por status`}
          style={{ background: `conic-gradient(${stops.join(", ")})` }}
        >
          <strong>{total}</strong>
          <span>pedidos</span>
        </div>
        <ul className="status-chart__legend">
          {values.map((item, index) => (
            <li key={item.status}>
              <span aria-hidden="true" style={{ background: colors[index % colors.length] }} />
              {item.label} <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
