import { describe, expect, it } from "vitest";
import type { Role } from "../domain/types";
import { can, type Permission } from "./permissions";

const allPermissions: Permission[] = [
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
];

describe("role permissions", () => {
  const expectedByRole: Record<Role, Permission[]> = {
    admin: allPermissions,
    commercial: [
      "view-dashboard",
      "view-orders",
      "edit-order",
      "view-logistics",
      "edit-logistics",
    ],
    finance: [
      "view-dashboard",
      "view-orders",
      "view-finance",
      "record-payment",
      "view-checks",
      "manage-checks",
      "view-settlements",
      "manage-settlements",
      "view-reports",
    ],
  };

  it.each<Role>(["admin", "commercial", "finance"])(
    "matches the complete %s permission matrix",
    (role) => {
      const actual = allPermissions.filter((permission) => can(role, permission));
      expect(actual).toEqual(expectedByRole[role]);
    },
  );
});
