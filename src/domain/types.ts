export type ISODate = `${number}-${number}-${number}`;

export type Role = "admin" | "commercial" | "finance";

export type OrderStatus =
  | "draft"
  | "quote"
  | "awaiting-stock"
  | "quote-sent"
  | "awaiting-supplier"
  | "awaiting-client"
  | "confirmed"
  | "preparing"
  | "shipment-informed"
  | "in-transit"
  | "delivered"
  | "incident"
  | "completed"
  | "cancelled";

export type FinancialStatus =
  | "receivable"
  | "payable"
  | "due-soon"
  | "overdue"
  | "partially-paid"
  | "paid"
  | "under-review"
  | "difference"
  | "overpaid"
  | "settled";

export type IncidentStatus =
  | "open"
  | "in-progress"
  | "awaiting-supplier"
  | "resolved";

export type PostalStatus =
  | "prepared"
  | "posted"
  | "in-transit"
  | "delivered"
  | "returned";

export type SettlementStatus = "draft" | "under-review" | "settled";
export type PartyKind = "client" | "supplier";
export type PaymentMethod = "pix" | "check" | "boleto" | "deposit" | "direct";
export type PaymentRecipient = "supplier" | "client" | "driver" | "representative";
export type IncidentType = "missing-item" | "wrong-product" | "other";
export type IncidentPriority = "low" | "medium" | "high";

export interface MoneyInput {
  merchandise: number;
  freight: number;
  surplus: number;
  shortage: number;
}

export interface Party {
  id: string;
  kind: PartyKind;
  name: string;
  document?: string;
  contact?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  region?: string;
  usualPaymentTerms?: string;
  commissionRate?: number;
  cashDiscountRate?: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  description: string;
  category?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  stockConfirmed?: boolean;
  leadTime?: string;
  notes?: string;
}

export interface CommercialValues extends MoneyInput {
  tax: number;
  discounts: number;
  receiptsOrExtras: number;
  net: number;
  cashPrice?: number;
  termPrice?: number;
  cashDiscountRate?: number;
  cashDiscount?: number;
  commissionRate?: number;
  commission?: number;
  afterCommission?: number;
}

export interface ConfirmationTimestamps {
  sentToSupplierAt?: ISODate;
  supplierConfirmedAt?: ISODate;
  copySentToClientAt?: ISODate;
  clientConfirmedAt?: ISODate;
  updateSentToSupplierAt?: ISODate;
  supplierUpdateConfirmedAt?: ISODate;
  updateCopySentToClientAt?: ISODate;
  clientUpdateConfirmedAt?: ISODate;
}

export interface CommunicationEvent {
  id: string;
  date: ISODate;
  channel: string;
  description: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  shippedAt?: ISODate;
  loadReport?: string;
  noteNumber?: string;
  invoiceNumber?: string;
  salesGuide?: string;
  driverName?: string;
  route?: string;
  expectedDeliveryAt?: ISODate;
  deliveredAt?: ISODate;
  unloadingConfirmed?: boolean;
  materialCheck?: "pending" | "matched" | "divergent";
  driverPaymentMethod?: PaymentMethod;
  driverReceipt?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  representativeNumber?: string;
  oguraNumber?: string;
  lrReference?: string;
  clientId: string;
  clientName: string;
  supplierId: string;
  supplierName: string;
  ownerId?: string;
  ownerName?: string;
  orderedAt?: ISODate;
  city?: string;
  state?: string;
  region?: string;
  contact?: string;
  email?: string;
  paymentTerms: string;
  notes?: string;
  status: OrderStatus;
  financialStatus?: FinancialStatus;
  confirmations?: ConfirmationTimestamps;
  communications?: CommunicationEvent[];
  items: OrderItem[];
  values?: CommercialValues;
  shipment?: Shipment;
  installmentIds?: string[];
  paymentIds?: string[];
  checkIds?: string[];
  postalShipmentIds?: string[];
  incidentIds?: string[];
  settlementId?: string;
}

export interface Installment {
  id: string;
  orderId: string;
  sequence: number;
  totalInstallments: number;
  dueAt: ISODate;
  recipient: PaymentRecipient;
  recipientName?: string;
  expectedAmount: number;
  paidAt?: ISODate;
  actualAmount?: number;
  method?: PaymentMethod;
  operation?: string;
  bank?: string;
  branch?: string;
  account?: string;
  status: FinancialStatus;
  difference?: number;
  notes?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  installmentId?: string;
  paidAt: ISODate;
  amount: number;
  expectedAmount?: number;
  difference?: number;
  method: PaymentMethod;
  recipient: PaymentRecipient;
  recipientName?: string;
  operation?: string;
  bank?: string;
  branch?: string;
  account?: string;
  checkId?: string;
  notes?: string;
}

export interface Check {
  id: string;
  orderId: string;
  number: string;
  owner: string;
  clientName: string;
  supplierName: string;
  amount: number;
  goodForAt: ISODate;
  recipient: string;
  responsible: string;
  usage?: string;
  status: FinancialStatus;
  postalShipmentId?: string;
}

export interface PostalShipment {
  id: string;
  orderId?: string;
  checkIds: string[];
  recipient?: string;
  city?: string;
  state?: string;
  carrier: string;
  service?: string;
  postalCode?: string;
  trackingCode: string;
  cost?: number;
  invoice?: string;
  postedAt?: ISODate;
  expectedDeliveryAt?: ISODate;
  deliveredAt?: ISODate;
  status: PostalStatus;
  paidAmount?: number;
  receivableAmount?: number;
  difference?: number;
  paymentBy?: string;
  responsible?: string;
  notes?: string;
}

export interface IncidentEvent {
  id: string;
  date: ISODate;
  description: string;
}

export interface Incident {
  id: string;
  orderId: string;
  shipmentId?: string;
  clientName: string;
  supplierName: string;
  title: string;
  description: string;
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  owner?: string;
  openedAt: ISODate;
  resolvedAt?: ISODate;
  timeline: IncidentEvent[];
}

export interface SettlementEntry extends MoneyInput {
  orderId: string;
  clientName: string;
  tax: number;
  net: number;
  discountRate: number;
  discount: number;
  commissionRate: number;
  commission: number;
  payable: number;
}

export interface Settlement {
  id: string;
  supplierId: string;
  supplierName: string;
  period: `${number}-${number}`;
  orderIds: string[];
  entries: SettlementEntry[];
  reportTotal: number;
  payments: number;
  extras: number;
  balance: number;
  status: SettlementStatus;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}
