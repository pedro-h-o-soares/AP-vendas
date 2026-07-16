import type { ReactNode } from "react";

interface FilterBarProps {
  children: ReactNode;
  label?: string;
}

export function FilterBar({ children, label = "Filtros" }: FilterBarProps) {
  return <section className="filter-bar" aria-label={label}>{children}</section>;
}
