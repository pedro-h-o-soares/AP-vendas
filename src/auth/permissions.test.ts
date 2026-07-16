import { describe, expect, it } from "vitest";
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
  it("allows administrators to use every permission", () => {
    expect(allPermissions.every((permission) => can("admin", permission))).toBe(true);
  });

  it("allows commercial users to edit orders but not record payments", () => {
    expect(can("commercial", "edit-order")).toBe(true);
    expect(can("commercial", "record-payment")).toBe(false);
  });

  it("allows finance users to record payments but not edit orders", () => {
    expect(can("finance", "record-payment")).toBe(true);
    expect(can("finance", "edit-order")).toBe(false);
  });

  it("keeps user management exclusive to administrators", () => {
    expect(can("admin", "manage-users")).toBe(true);
    expect(can("commercial", "manage-users")).toBe(false);
    expect(can("finance", "manage-users")).toBe(false);
  });
});
