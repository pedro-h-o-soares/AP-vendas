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

  it("records every delivery invariant and the integrated order timeline", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const order = result.current.orders.find(({ shipments }) => shipments?.length)!;
    const firstShipmentId = order.shipments![0]!.id;

    act(() => {
      expect(result.current.recordDelivery(firstShipmentId, "2026-07-16")).toMatchObject({
        deliveredAt: "2026-07-16",
        unloadingConfirmed: true,
        materialCheck: "matched",
      });
    });

    expect(result.current.orders.find(({ id }) => id === order.id)).toMatchObject({
      status: "delivered",
      shipments: [expect.objectContaining({
        deliveredAt: "2026-07-16",
        unloadingConfirmed: true,
        materialCheck: "matched",
      })],
    });
    expect(result.current.orderTimelineEvents).toContainEqual(expect.objectContaining({
      orderId: order.id,
      date: "2026-07-16",
      title: "Entrega confirmada",
    }));
  });

  it("does not duplicate the delivery event when a shipment is confirmed twice", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const order = result.current.orders.find(({ shipments }) => shipments?.length)!;
    const shipmentId = order.shipments![0]!.id;

    act(() => {
      result.current.recordDelivery(shipmentId, "2026-07-16");
      result.current.recordDelivery(shipmentId, "2026-07-16");
    });

    expect(result.current.orderTimelineEvents.filter((event) =>
      event.orderId === order.id && event.title === "Entrega confirmada",
    )).toHaveLength(1);
  });

  it("links incident timelines without removing the shipment phase evidence", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const order = result.current.orders.find(({ shipments }) => shipments?.length)!;
    const firstShipmentId = order.shipments![0]!.id;
    const firstShippedAt = order.shipments![0]!.shippedAt;
    let incidentId = "";

    act(() => {
      const incident = result.current.createIncident({
        orderId: order.id,
        shipmentId: firstShipmentId,
        clientName: order.clientName,
        supplierName: order.supplierName,
        title: "Produto incorreto",
        description: "Produto recebido não corresponde ao pedido",
        type: "wrong-product",
      });
      incidentId = incident.id;
      expect(incident).toMatchObject({ status: "open" });
      expect(incident.timeline).toContainEqual(expect.objectContaining({ description: "Ocorrência registrada" }));
    });

    expect(result.current.orders.find(({ id }) => id === order.id)).toMatchObject({
      status: "incident",
      incidentIds: expect.arrayContaining([incidentId]),
      shipments: [expect.objectContaining({ id: firstShipmentId, shippedAt: firstShippedAt })],
    });
    expect(result.current.orderTimelineEvents).toContainEqual(expect.objectContaining({
      orderId: order.id,
      title: "Ocorrência registrada",
      detail: "Produto incorreto",
    }));

    act(() => {
      expect(result.current.contactIncidentSupplier(incidentId)).toMatchObject({
        status: "awaiting-supplier",
      });
    });

    expect(result.current.incidents.find(({ id }) => id === incidentId)?.timeline).toContainEqual(
      expect.objectContaining({ description: "Fornecedor acionado" }),
    );
    expect(result.current.orderTimelineEvents).toContainEqual(expect.objectContaining({
      orderId: order.id,
      title: "Fornecedor acionado",
    }));
  });

  it("keeps only one incident linked to each shipment", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const order = result.current.orders.find(({ shipments }) => shipments?.length)!;
    const shipmentId = order.shipments![0]!.id;
    let incidentId = "";

    act(() => {
      const first = result.current.createIncident({
        orderId: order.id,
        shipmentId,
        clientName: order.clientName,
        supplierName: order.supplierName,
        title: "Item faltante",
        description: "Faltaram duas peças",
        type: "missing-item",
      });
      incidentId = first.id;
      const second = result.current.createIncident({
        orderId: order.id,
        shipmentId,
        clientName: order.clientName,
        supplierName: order.supplierName,
        title: "Produto incorreto",
        description: "Produto recebido não corresponde ao pedido",
        type: "wrong-product",
      });
      expect(second.id).toBe(incidentId);
    });

    expect(result.current.incidents.filter((incident) => incident.shipmentId === shipmentId)).toHaveLength(1);
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

  it("preserva a postagem original quando tentam vincular o mesmo cheque novamente", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const check = result.current.checks[0];
    let originalPostalId = "";

    act(() => {
      originalPostalId = result.current.createPostalShipment({
        orderId: check.orderId,
        carrier: "Correios",
        service: "PAC",
        trackingCode: "OG000000101BR",
        status: "prepared",
        checkIds: [check.id],
      }).id;
    });

    expect(() => {
      act(() => {
        result.current.createPostalShipment({
          orderId: check.orderId,
          carrier: "Correios",
          service: "SEDEX",
          trackingCode: "OG000000102BR",
          status: "prepared",
          checkIds: [check.id],
        });
      });
    }).toThrow(/cheque já vinculado/i);
    expect(result.current.checks.find(({ id }) => id === check.id)?.postalShipmentId).toBe(originalPostalId);
    expect(result.current.postalShipments.filter(({ checkIds }) => checkIds.includes(check.id))).toHaveLength(1);
  });

  it("reserva o cheque atomicamente contra duas criações síncronas", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const check = result.current.checks[0];
    let postalId = "";

    act(() => {
      postalId = result.current.createPostalShipment({
        orderId: check.orderId,
        carrier: "Correios",
        service: "PAC",
        trackingCode: "OG000000201BR",
        status: "prepared",
        checkIds: [check.id],
      }).id;
      expect(() => result.current.createPostalShipment({
        orderId: check.orderId,
        carrier: "Correios",
        service: "SEDEX",
        trackingCode: "OG000000202BR",
        status: "prepared",
        checkIds: [check.id],
      })).toThrow(/cheque já vinculado/i);
    });

    const changedCheck = result.current.checks.find(({ id }) => id === check.id)!;
    const changedOrder = result.current.orders.find(({ id }) => id === check.orderId)!;
    expect(result.current.postalShipments.filter(({ checkIds }) => checkIds.includes(check.id))).toEqual([
      expect.objectContaining({ id: postalId, trackingCode: "OG000000201BR" }),
    ]);
    expect(changedCheck.postalShipmentId).toBe(postalId);
    expect(changedOrder.postalShipmentIds).toEqual([postalId]);
  });

  it("updates a party only in the in-memory provider state", () => {
    const { result } = renderHook(() => usePrototypeStore(), { wrapper });
    const party = result.current.parties[0];

    act(() => {
      const changed = result.current.updateParty({
        ...party,
        city: "Vitória",
        phone: "(27) 99999-0000",
      });
      expect(changed).toMatchObject({ id: party.id, city: "Vitória" });
    });

    expect(result.current.parties.find(({ id }) => id === party.id)).toMatchObject({
      city: "Vitória",
      phone: "(27) 99999-0000",
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
