import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import type { UserProfile } from "../domain/types";
import { ProtectedRoute } from "./ProtectedRoute";

const auth = vi.hoisted(() => ({
  user: null as UserProfile | null,
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => auth,
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/restrita"]}>
      <Routes>
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route
          path="/restrita"
          element={
            <ProtectedRoute permission="record-payment">
              <p>Conteúdo financeiro</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  auth.user = null;
});

it("redirects unauthenticated users to login", () => {
  renderProtected();
  expect(screen.getByText("Tela de login")).toBeInTheDocument();
});

it("renders access denied when the profile lacks permission", () => {
  auth.user = {
    id: "commercial",
    name: "Comercial",
    email: "commercial@example.com",
    role: "commercial",
    active: true,
  };
  renderProtected();
  expect(screen.getByRole("heading", { name: /acesso negado/i })).toBeInTheDocument();
});

it("renders children when the profile has permission", () => {
  auth.user = {
    id: "finance",
    name: "Financeiro",
    email: "finance@example.com",
    role: "finance",
    active: true,
  };
  renderProtected();
  expect(screen.getByText("Conteúdo financeiro")).toBeInTheDocument();
});
