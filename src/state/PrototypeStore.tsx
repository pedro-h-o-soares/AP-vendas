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
  FinancialStatus,
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
  PostalStatus,
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

export interface CollectionContact {
  id: string;
  installmentId: string;
  date: ISODate;
  note: string;
}

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
  collectionContacts: CollectionContact[];
  updateParty: (party: Party) => Party;
  createQuote: (input: QuoteInput) => Order;
  convertQuoteToOrder: (quoteId: string, orderNumber: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Order;
  appendOrderTimelineEvent: (input: Omit<OrderTimelineEvent, "id">) => OrderTimelineEvent;
  recordDelivery: (shipmentId: string, deliveredAt: ISODate) => Shipment;
  createIncident: (input: IncidentInput) => Incident;
  contactIncidentSupplier: (incidentId: string) => Incident;
  recordPayment: (input: PaymentInput) => Payment;
  recordCollectionContact: (installmentId: string, note: string) => CollectionContact;
  createPostalShipment: (input: PostalShipmentInput) => PostalShipment;
  updateCheckStatus: (checkId: string, status: FinancialStatus) => Check;
  updatePostalShipmentStatus: (shipmentId: string, status: PostalStatus, deliveredAt?: ISODate) => PostalShipment;
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
  collectionContacts: CollectionContact[];
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
    collectionContacts: [],
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
    const currentInstallment = input.installmentId
      ? demo.installments.find(({ id }) => id === input.installmentId)
      : undefined;
    if (currentInstallment && ["paid", "overpaid", "settled"].includes(currentInstallment.status)) {
      throw new Error(`Installment already settled: ${currentInstallment.id}`);
    }
    const payment = clone({ ...input, id: nextId("payment") });
    findOrder(input.orderId);
    setDemo((current) => {
      const installments = current.installments.map((installment) => {
        if (installment.id !== input.installmentId) return installment;
        const actualAmount = (installment.actualAmount ?? 0) + input.amount;
        const difference = actualAmount - installment.expectedAmount;
        const status: FinancialStatus = difference > 0 ? "overpaid" : difference < 0 ? "partially-paid" : "paid";
        return {
          ...installment,
          paidAt: input.paidAt,
          actualAmount,
          method: input.method,
          operation: input.operation,
          bank: input.bank,
          branch: input.branch,
          account: input.account,
          difference,
          status,
          notes: input.notes,
        };
      });
      const order = current.orders.find(({ id }) => id === input.orderId)!;
      const orderInstallments = installments.filter(({ orderId }) => orderId === input.orderId);
      let financialStatus = order.financialStatus;
      if (orderInstallments.length > 0) {
        const expectedInstallments = Math.max(...orderInstallments.map(({ totalInstallments }) => totalInstallments));
        const allSettled = orderInstallments.length >= expectedInstallments
          && orderInstallments.every(({ status }) => ["paid", "overpaid", "settled"].includes(status));
        const somePaid = orderInstallments.some(({ actualAmount, status }) => Boolean(actualAmount) || status === "partially-paid");
        financialStatus = allSettled
          ? orderInstallments.some(({ status }) => status === "overpaid") ? "overpaid" : "paid"
          : somePaid ? "partially-paid"
          : orderInstallments.some(({ status }) => status === "overdue") ? "overdue" : order.financialStatus;
      }
      const changedOrder: Order = {
        ...order,
        paymentIds: [...(order.paymentIds ?? []), payment.id],
        financialStatus,
      };
      return {
        ...current,
        payments: [...current.payments, payment],
        installments,
        orders: replaceOrder(current.orders, changedOrder),
      };
    });
    return clone(payment);
  };

  const recordCollectionContact = (installmentId: string, note: string): CollectionContact => {
    const contact = { id: nextId("collection-contact"), installmentId, date: toLocalISODate(), note };
    setDemo((current) => ({
      ...current,
      collectionContacts: [...current.collectionContacts, contact],
    }));
    return clone(contact);
  };

  const createPostalShipment = (input: PostalShipmentInput): PostalShipment => {
    const linkedCheck = demo.checks.find((check) => input.checkIds.includes(check.id) && check.postalShipmentId);
    if (linkedCheck) {
      throw new Error(`Cheque já vinculado à postagem: ${linkedCheck.postalShipmentId}`);
    }
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
      checks: current.checks.map((check) => input.checkIds.includes(check.id) ? { ...check, postalShipmentId: shipment.id } : check),
    }));
    return clone(shipment);
  };

  const updateCheckStatus = (checkId: string, status: FinancialStatus): Check => {
    const currentCheck = demo.checks.find(({ id }) => id === checkId);
    if (!currentCheck) throw new Error(`Check not found: ${checkId}`);
    const changed = { ...currentCheck, status };
    setDemo((current) => ({
      ...current,
      checks: current.checks.map((check) => check.id === checkId ? changed : check),
    }));
    return clone(changed);
  };

  const updatePostalShipmentStatus = (shipmentId: string, status: PostalStatus, deliveredAt?: ISODate): PostalShipment => {
    const currentShipment = demo.postalShipments.find(({ id }) => id === shipmentId);
    if (!currentShipment) throw new Error(`Postal shipment not found: ${shipmentId}`);
    const changed: PostalShipment = {
      ...currentShipment,
      status,
      postedAt: status === "posted" && !currentShipment.postedAt ? toLocalISODate() : currentShipment.postedAt,
      deliveredAt: status === "delivered" ? deliveredAt ?? toLocalISODate() : currentShipment.deliveredAt,
    };
    setDemo((current) => ({
      ...current,
      postalShipments: current.postalShipments.map((shipment) => shipment.id === shipmentId ? changed : shipment),
    }));
    return clone(changed);
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
        recordCollectionContact,
        createPostalShipment,
        updateCheckStatus,
        updatePostalShipmentStatus,
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
