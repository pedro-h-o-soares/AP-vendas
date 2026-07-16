import { describe, expect, it } from "vitest";
import {
  sampleIncidents,
  sampleOrders,
  sampleSettlements,
} from "./sampleData";

describe("representative sample data", () => {
  it("contains the verified Brasil Flora order", () => {
    const order = sampleOrders.find((item) => item.orderNumber === "3824");

    expect(order).toMatchObject({
      clientName: "101 COMERCIO DE MADEIRAS LTDA ME",
      supplierName: "BRASIL FLORA",
      paymentTerms: "30/45/60/75/90",
      values: {
        merchandise: 8_593.75,
        freight: 938.6,
        tax: 115,
        net: 7_655.15,
      },
      shipment: { invoiceNumber: "1448" },
    });
  });

  it("covers every operational demo scenario", () => {
    expect(sampleOrders.some((order) => order.status === "awaiting-client")).toBe(
      true,
    );
    expect(
      sampleOrders.some((order) => order.status === "shipment-informed"),
    ).toBe(true);
    expect(sampleOrders.some((order) => order.status === "delivered")).toBe(true);
    expect(sampleOrders.some((order) => order.status === "incident")).toBe(true);
    expect(
      sampleOrders.some((order) => order.financialStatus === "overpaid"),
    ).toBe(true);
    expect(
      sampleOrders.some((order) => order.financialStatus === "settled"),
    ).toBe(true);
  });

  it("contains the verified Santa Rita settlement", () => {
    const settlement = sampleSettlements.find(
      (item) => item.id === "settlement-santa-rita-2026-06",
    );

    expect(settlement).toMatchObject({
      period: "2026-06",
      reportTotal: 53_929.63,
      status: "settled",
    });
    expect(settlement?.entries).toContainEqual(
      expect.objectContaining({
        clientName: "SANTA CLARA MAT CONST",
        merchandise: 44_987,
        freight: 6_700,
        shortage: 108.08,
        net: 38_178.92,
        discount: 954.473,
        commission: 1_908.946,
      }),
    );
  });

  it("uses the real incident description", () => {
    expect(sampleIncidents).toContainEqual(
      expect.objectContaining({
        clientName: "IMPERIO WOODS",
        supplierName: "SERMAD",
        description: "FALTOU MATERIAL",
      }),
    );
  });
});
