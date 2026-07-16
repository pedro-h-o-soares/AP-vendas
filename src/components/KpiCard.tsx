import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "default" | "info" | "warning" | "danger";
}

export function KpiCard({ label, value, detail, tone = "default" }: KpiCardProps) {
  return (
    <article className={`kpi-card kpi-card--${tone}`} aria-label={label}>
      <span className="kpi-card__label">{label}</span>
      <strong className="kpi-card__value">{value}</strong>
      {detail && <span className="kpi-card__detail">{detail}</span>}
    </article>
  );
}
