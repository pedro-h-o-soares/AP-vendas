import {
  createContext,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import {
  sampleChecks,
  sampleIncidents,
  sampleInstallments,
  sampleOrders,
  sampleParties,
  samplePayments,
  samplePostalShipments,
  sampleSettlements,
  sampleUsers,
} from "../data/sampleData";
import { toLocalISODate } from "../domain/localDate";
import type {
  Check,
  ISODate,
  Incident,
  Installment,
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
  Party,
  Payment,
  PostalShipment,
  Settlement,
  Shipment,
  UserProfile,
} from "../domain/types";

type QuoteInput = Pick<
  Order,
  "clientId" | "clientName" | "supplierId" | "supplierName" | "paymentTerms"
> & {
  items: OrderItem[];
};

type IncidentInput = Pick<
  Incident,
  "orderId" | "clientName" | "supplierName" | "title" | "description"
> &
  Partial<Pick<Incident, "shipmentId" | "type" | "priority" | "owner">>;

type PaymentInput = Omit<Payment, "id">;
type PostalShipmentInput = Omit<PostalShipment, "id" | "orderId"> & {
  orderId: string;
};

export interface PrototypeStore {
  orders: Order[];
  parties: Party[];
  incidents: Incident[];
  installments: Installment[];
  payments: Payment[];
  checks: Check[];
  postalShipments: PostalShipment[];
  settlements: Settlement[];
  users: UserProfile[];
  orderTimelineEvents: OrderTimelineEvent[];
  updateParty: (party: Party) => Party;
  createQuote: (input: QuoteInput) => Order;
  convertQuoteToOrder: (quoteId: string, orderNumber: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Order;
  appendOrderTimelineEvent: (input: Omit<OrderTimelineEvent, "id">) => OrderTimelineEvent;
  recordDelivery: (shipmentId: string, deliveredAt: ISODate) => Shipment;
  createIncident: (input: IncidentInput) => Incident;
  contactIncidentSupplier: (incidentId: string) => Incident;
  recordPayment: (input: PaymentInput) => Payment;
  createPostalShipment: (input: PostalShipmentInput) => PostalShipment;
  resetDemo: () => void;
}

const PrototypeStoreContext = createContext<PrototypeStore | null>(null);

interface DemoState {
  orders: Order[];
  parties: Party[];
  incidents: Incident[];
  installments: Installment[];
  payments: Payment[];
  checks: Check[];
  postalShipments: PostalShipment[];
  settlements: Settlement[];
  users: UserProfile[];
  orderTimelineEvents: OrderTimelineEvent[];
}

const clone = <T,>(value: T): T => structuredClone(value);

const createDemoState = (): DemoState =>
  clone({
    orders: sampleOrders,
    parties: sampleParties,
    incidents: sampleIncidents,
    installments: sampleInstallments,
    payments: samplePayments,
    checks: sampleChecks,
    postalShipments: samplePostalShipments,
    settlements: sampleSettlements,
    users: sampleUsers,
    orderTimelineEvents: [],
  });

const replaceOrder = (orders: Order[], changed: Order): Order[] =>
  orders.map((order) => (order.id === changed.id ? changed : order));

export function PrototypeStoreProvider({ children }: PropsWithChildren) {
  const sequence = useRef(0);
  const [demo, setDemo] = useState<DemoState>(createDemoState);

  const findOrder = (orderId: string): Order => {
    const order = demo.orders.find((candidate) => candidate.id === orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);
    return order;
  };

  const nextId = (prefix: string): string => `${prefix}-${++sequence.current}`;

  const createQuote = (input: QuoteInput): Order => {
    const quote: Order = clone({
      ...clone(input),
      id: nextId("quote"),
      status: "quote",
    });
    setDemo((current) => ({
      ...current,
      orders: [...current.orders, quote],
    }));
    return clone(quote);
  };

  const updateParty = (party: Party): Party => {
    const currentParty = demo.parties.find(({ id }) => id === party.id);
    if (!currentParty) throw new Error(`Party not found: ${party.id}`);
    const changed = clone(party);
    setDemo((current) => ({
      ...current,
      parties: current.parties.map((candidate) =>
        candidate.id === changed.id ? changed : candidate,
      ),
    }));
    return clone(changed);
  };

  const convertQuoteToOrder = (quoteId: string, orderNumber: string): Order => {
    const changed: Order = {
      ...findOrder(quoteId),
      orderNumber,
      oguraNumber: orderNumber,
      status: "awaiting-supplier",
    };
    setDemo((current) => ({
      ...current,
      orders: replaceOrder(current.orders, changed),
    }));
    return clone(changed);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus): Order => {
    const changed = { ...findOrder(orderId), status };
    setDemo((current) => ({
      ...current,
      orders: replaceOrder(current.orders, changed),
    }));
    return clone(changed);
  };

  const appendOrderTimelineEvent = (input: Omit<OrderTimelineEvent, "id">): OrderTimelineEvent => {
    findOrder(input.orderId);
    const event = clone({ ...input, id: nextId("order-event") });
    setDemo((current) => ({
      ...current,
      orderTimelineEvents: [...current.orderTimelineEvents, event],
    }));
    return clone(event);
  };

  const createIncident = (input: IncidentInput): Incident => {
    const openedAt = toLocalISODate();
    const incident: Incident = {
      ...input,
      id: nextId("incident"),
      type: input.type ?? "other",
      priority: input.priority ?? "medium",
      status: "open",
      openedAt,
      timeline: [{ id: nextId("incident-event"), date: openedAt, description: "Ocorrência registrada" }],
    };
    const order = findOrder(input.orderId);
    const changedOrder: Order = {
      ...order,
      status: "incident",
      incidentIds: [...(order.incidentIds ?? []), incident.id],
    };
    const orderEvent: OrderTimelineEvent = {
      id: nextId("order-event"),
      orderId: order.id,
      date: openedAt,
      title: "Ocorrência registrada",
      detail: incident.title,
    };
    setDemo((current) => ({
      ...current,
      incidents: [...current.incidents, incident],
      orders: replaceOrder(current.orders, changedOrder),
      orderTimelineEvents: [...current.orderTimelineEvents, orderEvent],
    }));
    return clone(incident);
  };

  const recordDelivery = (shipmentId: string, deliveredAt: ISODate): Shipment => {
    const order = demo.orders.find(({ shipment }) => shipment?.id === shipmentId);
    if (!order?.shipment) throw new Error(`Shipment not found: ${shipmentId}`);
    const shipment: Shipment = {
      ...order.shipment,
      deliveredAt,
      unloadingConfirmed: true,
      materialCheck: "matched",
    };
    const changedOrder: Order = { ...order, shipment, status: "delivered" };
    const event: OrderTimelineEvent = {
      id: nextId("order-event"),
      orderId: order.id,
      date: deliveredAt,
      title: "Entrega confirmada",
      detail: "Desembarque e conferência do material registrados na sessão.",
    };
    setDemo((current) => ({
      ...current,
      orders: replaceOrder(current.orders, changedOrder),
      orderTimelineEvents: [...current.orderTimelineEvents, event],
    }));
    return clone(shipment);
  };

  const contactIncidentSupplier = (incidentId: string): Incident => {
    const currentIncident = demo.incidents.find(({ id }) => id === incidentId);
    if (!currentIncident) throw new Error(`Incident not found: ${incidentId}`);
    const date = toLocalISODate();
    const incident: Incident = {
      ...currentIncident,
      status: "awaiting-supplier",
      timeline: [
        ...currentIncident.timeline,
        { id: nextId("incident-event"), date, description: "Fornecedor acionado" },
      ],
    };
    const orderEvent: OrderTimelineEvent = {
      id: nextId("order-event"),
      orderId: incident.orderId,
      date,
      title: "Fornecedor acionado",
      detail: incident.title,
    };
    setDemo((current) => ({
      ...current,
      incidents: current.incidents.map((candidate) => candidate.id === incident.id ? incident : candidate),
      orderTimelineEvents: [...current.orderTimelineEvents, orderEvent],
    }));
    return clone(incident);
  };

  const recordPayment = (input: PaymentInput): Payment => {
    const payment = clone({ ...input, id: nextId("payment") });
    const order = findOrder(input.orderId);
    const changedOrder = {
      ...order,
      paymentIds: [...(order.paymentIds ?? []), payment.id],
    };
    setDemo((current) => ({
      ...current,
      payments: [...current.payments, payment],
      orders: replaceOrder(current.orders, changedOrder),
    }));
    return clone(payment);
  };

  const createPostalShipment = (input: PostalShipmentInput): PostalShipment => {
    const shipment = clone({ ...input, id: nextId("postal") });
    const order = findOrder(input.orderId);
    const changedOrder = {
      ...order,
      postalShipmentIds: [...(order.postalShipmentIds ?? []), shipment.id],
    };
    setDemo((current) => ({
      ...current,
      postalShipments: [...current.postalShipments, shipment],
      orders: replaceOrder(current.orders, changedOrder),
    }));
    return clone(shipment);
  };

  const resetDemo = () => {
    sequence.current = 0;
    setDemo(createDemoState());
  };

  return (
    <PrototypeStoreContext.Provider
      value={{
        ...demo,
        createQuote,
        convertQuoteToOrder,
        updateOrderStatus,
        appendOrderTimelineEvent,
        recordDelivery,
        updateParty,
        createIncident,
        contactIncidentSupplier,
        recordPayment,
        createPostalShipment,
        resetDemo,
      }}
    >
      {children}
    </PrototypeStoreContext.Provider>
  );
}

// The provider and its hook intentionally share this small store module.
// eslint-disable-next-line react-refresh/only-export-components
export function usePrototypeStore(): PrototypeStore {
  const store = useContext(PrototypeStoreContext);
  if (!store) {
    throw new Error("usePrototypeStore must be used inside PrototypeStoreProvider");
  }
  return store;
}
