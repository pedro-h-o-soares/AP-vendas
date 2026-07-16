import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AccessDeniedPage } from "../features/auth/AccessDeniedPage";
import { useAuth } from "./AuthContext";
import { can, type Permission } from "./permissions";

export interface ProtectedRouteProps {
  children: ReactNode;
  permission: Permission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!can(user.role, permission)) return <AccessDeniedPage />;

  return children;
}
