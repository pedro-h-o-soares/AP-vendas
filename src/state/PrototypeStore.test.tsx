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
        clientName: "IMPERIO WOODS",
        supplierName: "SERMAD",
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
  });

  it("restores the initial demo state", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const initialOrderCount = result.current.orders.length;

    act(() => {
      result.current.createQuote({
        clientId: "party-madepol",
        clientName: "MADEPOL",
        supplierId: "party-betini",
        supplierName: "BETINI",
        paymentTerms: "30/60/90/120",
        items: [],
      });
    });
    expect(result.current.orders).toHaveLength(initialOrderCount + 1);

    act(() => result.current.resetDemo());

    expect(result.current.orders).toHaveLength(initialOrderCount);
  });
});
