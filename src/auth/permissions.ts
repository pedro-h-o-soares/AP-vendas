import type { Role } from "../domain/types";

export type Permission =
  | "view-dashboard"
  | "view-orders"
  | "edit-order"
  | "view-logistics"
  | "edit-logistics"
  | "view-finance"
  | "record-payment"
  | "view-checks"
  | "manage-checks"
  | "view-settlements"
  | "manage-settlements"
  | "view-reports"
  | "manage-users";

const permissionsByRole: Record<Role, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    "view-dashboard",
    "view-orders",
    "edit-order",
    "view-logistics",
    "edit-logistics",
    "view-finance",
    "record-payment",
    "view-checks",
    "manage-checks",
    "view-settlements",
    "manage-settlements",
    "view-reports",
    "manage-users",
  ]),
  commercial: new Set<Permission>([
    "view-dashboard",
    "view-orders",
    "edit-order",
    "view-logistics",
    "edit-logistics",
  ]),
  finance: new Set<Permission>([
    "view-dashboard",
    "view-orders",
    "view-finance",
    "record-payment",
    "view-checks",
    "manage-checks",
    "view-settlements",
    "manage-settlements",
    "view-reports",
  ]),
};

export function can(role: Role, permission: Permission): boolean {
  return permissionsByRole[role].has(permission);
}
