import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

vi.mock("../../auth/AuthContext", () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

beforeEach(() => {
  mockSignIn.mockClear();
});

it("enters the app with the selected demo profile", async () => {
  const user = userEvent.setup();
  render(<LoginPage />);

  await user.click(
    screen.getByRole("button", { name: /entrar como comercial/i }),
  );

  expect(mockSignIn).toHaveBeenCalledWith("commercial");
});

it("offers all three explicit demo profiles", () => {
  render(<LoginPage />);

  expect(screen.getByRole("button", { name: /entrar como administrador/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /entrar como comercial/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /entrar como financeiro/i })).toBeInTheDocument();
});
