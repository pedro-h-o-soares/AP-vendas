import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { useAuth } from "../auth/AuthContext";
import type { Permission } from "../auth/permissions";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { OrderDetailPage } from "../features/orders/OrderDetailPage";
import { OrdersPage } from "../features/orders/OrdersPage";
import { AppShell } from "../layout/AppShell";

export interface AppRouteDefinition {
  path: string;
  label: string;
  permission: Permission;
}

// Routes and the declarative table intentionally share this routing module.
// eslint-disable-next-line react-refresh/only-export-components
export const routeTable: AppRouteDefinition[] = [
  { path: "/dashboard", label: "Dashboard", permission: "view-dashboard" },
  { path: "/pedidos", label: "Pedidos", permission: "view-orders" },
  { path: "/logistics", label: "Logística", permission: "view-logistics" },
  { path: "/finance", label: "Financeiro", permission: "view-finance" },
  { path: "/checks", label: "Cheques", permission: "view-checks" },
  { path: "/settlements", label: "Acertos", permission: "view-settlements" },
  { path: "/reports", label: "Relatórios", permission: "view-reports" },
  { path: "/users", label: "Usuários", permission: "manage-users" },
];

function LoginRoute() {
  const { user } = useAuth();
  return user ? <Navigate replace to="/dashboard" /> : <LoginPage />;
}

function PlaceholderPage({ label }: { label: string }) {
  return (
    <section>
      <h1>{label}</h1>
      <p>Protótipo sem gravação permanente</p>
    </section>
  );
}

const pageForRoute = (path: string, label: string) =>
  path === "/dashboard" ? <DashboardPage /> : path === "/pedidos" ? <OrdersPage /> : <PlaceholderPage label={label} />;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      {routeTable.map(({ label, path, permission }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute permission={permission}>
              <AppShell>
                {pageForRoute(path, label)}
              </AppShell>
            </ProtectedRoute>
          }
        />
      ))}
      <Route
        path="/pedidos/:orderId"
        element={
          <ProtectedRoute permission="view-orders">
            <AppShell><OrderDetailPage /></AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="/orders" element={<Navigate replace to="/pedidos" />} />
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  );
}
