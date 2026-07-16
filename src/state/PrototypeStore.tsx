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
import type {
  Check,
  Incident,
  Installment,
  Order,
  OrderItem,
  OrderStatus,
  Party,
  Payment,
  PostalShipment,
  Settlement,
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
type PostalShipmentInput = Omit<PostalShipment, "id">;

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
  createQuote: (input: QuoteInput) => Order;
  convertQuoteToOrder: (quoteId: string, orderNumber: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Order;
  createIncident: (input: IncidentInput) => Incident;
  recordPayment: (input: PaymentInput) => Payment;
  createPostalShipment: (input: PostalShipmentInput) => PostalShipment;
  resetDemo: () => void;
}

const PrototypeStoreContext = createContext<PrototypeStore | null>(null);

const replaceOrder = (orders: Order[], changed: Order): Order[] =>
  orders.map((order) => (order.id === changed.id ? changed : order));

export function PrototypeStoreProvider({ children }: PropsWithChildren) {
  const sequence = useRef(0);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [incidents, setIncidents] = useState<Incident[]>(sampleIncidents);
  const [payments, setPayments] = useState<Payment[]>(samplePayments);
  const [postalShipments, setPostalShipments] = useState<PostalShipment[]>(
    samplePostalShipments,
  );

  const findOrder = (orderId: string): Order => {
    const order = orders.find((candidate) => candidate.id === orderId);
    if (!order) throw new Error(`Order not found: ${orderId}`);
    return order;
  };

  const nextId = (prefix: string): string => `${prefix}-${++sequence.current}`;

  const createQuote = (input: QuoteInput): Order => {
    const quote: Order = {
      ...input,
      id: nextId("quote"),
      status: "quote",
    };
    setOrders((current) => [...current, quote]);
    return quote;
  };

  const convertQuoteToOrder = (quoteId: string, orderNumber: string): Order => {
    const changed: Order = {
      ...findOrder(quoteId),
      orderNumber,
      oguraNumber: orderNumber,
      status: "awaiting-supplier",
    };
    setOrders((current) => replaceOrder(current, changed));
    return changed;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus): Order => {
    const changed = { ...findOrder(orderId), status };
    setOrders((current) => replaceOrder(current, changed));
    return changed;
  };

  const createIncident = (input: IncidentInput): Incident => {
    const incident: Incident = {
      ...input,
      id: nextId("incident"),
      type: input.type ?? "other",
      priority: input.priority ?? "medium",
      status: "open",
      openedAt: new Date().toISOString().slice(0, 10) as Incident["openedAt"],
      timeline: [],
    };
    const order = findOrder(input.orderId);
    const changedOrder: Order = {
      ...order,
      status: "incident",
      incidentIds: [...(order.incidentIds ?? []), incident.id],
    };
    setIncidents((current) => [...current, incident]);
    setOrders((current) => replaceOrder(current, changedOrder));
    return incident;
  };

  const recordPayment = (input: PaymentInput): Payment => {
    const payment = { ...input, id: nextId("payment") };
    findOrder(input.orderId);
    setPayments((current) => [...current, payment]);
    return payment;
  };

  const createPostalShipment = (input: PostalShipmentInput): PostalShipment => {
    const shipment = { ...input, id: nextId("postal") };
    findOrder(input.orderId);
    setPostalShipments((current) => [...current, shipment]);
    return shipment;
  };

  const resetDemo = () => {
    sequence.current = 0;
    setOrders(sampleOrders);
    setIncidents(sampleIncidents);
    setPayments(samplePayments);
    setPostalShipments(samplePostalShipments);
  };

  return (
    <PrototypeStoreContext.Provider
      value={{
        orders,
        parties: sampleParties,
        incidents,
        installments: sampleInstallments,
        payments,
        checks: sampleChecks,
        postalShipments,
        settlements: sampleSettlements,
        users: sampleUsers,
        createQuote,
        convertQuoteToOrder,
        updateOrderStatus,
        createIncident,
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
