import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import {
  PrototypeStoreProvider,
  usePrototypeStore,
} from "./PrototypeStore";

const wrapper = ({ children }: PropsWithChildren) => (
  <PrototypeStoreProvider>{children}</PrototypeStoreProvider>
);

describe("PrototypeStore", () => {
  it("creates a quote and converts it to an order", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    let quoteId = "";

    act(() => {
      const quote = result.current.createQuote({
        clientId: "party-101-madeiras",
        clientName: "101 COMERCIO DE MADEIRAS LTDA ME",
        supplierId: "party-brasil-flora",
        supplierName: "BRASIL FLORA",
        paymentTerms: "30/45/60/75/90",
        items: [],
      });
      quoteId = quote.id;
      expect(quote.status).toBe("quote");
    });

    act(() => {
      const order = result.current.convertQuoteToOrder(quoteId, "5001");
      expect(order).toMatchObject({
        orderNumber: "5001",
        status: "awaiting-supplier",
      });
    });

    expect(result.current.orders.find((order) => order.id === quoteId)).toMatchObject(
      { orderNumber: "5001", status: "awaiting-supplier" },
    );
  });

  it("updates status and creates an incident linked to the order", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const orderId = result.current.orders[0].id;

    act(() => {
      expect(result.current.updateOrderStatus(orderId, "delivered").status).toBe(
        "delivered",
      );
    });

    act(() => {
      const incident = result.current.createIncident({
        orderId,
        clientName: "SERMAD",
        supplierName: "IMPERIO WOODS",
        title: "Material faltante",
        description: "FALTOU MATERIAL",
      });
      expect(incident).toMatchObject({ orderId, status: "open" });
    });

    expect(result.current.orders.find((order) => order.id === orderId)?.status).toBe(
      "incident",
    );
  });

  it("records payments and postal shipments in memory", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const orderId = result.current.orders[0].id;

    act(() => {
      const payment = result.current.recordPayment({
        orderId,
        paidAt: "2026-07-16",
        amount: 1_000,
        method: "pix",
        recipient: "supplier",
      });
      expect(payment.id).toMatch(/^payment-/);
    });

    act(() => {
      const postal = result.current.createPostalShipment({
        orderId,
        postedAt: "2026-07-16",
        carrier: "Correios",
        trackingCode: "BR-DEMO-001",
        status: "posted",
        checkIds: [],
      });
      expect(postal.id).toMatch(/^postal-/);
    });

    expect(result.current.payments.at(-1)?.amount).toBe(1_000);
    expect(result.current.postalShipments.at(-1)?.trackingCode).toBe("BR-DEMO-001");
    expect(result.current.orders.find((order) => order.id === orderId)).toMatchObject({
      paymentIds: expect.arrayContaining([result.current.payments.at(-1)?.id]),
      postalShipmentIds: expect.arrayContaining([
        result.current.postalShipments.at(-1)?.id,
      ]),
    });
  });

  it("isolates nested demo records between providers and after reset", () => {
    const first = renderHook(() => usePrototypeStore(), { wrapper });
    const second = renderHook(() => usePrototypeStore(), { wrapper });
    const originalClient = second.result.current.orders[0].clientName;

    first.result.current.orders[0].clientName = "ALTERADO";
    first.result.current.orders[0].items.push({
      id: "external-item",
      description: "ALTERADO",
      unit: "un",
      quantity: 1,
      unitPrice: 1,
      total: 1,
    });

    expect(second.result.current.orders[0]).toMatchObject({
      clientName: originalClient,
      items: [],
    });

    act(() => first.result.current.resetDemo());
    expect(first.result.current.orders[0]).toMatchObject({
      clientName: originalClient,
      items: [],
    });
  });

  it("does not expose input or returned item references in stored quotes", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const items = [
      {
        id: "item-1",
        description: "Original",
        unit: "un",
        quantity: 1,
        unitPrice: 10,
        total: 10,
      },
    ];
    let quoteId = "";

    act(() => {
      const quote = result.current.createQuote({
        clientId: "party-101-madeiras",
        clientName: "101 COMERCIO DE MADEIRAS LTDA ME",
        supplierId: "party-brasil-flora",
        supplierName: "BRASIL FLORA",
        paymentTerms: "30 dias",
        items,
      });
      quoteId = quote.id;
      items[0].description = "Alterado na entrada";
      quote.items[0].description = "Alterado no retorno";
    });

    expect(result.current.orders.find((order) => order.id === quoteId)?.items[0]
      .description).toBe("Original");
  });

  it("restores the initial demo state", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const initialOrderCount = result.current.orders.length;

    act(() => {
      result.current.createQuote({
        clientId: "party-madeiras-betini",
        clientName: "MADEIRAS BETINI",
        supplierId: "party-madepol",
        supplierName: "MADEPOL",
        paymentTerms: "30/60/90/120",
        items: [],
      });
    });
    expect(result.current.orders).toHaveLength(initialOrderCount + 1);

    act(() => result.current.resetDemo());

    expect(result.current.orders).toHaveLength(initialOrderCount);
  });
});
