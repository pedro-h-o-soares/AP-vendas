import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import { AuthProvider } from "../auth/AuthContext";
import { AppRoutes, routeTable } from "./routes";

it("declares protected destinations with their permissions", () => {
  expect(routeTable).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: "/dashboard", permission: "view-dashboard" }),
      expect.objectContaining({ path: "/orders", permission: "view-orders" }),
      expect.objectContaining({ path: "/finance", permission: "view-finance" }),
      expect.objectContaining({ path: "/users", permission: "manage-users" }),
    ]),
  );
});

it("redirects protected destinations to login and enters with a demo profile", async () => {
  const user = userEvent.setup();

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/orders"]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );

  expect(screen.getByRole("heading", { name: "Ogura Rep" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /entrar como comercial/i }));
  expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
});
