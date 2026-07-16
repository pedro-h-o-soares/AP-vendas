import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AsyncState } from "./AsyncState";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable, type DataTableColumn } from "./DataTable";
import { Drawer } from "./Drawer";
import { FormField } from "./FormField";

interface ContactRow {
  id: number;
  name: string;
}

const columns: DataTableColumn<ContactRow>[] = [
  { key: "name", header: "Cliente", render: (row) => row.name },
];

describe("DataTable", () => {
  it("renders typed rows and an accessible row action", async () => {
    const onRowAction = vi.fn();
    const user = userEvent.setup();

    render(
      <DataTable
        ariaLabel="Clientes recentes"
        columns={columns}
        rows={[{ id: 1, name: "SERMAD" }]}
        getRowId={(row) => row.id}
        rowAction={{ label: (row) => `Abrir ${row.name}`, onClick: onRowAction }}
        emptyMessage="Nenhum cliente"
      />,
    );

    expect(screen.getByRole("table", { name: "Clientes recentes" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Abrir SERMAD" }));
    expect(onRowAction).toHaveBeenCalledWith(expect.objectContaining({ name: "SERMAD" }));
  });

  it("announces an empty result", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        emptyMessage="Nenhum cliente encontrado"
      />,
    );

    expect(screen.getByText("Nenhum cliente encontrado")).toHaveAttribute("role", "status");
  });
});

it("labels the drawer and returns focus on close", async () => {
  const user = userEvent.setup();

  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Abrir detalhes</button>
        <Drawer title="Detalhes" open={open} onClose={() => setOpen(false)}>
          Conteúdo
        </Drawer>
      </>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Abrir detalhes" });
  await user.click(trigger);
  expect(screen.getByRole("dialog", { name: "Detalhes" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Fechar Detalhes" }));
  expect(trigger).toHaveFocus();
});

it("labels the confirmation dialog and restores focus after cancel", async () => {
  const user = userEvent.setup();

  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Excluir pedido</button>
        <ConfirmDialog
          title="Excluir pedido?"
          open={open}
          onCancel={() => setOpen(false)}
          onConfirm={() => undefined}
        >
          Esta ação não pode ser desfeita.
        </ConfirmDialog>
      </>
    );
  }

  render(<Harness />);
  const trigger = screen.getByRole("button", { name: "Excluir pedido" });
  await user.click(trigger);
  expect(screen.getByRole("alertdialog", { name: "Excluir pedido?" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(trigger).toHaveFocus();
});

it("offers retry for an asynchronous error", async () => {
  const onRetry = vi.fn();
  const user = userEvent.setup();
  render(<AsyncState status="error" error="Não foi possível carregar" onRetry={onRetry} />);

  expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar");
  await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(onRetry).toHaveBeenCalledOnce();
});

it("connects form help and error messages to the field", () => {
  render(
    <FormField label="Cliente" hint="Digite o nome completo" error="Cliente obrigatório">
      <input />
    </FormField>,
  );

  const field = screen.getByRole("textbox", { name: "Cliente" });
  expect(field).toHaveAccessibleDescription("Digite o nome completo Cliente obrigatório");
  expect(field).toHaveAttribute("aria-invalid", "true");
});
