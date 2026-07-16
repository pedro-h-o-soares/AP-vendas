import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function AuthProbe() {
  const { user, signIn, signOut } = useAuth();

  return (
    <div>
      <span>{user ? `${user.name}:${user.role}` : "sem sessão"}</span>
      <button onClick={() => signIn("finance")} type="button">Entrar</button>
      <button onClick={signOut} type="button">Sair</button>
    </div>
  );
}

it("starts signed out and selects a demo user by role", async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

  expect(screen.getByText("sem sessão")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  expect(screen.getByText(/financeiro:finance/i)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Sair" }));
  expect(screen.getByText("sem sessão")).toBeInTheDocument();
});
