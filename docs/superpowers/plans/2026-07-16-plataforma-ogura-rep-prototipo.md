# Ogura Rep Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um protótipo web navegável e responsivo que demonstre a substituição das planilhas da Ogura Rep por uma jornada integrada de orçamento, pedido, logística, financeiro e acerto.

**Architecture:** Uma SPA React organizada por domínios, com rotas, componentes compartilhados e dados tipados locais. O pedido conecta clientes, fornecedores, comunicações, embarques, ocorrências e movimentações financeiras; alterações permanecem apenas na memória da sessão.

**Tech Stack:** React, TypeScript, Vite, React Router, Lucide React, Recharts, CSS, Vitest, Testing Library e Playwright.

## Global Constraints

- Não criar backend, API, banco de dados ou persistência permanente.
- Não incluir migração de planilhas pela interface.
- Utilizar registros reais das planilhas fornecidas como dados demonstrativos.
- Representar todos os grupos de informação encontrados nas quatro planilhas, sem limitar cadastros futuros às amostras.
- Priorizar pendências operacionais no dashboard.
- Implementar perfis Administrador, Comercial e Financeiro/Administrativo.
- Seguir a opção visual A aprovada: degradês suaves, transparência, cartões claros e simplicidade.
- Implementar sidebar expandida e recolhida no desktop/tablet e navegação inferior no celular.
- Exibir aviso permanente de que os dados do protótipo não são gravados.
- O diretório não possui Git; executar passos de commit somente após o usuário inicializar ou disponibilizar um repositório.

## File Structure

```text
package.json                         scripts e dependências
vite.config.ts                      Vite, aliases e Vitest
playwright.config.ts                testes navegáveis em três viewports
src/main.tsx                        entrada da aplicação
src/app/App.tsx                     providers e rotas
src/app/routes.tsx                  definição de rotas e permissões
src/styles/tokens.css               cores, transparência, tipografia e espaçamento
src/styles/global.css               reset, responsividade e utilitários globais
src/domain/types.ts                 modelos compartilhados
src/domain/calculations.ts          líquido, diferenças, descontos, comissões e saldos
src/data/sampleData.ts              dados demonstrativos extraídos das planilhas
src/state/PrototypeStore.tsx        estado em memória e ações simuladas
src/auth/AuthContext.tsx            usuário e perfil ativos
src/auth/ProtectedRoute.tsx         bloqueio por perfil
src/layout/AppShell.tsx             layout responsivo
src/layout/Sidebar.tsx              sidebar retrátil
src/layout/MobileNav.tsx            navegação inferior
src/components/*                    cartões, tabelas, badges, formulários e estados
src/features/dashboard/*            dashboard operacional
src/features/orders/*               orçamentos, pedidos e detalhe integrado
src/features/parties/*              clientes e fornecedores
src/features/logistics/*            embarques e entregas
src/features/incidents/*            ocorrências
src/features/finance/*              parcelas, pagamentos e cobranças
src/features/checks/*               cheques e Correios
src/features/settlements/*          comissões e acertos
src/features/reports/*              relatórios e visão anual
src/features/admin/*                usuários e perfis
src/test/setup.ts                   configuração do Testing Library
tests/e2e/*.spec.ts                 fluxos completos e responsividade
```

---

### Task 1: Scaffold the frontend and test harness

**Files:**

- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `eslint.config.js`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`

**Interfaces:**

- Produces: `App(): JSX.Element`, scripts `dev`, `build`, `test`, `test:run`, `test:e2e` and `lint`.
- Consumes: no earlier task.

- [ ] **Step 1: Create the package manifest and TypeScript/Vite configuration**

Run `pnpm init`, replace the generated scripts with the exact scripts below, and configure Vite/Vitest with the React plugin, `jsdom`, globals and `src/test/setup.ts`. Configure Playwright to start `pnpm dev --host 127.0.0.1 --port 4173` and use `http://127.0.0.1:4173` as its base URL. Configure ESLint for TypeScript, React hooks and Vite refresh.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint ."
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
pnpm add react react-dom react-router-dom lucide-react recharts clsx
pnpm add -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom
```

Expected: lockfile `pnpm-lock.yaml` created and command exits with code 0.

- [ ] **Step 3: Write the failing smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

it("renders the prototype notice", () => {
  render(<App />);
  expect(screen.getByText(/protótipo sem gravação permanente/i)).toBeInTheDocument();
});
```

- [ ] **Step 4: Run the smoke test and verify failure**

Run: `pnpm test:run src/app/App.test.tsx`

Expected: FAIL because `App` does not yet render the notice.

- [ ] **Step 5: Implement the minimal application shell**

```tsx
export function App() {
  return (
    <main>
      <h1>Ogura Rep</h1>
      <p>Protótipo sem gravação permanente</p>
    </main>
  );
}
```

- [ ] **Step 6: Verify test and production build**

Run: `pnpm test:run src/app/App.test.tsx && pnpm build`

Expected: one passing test and successful Vite build in `dist/`.

- [ ] **Step 7: Commit if Git is available**

```bash
git add package.json pnpm-lock.yaml index.html tsconfig*.json vite.config.ts playwright.config.ts eslint.config.js src
git commit -m "chore: scaffold Ogura Rep prototype"
```

---

### Task 2: Build the visual system and responsive navigation

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layout/AppShell.tsx`
- Create: `src/layout/Sidebar.tsx`
- Create: `src/layout/MobileNav.tsx`
- Create: `src/layout/AppShell.test.tsx`
- Modify: `src/main.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**

- Produces: `AppShell`, `Sidebar`, `MobileNav`, CSS variables `--color-primary`, `--surface-glass`, `--radius-card` and session-only `sidebarCollapsed` state.
- Consumes: `App` from Task 1.

- [ ] **Step 1: Write tests for navigation and sidebar behavior**

```tsx
it("toggles the desktop sidebar", async () => {
  render(<AppShell><div>Conteúdo</div></AppShell>);
  await userEvent.click(screen.getByRole("button", { name: /recolher menu/i }));
  expect(screen.getByRole("navigation", { name: /principal/i })).toHaveAttribute("data-collapsed", "true");
});

it("contains the five primary mobile destinations", () => {
  render(<MobileNav />);
  expect(screen.getAllByRole("link")).toHaveLength(5);
});
```

- [ ] **Step 2: Verify the layout tests fail**

Run: `pnpm test:run src/layout/AppShell.test.tsx`

Expected: FAIL because the layout components do not exist.

- [ ] **Step 3: Define visual tokens and global styles**

Create tokens for purple primary actions, blue information, orange attention, red critical errors, translucent white panels, soft shadows, 18–28px radii and breakpoints at 640px and 1024px. Use `backdrop-filter`, but include an opaque fallback before the translucent declaration.

```css
:root {
  --color-primary: #6f58d9;
  --color-info: #4f8ff7;
  --color-warning: #f59f3a;
  --color-danger: #dc4c64;
  --surface-glass: rgba(255, 255, 255, 0.68);
  --radius-card: 1.25rem;
  --shadow-card: 0 1.25rem 3.5rem rgba(61, 48, 119, 0.12);
}
```

- [ ] **Step 4: Implement responsive AppShell**

`Sidebar` receives `collapsed: boolean` and `onToggle(): void`; `MobileNav` contains Dashboard, Pedidos, Logística, Financeiro and Mais. Hide `MobileNav` above 640px and hide the sidebar below 640px. Keep collapse state inside `AppShell` so reload restores the expanded default.

- [ ] **Step 5: Verify layout tests and build**

Run: `pnpm test:run src/layout/AppShell.test.tsx && pnpm build`

Expected: layout tests pass and build exits with code 0.

- [ ] **Step 6: Commit if Git is available**

```bash
git add src/styles src/layout src/main.tsx src/app/App.tsx
git commit -m "feat: add responsive glass navigation shell"
```

---

### Task 3: Define the domain, calculations and sample data

**Files:**

- Create: `src/domain/types.ts`
- Create: `src/domain/calculations.ts`
- Create: `src/domain/calculations.test.ts`
- Create: `src/data/sampleData.ts`
- Create: `src/data/sampleData.test.ts`
- Create: `src/state/PrototypeStore.tsx`
- Create: `src/state/PrototypeStore.test.tsx`

**Interfaces:**

- Produces: `Order`, `OrderItem`, `Party`, `Shipment`, `Incident`, `Installment`, `Payment`, `Check`, `PostalShipment`, `Settlement`, `UserProfile`; functions `calculateNet`, `calculateDifference`, `calculateDiscount`, `calculateCommission`; `usePrototypeStore()`.
- Consumes: React from Task 1.

- [ ] **Step 1: Write calculation and data coverage tests**

```ts
expect(calculateNet({ merchandise: 44_987, freight: 6_700, surplus: 0, shortage: 108.08 })).toBe(38_178.92);
expect(calculateDiscount(38_178.92, 0.025)).toBeCloseTo(954.473, 3);
expect(calculateCommission(38_178.92, 0.05)).toBeCloseTo(1_908.946, 3);
expect(sampleOrders.some(order => order.clientName === "101 COMERCIO DE MADEIRAS LTDA ME")).toBe(true);
expect(sampleOrders.some(order => order.supplierName === "BRASIL FLORA")).toBe(true);
```

- [ ] **Step 2: Run domain tests and verify failure**

Run: `pnpm test:run src/domain src/data`

Expected: FAIL because domain functions and sample data do not exist.

- [ ] **Step 3: Implement exact domain models**

Define string unions for role, order status, financial status, incident status and postal status. Model IDs as strings; dates as ISO `YYYY-MM-DD`; money as numbers in BRL. Include every group in the specification: identifiers, contacts, conditions, confirmation timestamps, order items, shipment, delivery, commercial values, installments, payments, checks, postal data, incidents and settlement links.

```ts
export type Role = "admin" | "commercial" | "finance";
export type OrderStatus = "draft" | "quote" | "awaiting-stock" | "quote-sent" | "awaiting-supplier" | "awaiting-client" | "confirmed" | "preparing" | "shipment-informed" | "in-transit" | "delivered" | "incident" | "completed" | "cancelled";
export type MoneyInput = { merchandise: number; freight: number; surplus: number; shortage: number };
```

- [ ] **Step 4: Implement formulas with currency-safe rounding at display boundaries**

```ts
export const calculateNet = (v: MoneyInput) => v.merchandise - v.freight + v.surplus - v.shortage;
export const calculateDifference = (expected: number, actual: number) => actual - expected;
export const calculateDiscount = (base: number, rate: number) => base * rate;
export const calculateCommission = (base: number, rate: number) => base * rate;
```

- [ ] **Step 5: Create representative sample records**

Include actual sample names and values from `ROL DE PEDIDOS.xlsx`, `RECEBIMENTOS.xlsx`, `Controle - Brasil Flora - Anual.xlsx` and `Relatorio de Acerto - Mad Santa Rita.xlsx`. Include at least one order for each of: awaiting confirmation, shipment informed, delivered, incident, financial difference and settled commission. Include the Santa Rita June 2026 settlement values used by the calculation test.

- [ ] **Step 6: Implement in-memory store actions**

Expose `createQuote`, `convertQuoteToOrder`, `updateOrderStatus`, `createIncident`, `recordPayment`, `createPostalShipment` and `resetDemo`. Each action returns the created or changed record and affects only React state.

- [ ] **Step 7: Verify domain and store tests**

Run: `pnpm test:run src/domain src/data src/state`

Expected: all domain, coverage and in-memory action tests pass.

- [ ] **Step 8: Commit if Git is available**

```bash
git add src/domain src/data src/state
git commit -m "feat: model Ogura Rep operations and demo data"
```

---

### Task 4: Add simulated authentication and profile permissions

**Files:**

- Create: `src/auth/AuthContext.tsx`
- Create: `src/auth/ProtectedRoute.tsx`
- Create: `src/auth/permissions.ts`
- Create: `src/auth/permissions.test.ts`
- Create: `src/features/auth/LoginPage.tsx`
- Create: `src/features/auth/LoginPage.test.tsx`
- Create: `src/features/auth/AccessDeniedPage.tsx`
- Create: `src/app/routes.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/layout/Sidebar.tsx`
- Modify: `src/layout/MobileNav.tsx`

**Interfaces:**

- Produces: `can(role, permission): boolean`, `AuthProvider`, `useAuth`, `ProtectedRoute`, route table.
- Consumes: `Role` and demo users from Task 3; `AppShell` from Task 2.

- [ ] **Step 1: Write permission matrix and login tests**

```ts
expect(can("admin", "manage-users")).toBe(true);
expect(can("commercial", "edit-order")).toBe(true);
expect(can("commercial", "record-payment")).toBe(false);
expect(can("finance", "record-payment")).toBe(true);
```

```tsx
it("enters the app with the selected demo profile", async () => {
  render(<LoginPage />);
  await userEvent.click(screen.getByRole("button", { name: /entrar como comercial/i }));
  expect(mockSignIn).toHaveBeenCalledWith("commercial");
});
```

- [ ] **Step 2: Verify authentication tests fail**

Run: `pnpm test:run src/auth src/features/auth`

Expected: FAIL because authentication and permissions do not exist.

- [ ] **Step 3: Implement the exact permission matrix**

Permissions: `view-dashboard`, `view-orders`, `edit-order`, `view-logistics`, `edit-logistics`, `view-finance`, `record-payment`, `view-checks`, `manage-checks`, `view-settlements`, `manage-settlements`, `view-reports`, `manage-users`. Admin receives all; Commercial receives dashboard, order and logistics permissions; Finance receives dashboard, read orders, finance, checks, settlements and reports.

- [ ] **Step 4: Implement login, provider and protected routes**

The login provides three explicit demo profile buttons. `ProtectedRoute` sends unauthenticated users to `/login` and renders `AccessDeniedPage` when `can` returns false. Menus filter destinations using the same permission function.

- [ ] **Step 5: Verify tests and routes**

Run: `pnpm test:run src/auth src/features/auth src/app`

Expected: permission, login and route tests pass.

- [ ] **Step 6: Commit if Git is available**

```bash
git add src/auth src/features/auth src/app src/layout
git commit -m "feat: add simulated role-based access"
```

---

### Task 5: Implement shared UI components and operational dashboard

**Files:**

- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/KpiCard.tsx`
- Create: `src/components/DataTable.tsx`
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/Drawer.tsx`
- Create: `src/components/ConfirmDialog.tsx`
- Create: `src/components/FormField.tsx`
- Create: `src/components/PrototypeNotice.tsx`
- Create: `src/components/AsyncState.tsx`
- Create: `src/components/components.test.tsx`
- Create: `src/features/dashboard/DashboardPage.tsx`
- Create: `src/features/dashboard/DashboardPage.test.tsx`
- Create: `src/features/dashboard/OrderStatusChart.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: reusable table, filter, form, modal, drawer, status and state primitives; `DashboardPage`.
- Consumes: store selectors from Task 3, role from Task 4 and visual tokens from Task 2.

- [ ] **Step 1: Write component accessibility and dashboard priority tests**

```tsx
it("labels the drawer and returns focus on close", async () => {
  render(<Drawer title="Detalhes" open onClose={onClose}>Conteúdo</Drawer>);
  expect(screen.getByRole("dialog", { name: "Detalhes" })).toBeVisible();
});

it("shows operational priorities before financial summary", () => {
  render(<DashboardPage />);
  const priorities = screen.getByRole("heading", { name: /prioridades de hoje/i });
  const finance = screen.getByRole("heading", { name: /resumo financeiro/i });
  expect(priorities.compareDocumentPosition(finance) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
```

- [ ] **Step 2: Verify shared component tests fail**

Run: `pnpm test:run src/components src/features/dashboard`

Expected: FAIL because components and dashboard do not exist.

- [ ] **Step 3: Implement shared components**

`DataTable<T>` receives typed columns, rows, `getRowId`, empty message and row action. `AsyncState` supports `loading`, `error`, `empty` and `ready`; error includes “Tentar novamente”. `PrototypeNotice` stays visible below the page header. `Drawer` and `ConfirmDialog` use semantic dialogs and restore focus.

- [ ] **Step 4: Implement the role-aware dashboard**

Show operational KPI cards, priority list, recent orders and order status doughnut. Admin and Finance additionally see the financial summary below operational content. Add filters for period, responsible party, supplier and region.

- [ ] **Step 5: Verify components and dashboard**

Run: `pnpm test:run src/components src/features/dashboard && pnpm build`

Expected: tests pass and dashboard builds without TypeScript errors.

- [ ] **Step 6: Commit if Git is available**

```bash
git add src/components src/features/dashboard src/app/routes.tsx
git commit -m "feat: add operational dashboard and UI primitives"
```

---

### Task 6: Implement quotes and integrated orders

**Files:**

- Create: `src/features/orders/OrdersPage.tsx`
- Create: `src/features/orders/OrdersPage.test.tsx`
- Create: `src/features/orders/OrderDetailPage.tsx`
- Create: `src/features/orders/OrderDetailPage.test.tsx`
- Create: `src/features/orders/QuoteWizard.tsx`
- Create: `src/features/orders/QuoteWizard.test.tsx`
- Create: `src/features/orders/OrderTimeline.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: routes `/pedidos`, `/pedidos/:orderId`, quote creation and conversion simulation.
- Consumes: domain/store from Task 3 and UI primitives from Task 5.

- [ ] **Step 1: Write listing, wizard and detail tests**

```tsx
it("filters orders by client and status", async () => {
  render(<OrdersPage />);
  await userEvent.type(screen.getByRole("searchbox"), "101 COMERCIO");
  await userEvent.selectOptions(screen.getByLabelText(/status/i), "shipment-informed");
  expect(screen.getByText(/101 COMERCIO DE MADEIRAS/i)).toBeVisible();
});

it("requires client, supplier and one item before confirming a quote", async () => {
  render(<QuoteWizard open onClose={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: /continuar/i }));
  expect(screen.getByText(/selecione um cliente/i)).toBeVisible();
});
```

- [ ] **Step 2: Verify order tests fail**

Run: `pnpm test:run src/features/orders`

Expected: FAIL because order pages do not exist.

- [ ] **Step 3: Implement the orders list**

Columns: number, client, supplier, order date, shipment, responsible, status and actions. Filters: search, status, supplier, responsible, city, region and date. On mobile render each row as a labeled card without horizontal scrolling.

- [ ] **Step 4: Implement the quote wizard**

Steps: parties; itens e quantidades; confirmação de estoque, preço e prazo; condições de pagamento; revisão. Validate required fields and show a session-only success notification. Provide “Converter em pedido” after the quote reaches confirmed state.

- [ ] **Step 5: Implement the integrated order detail**

Tabs: Resumo, Itens e valores, Comunicações, Carga e entrega, Financeiro, Ocorrências and Histórico. Render the same order ID across all tabs; actions call store methods and append timeline events.

- [ ] **Step 6: Verify order flows**

Run: `pnpm test:run src/features/orders && pnpm build`

Expected: list filters, form validation, conversion and tab tests pass.

- [ ] **Step 7: Commit if Git is available**

```bash
git add src/features/orders src/app/routes.tsx
git commit -m "feat: add quote and integrated order journey"
```

---

### Task 7: Implement clients and suppliers

**Files:**

- Create: `src/features/parties/ClientsPage.tsx`
- Create: `src/features/parties/SuppliersPage.tsx`
- Create: `src/features/parties/PartyDetailDrawer.tsx`
- Create: `src/features/parties/PartyForm.tsx`
- Create: `src/features/parties/parties.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: routes `/clientes` and `/fornecedores`, party detail and simulated edit form.
- Consumes: `Party`, orders and settlements from Task 3; shared drawer/form/table from Task 5.

- [ ] **Step 1: Write party list and history tests**

```tsx
it("shows client contacts, conditions and history", async () => {
  render(<ClientsPage />);
  await userEvent.click(screen.getByText(/101 COMERCIO DE MADEIRAS/i));
  expect(screen.getByText(/Linhares/i)).toBeVisible();
  expect(screen.getByRole("heading", { name: /histórico de pedidos/i })).toBeVisible();
});
```

- [ ] **Step 2: Verify tests fail**

Run: `pnpm test:run src/features/parties`

Expected: FAIL because party pages do not exist.

- [ ] **Step 3: Implement party lists, drawer and form**

Client fields: name, contact, email, city, state, region and usual payment conditions. Supplier fields add commission and cash-discount rules. Detail shows linked orders, shipments, incidents, financial summary and settlements; simulated form validates name and at least one contact method.

- [ ] **Step 4: Verify party behavior**

Run: `pnpm test:run src/features/parties && pnpm build`

Expected: list, form and detail history tests pass.

- [ ] **Step 5: Commit if Git is available**

```bash
git add src/features/parties src/app/routes.tsx
git commit -m "feat: add client and supplier directories"
```

---

### Task 8: Implement logistics and incidents

**Files:**

- Create: `src/features/logistics/LogisticsPage.tsx`
- Create: `src/features/logistics/ShipmentDrawer.tsx`
- Create: `src/features/logistics/DeliveryForm.tsx`
- Create: `src/features/logistics/logistics.test.tsx`
- Create: `src/features/incidents/IncidentsPage.tsx`
- Create: `src/features/incidents/IncidentForm.tsx`
- Create: `src/features/incidents/incidents.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: routes `/logistica` and `/ocorrencias`, simulated delivery and incident actions.
- Consumes: shipments/incidents/store from Task 3, permissions from Task 4 and UI primitives from Task 5.

- [ ] **Step 1: Write delivery and incident tests**

```tsx
it("records a simulated delivery after confirmation", async () => {
  render(<DeliveryForm shipment={sampleShipment} />);
  await userEvent.click(screen.getByRole("button", { name: /confirmar entrega/i }));
  expect(screen.getByRole("dialog", { name: /confirmar entrega/i })).toBeVisible();
});

it.each(["item faltante", "produto incorreto", "outra divergência"])("offers incident type %s", type => {
  render(<IncidentForm orderId="order-1" />);
  expect(screen.getByRole("option", { name: new RegExp(type, "i") })).toBeInTheDocument();
});
```

- [ ] **Step 2: Verify logistics tests fail**

Run: `pnpm test:run src/features/logistics src/features/incidents`

Expected: FAIL because logistics and incident components do not exist.

- [ ] **Step 3: Implement logistics views**

List shipment status, client, supplier, note, invoice, driver, route, departure, forecast and delivery. Drawer shows load report, sales guide, client/supplier copies, payment mode, driver receipt and material conference.

- [ ] **Step 4: Implement incidents**

List priority, type, order, client, supplier, owner and status. Form conditionally requires a description for “outra divergência”; submission appends a timeline event and shows the supplier-contacted action.

- [ ] **Step 5: Verify logistics and incident flows**

Run: `pnpm test:run src/features/logistics src/features/incidents && pnpm build`

Expected: tests pass and both routes build successfully.

- [ ] **Step 6: Commit if Git is available**

```bash
git add src/features/logistics src/features/incidents src/app/routes.tsx
git commit -m "feat: add logistics and incident workflows"
```

---

### Task 9: Implement finance and collections

**Files:**

- Create: `src/features/finance/FinancePage.tsx`
- Create: `src/features/finance/InstallmentDrawer.tsx`
- Create: `src/features/finance/PaymentForm.tsx`
- Create: `src/features/finance/CollectionsPanel.tsx`
- Create: `src/features/finance/finance.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: route `/financeiro`, `PaymentForm` and collections view.
- Consumes: installments/payments and calculations from Task 3, finance permissions from Task 4 and shared UI from Task 5.

- [ ] **Step 1: Write finance validation and difference tests**

```tsx
it("calculates a payment difference", async () => {
  render(<PaymentForm installment={{ ...sampleInstallment, expectedAmount: 6217.14 }} />);
  await userEvent.type(screen.getByLabelText(/valor pago/i), "11000");
  expect(screen.getByText(/4.782,86/)).toBeVisible();
});

it("requires cheque fields when method is cheque", async () => {
  render(<PaymentForm installment={sampleInstallment} />);
  await userEvent.selectOptions(screen.getByLabelText(/meio/i), "check");
  expect(screen.getByLabelText(/número do cheque/i)).toBeRequired();
});
```

- [ ] **Step 2: Verify finance tests fail**

Run: `pnpm test:run src/features/finance`

Expected: FAIL because finance components do not exist.

- [ ] **Step 3: Implement finance page and drawer**

Tabs: A receber, A pagar, Cobranças and Movimentações. Filters include status, due date, client, supplier, region and payment method. Drawer shows installment sequence, destination, expected/actual values, dates, bank data, observations and linked order.

- [ ] **Step 4: Implement payment and collection simulations**

Payment methods: PIX, cheque, boleto, depósito and direto. Conditionally show bank/check fields. Collections show overdue amount, last contact, next date, visit/collection indicator and simulated “Registrar contato”.

- [ ] **Step 5: Verify finance flows**

Run: `pnpm test:run src/features/finance && pnpm build`

Expected: difference, conditional fields, filters and permission tests pass.

- [ ] **Step 6: Commit if Git is available**

```bash
git add src/features/finance src/app/routes.tsx
git commit -m "feat: add finance and collection simulations"
```

---

### Task 10: Implement checks and postal tracking

**Files:**

- Create: `src/features/checks/ChecksPage.tsx`
- Create: `src/features/checks/CheckDrawer.tsx`
- Create: `src/features/checks/PostalShipmentForm.tsx`
- Create: `src/features/checks/checks.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: route `/cheques-correios`, check detail and postal simulation.
- Consumes: checks/postal data/store from Task 3 and finance permissions from Task 4.

- [ ] **Step 1: Write check and postal form tests**

```tsx
it("shows check owner, good-for date and amount", () => {
  render(<CheckDrawer check={sampleCheck} />);
  expect(screen.getByText(sampleCheck.owner)).toBeVisible();
  expect(screen.getByText(/bom para/i)).toBeVisible();
});

it("requires service and recipient before simulating postage", async () => {
  render(<PostalShipmentForm checkId="check-1" />);
  await userEvent.click(screen.getByRole("button", { name: /simular postagem/i }));
  expect(screen.getByText(/selecione o serviço/i)).toBeVisible();
});
```

- [ ] **Step 2: Verify check tests fail**

Run: `pnpm test:run src/features/checks`

Expected: FAIL because check and postal components do not exist.

- [ ] **Step 3: Implement checks and postal route**

Tabs: Cheques and Correios. Check fields: number, owner, client, supplier, amount, good-for date, responsible and status. Postal fields: recipient, service, code, tracking, cost, invoice, posted date, forecast, delivery, financial values and observations.

- [ ] **Step 4: Verify check and postal behavior**

Run: `pnpm test:run src/features/checks && pnpm build`

Expected: field validation, status changes and sample data display tests pass.

- [ ] **Step 5: Commit if Git is available**

```bash
git add src/features/checks src/app/routes.tsx
git commit -m "feat: add check and postal tracking simulation"
```

---

### Task 11: Implement settlements, reports and administration

**Files:**

- Create: `src/features/settlements/SettlementsPage.tsx`
- Create: `src/features/settlements/SettlementDetail.tsx`
- Create: `src/features/settlements/settlements.test.tsx`
- Create: `src/features/reports/ReportsPage.tsx`
- Create: `src/features/reports/AnnualSupplierReport.tsx`
- Create: `src/features/reports/reports.test.tsx`
- Create: `src/features/admin/UsersPage.tsx`
- Create: `src/features/admin/UserForm.tsx`
- Create: `src/features/admin/admin.test.tsx`
- Modify: `src/app/routes.tsx`

**Interfaces:**

- Produces: routes `/acertos`, `/relatorios` and `/administracao/usuarios`.
- Consumes: settlement calculations/sample data from Task 3, role checks from Task 4 and charts/tables from Task 5.

- [ ] **Step 1: Write settlement, report and admin tests**

```tsx
it("reconciles the Santa Rita June 2026 settlement", () => {
  render(<SettlementDetail settlementId="settlement-santa-rita-2026-06" />);
  expect(screen.getByText(/R\$ 53.929,63/)).toBeVisible();
  expect(screen.getByText(/saldo/i)).toBeVisible();
});

it("blocks user administration for finance profile", () => {
  renderRouteAs("finance", "/administracao/usuarios");
  expect(screen.getByRole("heading", { name: /acesso negado/i })).toBeVisible();
});
```

- [ ] **Step 2: Verify final module tests fail**

Run: `pnpm test:run src/features/settlements src/features/reports src/features/admin`

Expected: FAIL because routes and components do not exist.

- [ ] **Step 3: Implement settlements**

Filter by supplier and period. Detail sections: payable values, merchandise, freight, ICMS, surplus, shortage, net, cash discount, comissão, total payable, recorded payments, extras and balance. Use the June 2026 Santa Rita sample and show a report-style preview equivalent to the **Relatório de Acerto**.

- [ ] **Step 4: Implement reports**

Provide filters and summary cards for orders, financial movements, shipments, incidents and commissions. `AnnualSupplierReport` represents the Brasil Flora annual control as grouped cards and concise tables instead of a 45-column grid.

- [ ] **Step 5: Implement administration**

Admin-only user table and simulated form with name, email, role and active state. Display the full permission matrix and require confirmation before deactivation.

- [ ] **Step 6: Verify modules and full unit suite**

Run: `pnpm test:run && pnpm build`

Expected: all unit/component tests pass and production build succeeds.

- [ ] **Step 7: Commit if Git is available**

```bash
git add src/features/settlements src/features/reports src/features/admin src/app/routes.tsx
git commit -m "feat: add settlements reports and administration"
```

---

### Task 12: Verify end-to-end flows, accessibility and responsive behavior

**Files:**

- Create: `tests/e2e/auth-and-navigation.spec.ts`
- Create: `tests/e2e/commercial-flow.spec.ts`
- Create: `tests/e2e/logistics-flow.spec.ts`
- Create: `tests/e2e/finance-flow.spec.ts`
- Create: `tests/e2e/responsive.spec.ts`
- Modify: `src/styles/global.css`
- Modify: affected components found by verification.

**Interfaces:**

- Produces: verified prototype in `dist/` with end-to-end coverage at desktop, tablet and mobile sizes.
- Consumes: all routes and flows from Tasks 1–11.

- [ ] **Step 1: Write Playwright flows**

```ts
test("commercial user creates and converts a quote", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como comercial/i }).click();
  await page.getByRole("link", { name: /pedidos/i }).click();
  await page.getByRole("button", { name: /novo orçamento/i }).click();
  await expect(page.getByRole("dialog", { name: /novo orçamento/i })).toBeVisible();
});

test("mobile uses bottom navigation without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByRole("button", { name: /entrar como administrador/i }).click();
  await expect(page.getByRole("navigation", { name: /navegação móvel/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
```

- [ ] **Step 2: Run Playwright and record exact failures**

Run: `pnpm exec playwright install chromium && pnpm test:e2e`

Expected: initial run may expose missing accessible names, focus handling or responsive overflow; record each failing assertion before editing.

- [ ] **Step 3: Fix only observed accessibility and responsive failures**

Add missing labels, focus-visible styles, dialog focus restoration, touch targets of at least 44px and card transformations for narrow tables. Preserve the approved glass visual while increasing panel opacity where contrast is insufficient.

- [ ] **Step 4: Run the complete verification suite**

Run: `pnpm lint && pnpm test:run && pnpm test:e2e && pnpm build`

Expected: lint exits with no errors; all unit and E2E tests pass; production build succeeds.

- [ ] **Step 5: Perform browser visual verification**

Open the built application and inspect at 390×844, 768×1024 and 1440×900. Verify sidebar expansion/collapse, mobile bottom navigation, no clipped content, readable translucent panels, visible focus, usable forms and correct role menus.

- [ ] **Step 6: Verify source-field coverage**

Use the specification checklist to confirm that the UI contains fields for ROL confirmations, order identifiers, contacts, shipment/informe, commercial values, installments, bank/payment data, checks, Correios, incidents, commission and settlement balances.

- [ ] **Step 7: Commit if Git is available**

```bash
git add tests src package.json pnpm-lock.yaml
git commit -m "test: verify responsive Ogura Rep prototype"
```
