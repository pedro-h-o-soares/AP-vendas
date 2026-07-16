import { describe, expect, it } from "vitest";
import {
  sampleIncidents,
  sampleInstallment,
  sampleOrders,
  sampleParties,
  samplePayments,
  samplePostalShipments,
  sampleSettlements,
  sampleShipment,
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
    expect(sampleShipment.shippedAt).toBe("2026-01-24");
  });

  it("assigns the verified clients and suppliers to their correct roles", () => {
    expect(sampleParties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "MADEIRAS BETINI", kind: "client" }),
        expect.objectContaining({ name: "MADEPOL", kind: "supplier" }),
        expect.objectContaining({ name: "SERMAD", kind: "client" }),
        expect.objectContaining({ name: "IMPERIO WOODS", kind: "supplier" }),
      ]),
    );
    expect(sampleOrders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientName: "MADEIRAS BETINI",
          supplierName: "MADEPOL",
        }),
        expect.objectContaining({
          clientName: "SERMAD",
          supplierName: "IMPERIO WOODS",
        }),
      ]),
    );
  });

  it("contains the verified Betini payment dates and destination", () => {
    expect(sampleInstallment).toMatchObject({
      dueAt: "2026-02-09",
      paidAt: "2026-04-16",
      expectedAmount: 6_217.14,
      actualAmount: 11_000,
      method: "deposit",
      recipient: "representative",
      recipientName: "OGURA REP",
    });
    expect(samplePayments).toContainEqual(
      expect.objectContaining({
        paidAt: "2026-04-16",
        amount: 11_000,
        expectedAmount: 6_217.14,
        method: "deposit",
        recipient: "representative",
        recipientName: "OGURA REP",
      }),
    );
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
        payable: 35_315.501,
      }),
    );
    expect(settlement?.balance).toBe(0.004);
  });

  it("uses the real incident description", () => {
    expect(sampleIncidents).toContainEqual(
      expect.objectContaining({
        clientName: "SERMAD",
        supplierName: "IMPERIO WOODS",
        description: "FALTOU MATERIAL",
      }),
    );
  });

  it("contains the verified Correios shipment without invented dates", () => {
    const postal = samplePostalShipments.find(
      (item) => item.trackingCode === "AK199412308BR",
    );

    expect(postal).toMatchObject({
      recipient: "PIGNATON (PEROBAS)",
      city: "Ibiraçu",
      state: "ES",
      service: "Postagem (Ogura) - PAC",
      postalCode: "188 277 41",
      cost: 16.38,
      status: "delivered",
      paymentBy: "OGURA REP",
      responsible: "CLIENTE",
    });
    expect(postal).not.toHaveProperty("postedAt");
    expect(postal).not.toHaveProperty("deliveredAt");
  });
});
