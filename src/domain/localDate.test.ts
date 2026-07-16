import { describe, expect, it } from "vitest";
import { toLocalISODate } from "./localDate";

describe("toLocalISODate", () => {
  it("formats the browser-local calendar date with zero padding", () => {
    expect(toLocalISODate(new Date(2026, 0, 2, 23, 45))).toBe("2026-01-02");
  });

  it("uses the injected clock deterministically", () => {
    const now = () => new Date(2026, 10, 9, 0, 5);
    expect(toLocalISODate(now())).toBe("2026-11-09");
  });
});
