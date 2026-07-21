import type { Key, ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  mobileLabel?: string;
  render: (row: T) => ReactNode;
  align?: "start" | "center" | "end";
}

interface RowAction<T> {
  label: (row: T) => string;
  onClick: (row: T) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => Key;
  emptyMessage: string;
  ariaLabel?: string;
  rowAction?: RowAction<T>;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage,
  ariaLabel,
  rowAction,
  rowActions,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="data-table__empty" role="status">{emptyMessage}</p>;
  }

  return (
    <div className="data-table__scroll">
      <table className="data-table" aria-label={ariaLabel}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" data-align={column.align ?? "start"}>
                {column.header}
              </th>
            ))}
            {(rowAction || rowActions) && <th scope="col" aria-label="Ações" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.mobileLabel ?? (typeof column.header === "string" ? column.header : undefined)}
                  data-align={column.align ?? "start"}
                >
                  {column.render(row)}
                </td>
              ))}
              {(rowAction || rowActions) && (
                <td className="data-table__action">
                  {rowAction && <button type="button" onClick={() => rowAction.onClick(row)}>{rowAction.label(row)}</button>}
                  {rowActions?.(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
