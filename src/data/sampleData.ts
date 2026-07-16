import type {
  Check,
  Incident,
  Installment,
  Order,
  Party,
  Payment,
  PostalShipment,
  Settlement,
  Shipment,
  UserProfile,
} from "../domain/types";

export const sampleParties: Party[] = [
  {
    id: "party-101-madeiras",
    kind: "client",
    name: "101 COMERCIO DE MADEIRAS LTDA ME",
    usualPaymentTerms: "30/45/60/75/90",
  },
  { id: "party-brasil-flora", kind: "supplier", name: "BRASIL FLORA" },
  { id: "party-santa-clara", kind: "client", name: "SANTA CLARA MAT CONST" },
  {
    id: "party-santa-rita",
    kind: "supplier",
    name: "SANTA RITA",
    commissionRate: 0.05,
    cashDiscountRate: 0.025,
  },
  { id: "party-madepol", kind: "client", name: "MADEPOL" },
  { id: "party-betini", kind: "supplier", name: "BETINI" },
  { id: "party-imperio-woods", kind: "client", name: "IMPERIO WOODS" },
  { id: "party-sermad", kind: "supplier", name: "SERMAD" },
];

export const sampleShipment: Shipment = {
  id: "shipment-brasil-flora-3824",
  orderId: "order-brasil-flora-3824",
  shippedAt: "2026-06-15",
  invoiceNumber: "1448",
  expectedDeliveryAt: "2026-06-18",
  materialCheck: "pending",
};

export const sampleOrders: Order[] = [
  {
    id: "order-brasil-flora-3824",
    orderNumber: "3824",
    oguraNumber: "3824",
    clientId: "party-101-madeiras",
    clientName: "101 COMERCIO DE MADEIRAS LTDA ME",
    supplierId: "party-brasil-flora",
    supplierName: "BRASIL FLORA",
    paymentTerms: "30/45/60/75/90",
    status: "shipment-informed",
    financialStatus: "receivable",
    items: [],
    values: {
      merchandise: 8_593.75,
      freight: 938.6,
      tax: 115,
      surplus: 0,
      shortage: 0,
      discounts: 0,
      receiptsOrExtras: 0,
      net: 7_655.15,
    },
    shipment: sampleShipment,
  },
  {
    id: "order-santa-clara-2026-06",
    clientId: "party-santa-clara",
    clientName: "SANTA CLARA MAT CONST",
    supplierId: "party-santa-rita",
    supplierName: "SANTA RITA",
    paymentTerms: "À vista",
    status: "awaiting-client",
    financialStatus: "settled",
    items: [],
    values: {
      merchandise: 44_987,
      freight: 6_700,
      tax: 0,
      surplus: 0,
      shortage: 108.08,
      discounts: 954.473,
      receiptsOrExtras: 0,
      net: 38_178.92,
      cashDiscountRate: 0.025,
      cashDiscount: 954.473,
      commissionRate: 0.05,
      commission: 1_908.946,
    },
    settlementId: "settlement-santa-rita-2026-06",
  },
  {
    id: "order-madepol-betini",
    clientId: "party-madepol",
    clientName: "MADEPOL",
    supplierId: "party-betini",
    supplierName: "BETINI",
    paymentTerms: "30/60/90/120",
    status: "delivered",
    financialStatus: "overpaid",
    items: [],
    installmentIds: ["installment-madepol-betini-1"],
    paymentIds: ["payment-madepol-betini-1"],
  },
  {
    id: "order-imperio-sermad",
    clientId: "party-imperio-woods",
    clientName: "IMPERIO WOODS",
    supplierId: "party-sermad",
    supplierName: "SERMAD",
    paymentTerms: "30 dias",
    status: "incident",
    financialStatus: "under-review",
    items: [],
    incidentIds: ["incident-imperio-sermad"],
  },
];

export const sampleInstallment: Installment = {
  id: "installment-madepol-betini-1",
  orderId: "order-madepol-betini",
  sequence: 1,
  totalInstallments: 1,
  dueAt: "2026-06-30",
  recipient: "supplier",
  expectedAmount: 6_217.14,
  paidAt: "2026-06-30",
  actualAmount: 11_000,
  method: "pix",
  status: "overpaid",
  difference: 4_782.86,
};

export const sampleInstallments: Installment[] = [sampleInstallment];

export const samplePayments: Payment[] = [
  {
    id: "payment-madepol-betini-1",
    orderId: "order-madepol-betini",
    installmentId: "installment-madepol-betini-1",
    paidAt: "2026-06-30",
    amount: 11_000,
    expectedAmount: 6_217.14,
    difference: 4_782.86,
    method: "pix",
    recipient: "supplier",
  },
];

export const sampleIncidents: Incident[] = [
  {
    id: "incident-imperio-sermad",
    orderId: "order-imperio-sermad",
    clientName: "IMPERIO WOODS",
    supplierName: "SERMAD",
    title: "Material faltante",
    description: "FALTOU MATERIAL",
    type: "missing-item",
    priority: "high",
    status: "open",
    openedAt: "2026-06-20",
    timeline: [],
  },
];

export const sampleSettlements: Settlement[] = [
  {
    id: "settlement-santa-rita-2026-06",
    supplierId: "party-santa-rita",
    supplierName: "SANTA RITA",
    period: "2026-06",
    orderIds: ["order-santa-clara-2026-06"],
    entries: [
      {
        orderId: "order-santa-clara-2026-06",
        clientName: "SANTA CLARA MAT CONST",
        merchandise: 44_987,
        freight: 6_700,
        tax: 0,
        surplus: 0,
        shortage: 108.08,
        net: 38_178.92,
        discountRate: 0.025,
        discount: 954.473,
        commissionRate: 0.05,
        commission: 1_908.946,
        payable: 1_908.946,
      },
    ],
    reportTotal: 53_929.63,
    payments: 53_929.63,
    extras: 0,
    balance: 0,
    status: "settled",
  },
];

export const sampleCheck: Check = {
  id: "check-madepol-betini-1",
  orderId: "order-madepol-betini",
  number: "001",
  owner: "MADEPOL",
  clientName: "MADEPOL",
  supplierName: "BETINI",
  amount: 6_217.14,
  goodForAt: "2026-06-30",
  recipient: "BETINI",
  responsible: "MADEPOL",
  status: "receivable",
};

export const sampleChecks: Check[] = [sampleCheck];
export const samplePostalShipments: PostalShipment[] = [];
export const sampleUsers: UserProfile[] = [
  { id: "user-admin", name: "Ogura Rep", email: "admin@ogurarep.local", role: "admin", active: true },
];
