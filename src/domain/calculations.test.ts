import { describe, expect, it } from "vitest";
import {
  calculateCommission,
  calculateDifference,
  calculateDiscount,
  calculateNet,
} from "./calculations";

describe("commercial calculations", () => {
  it("calculates the Santa Rita net amount", () => {
    expect(
      calculateNet({
        merchandise: 44_987,
        freight: 6_700,
        surplus: 0,
        shortage: 108.08,
      }),
    ).toBe(38_178.92);
  });

  it("calculates the Santa Rita cash discount", () => {
    expect(calculateDiscount(38_178.92, 0.025)).toBeCloseTo(954.473, 3);
  });

  it("calculates the Santa Rita commission", () => {
    expect(calculateCommission(38_178.92, 0.05)).toBeCloseTo(1_908.946, 3);
  });

  it("reports a positive difference when the client overpays", () => {
    expect(calculateDifference(6_217.14, 11_000)).toBeCloseTo(4_782.86, 2);
  });
});
