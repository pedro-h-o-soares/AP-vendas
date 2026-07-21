# Ações de entrega no detalhe do pedido Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disponibilizar a confirmação de entrega e o registro de ocorrência para cada embarque em Pedidos → Carga e entrega.

**Architecture:** A regra de confirmação continuará centralizada no store e será idempotente. Um componente reutilizável exibirá as ações de entrega e ocorrência, usado tanto no drawer de Logística quanto no detalhe do pedido, para que os dois pontos mantenham o mesmo comportamento.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, CSS existente.

## Global Constraints

- O protótipo não persiste dados fora da sessão.
- Administrador e Comercial precisam de `edit-logistics`; Financeiro é somente leitura.
- Ocorrências cobrem item faltante, produto incorreto e outra divergência.
- A UI deve funcionar em celular e tablet sem depender de hover.

---

### Task 1: Tornar a confirmação de entrega idempotente no store

**Files:**
- Modify: `src/state/PrototypeStore.tsx:369-394`
- Modify: `src/state/PrototypeStore.test.tsx:69-98`

**Interfaces:**
- Consumes: `recordDelivery(shipmentId: string, deliveredAt: ISODate): Shipment`.
- Produces: uma única atualização do embarque e um único evento `Entrega confirmada` por embarque.

- [ ] **Step 1: Escrever o teste que falha para a segunda confirmação**

```tsx
act(() => {
  result.current.recordDelivery(firstShipmentId, "2026-07-16");
  result.current.recordDelivery(firstShipmentId, "2026-07-16");
});

expect(result.current.orderTimelineEvents.filter((event) =>
  event.orderId === order.id && event.title === "Entrega confirmada",
)).toHaveLength(1);
```

- [ ] **Step 2: Executar o teste para confirmar a falha**

Run: `pnpm vitest run src/state/PrototypeStore.test.tsx`

Expected: FAIL porque a implementação adiciona dois eventos de entrega.

- [ ] **Step 3: Retornar o embarque existente quando já entregue**

```tsx
if (target.deliveredAt) {
  return clone(target);
}
```

Inserir a guarda imediatamente após validar `order` e `target`, antes de criar `shipment` e `event`.

- [ ] **Step 4: Executar o teste novamente**

Run: `pnpm vitest run src/state/PrototypeStore.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/PrototypeStore.tsx src/state/PrototypeStore.test.tsx
git commit -m "fix: avoid duplicate delivery confirmations"
```

### Task 2: Criar controles reutilizáveis por embarque

**Files:**
- Create: `src/features/logistics/ShipmentDeliveryActions.tsx`
- Modify: `src/features/logistics/ShipmentDrawer.tsx:1-145`
- Modify: `src/features/logistics/logistics.test.tsx:1-95`

**Interfaces:**
- Consumes: `order: Order`, `shipment: Shipment`, `createIncident`, `recordDelivery`, `can(role, "edit-logistics")`.
- Produces: `ShipmentDeliveryActions({ order, shipment })`, com confirmação acessível e formulário de ocorrência vinculado ao embarque.

- [ ] **Step 1: Escrever testes de interface para o componente**

```tsx
await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));
await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmar entrega" }));
expect(screen.getByText(/entrega confirmada/i)).toBeVisible();

await user.click(screen.getByRole("button", { name: "Registrar ocorrência" }));
await user.selectOptions(screen.getByLabelText("Tipo"), "missing-item");
await user.type(screen.getByLabelText("Descrição"), "Faltaram duas peças");
await user.click(screen.getByRole("button", { name: "Registrar" }));
expect(screen.getByText("Item faltante")).toBeVisible();
```

Também criar uma renderização com `role="finance"` que verifica a ausência de `Confirmar entrega` e `Registrar ocorrência`.

- [ ] **Step 2: Executar os testes para confirmar a falha**

Run: `pnpm vitest run src/features/logistics/logistics.test.tsx`

Expected: FAIL porque os controles ainda não existem como componente reutilizável.

- [ ] **Step 3: Implementar `ShipmentDeliveryActions`**

```tsx
export function ShipmentDeliveryActions({ order, shipment }: Props) {
  const { user } = useAuth();
  const allowed = Boolean(user && can(user.role, "edit-logistics"));
  if (!allowed) return null;
  // ConfirmDialog chama recordDelivery(shipment.id, toLocalISODate()).
  // O formulário chama createIncident({ orderId, shipmentId, clientName,
  // supplierName, title, description, type, priority }).
}
```

Manter os rótulos `Confirmar entrega`, `Registrar ocorrência`, `Tipo`,
`Prioridade`, `Descrição`, `Registrar` e `Cancelar`. Depois, substituir no
drawer o `DeliveryForm` e o formulário local por esse componente, deixando o
drawer responsável apenas pelos detalhes e edição do embarque.

- [ ] **Step 4: Executar os testes de logística**

Run: `pnpm vitest run src/features/logistics/logistics.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/logistics/ShipmentDeliveryActions.tsx src/features/logistics/ShipmentDrawer.tsx src/features/logistics/logistics.test.tsx
git commit -m "feat: share shipment delivery actions"
```

### Task 3: Expor as ações na aba Carga e entrega do pedido

**Files:**
- Modify: `src/features/orders/OrderDetailPage.tsx:1-320`
- Modify: `src/features/orders/OrderDetailPage.test.tsx:1-95`

**Interfaces:**
- Consumes: `ShipmentDeliveryActions({ order, shipment })` da Task 2.
- Produces: ações por embarque em `Carga e entrega`, com ocorrências atualizadas no mesmo painel.

- [ ] **Step 1: Escrever o teste que falha para o fluxo no pedido**

```tsx
const user = await renderDetail("order-brasil-flora-3824", "commercial");
await user.click(screen.getByRole("tab", { name: "Carga e entrega" }));
await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));
await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmar entrega" }));
expect(screen.getByRole("tabpanel")).toHaveTextContent(/entrega registrada/i);

await user.click(screen.getByRole("button", { name: "Registrar ocorrência" }));
await user.type(screen.getByLabelText("Descrição"), "Produto diferente do pedido");
await user.click(screen.getByRole("button", { name: "Registrar" }));
expect(screen.getByRole("tabpanel")).toHaveTextContent("Outra divergência");
```

Adicionar o caso Financeiro, na mesma aba, verificando a ausência dos dois
botões de alteração e a presença dos dados do embarque.

- [ ] **Step 2: Executar os testes para confirmar a falha**

Run: `pnpm vitest run src/features/orders/OrderDetailPage.test.tsx`

Expected: FAIL porque a aba não monta os controles de entrega.

- [ ] **Step 3: Montar o componente abaixo de cada embarque**

```tsx
{(order.shipments ?? []).map((shipment) => (
  <section key={shipment.id} className="shipment-actions">
    <h4>Embarque {shipment.invoiceNumber ?? shipment.id}</h4>
    <ShipmentDeliveryActions order={order} shipment={shipment} />
  </section>
))}
```

Importar `ShipmentDeliveryActions` e manter a tabela, edição de embarques e a
lista de ocorrências já existente. Usar a classe `shipment-actions` somente se
o CSS atual não fornecer espaçamento adequado; os botões devem manter os estilos
globais e largura natural para não criar overflow no mobile.

- [ ] **Step 4: Executar os testes do detalhe e a suíte de interface**

Run: `pnpm vitest run src/features/orders/OrderDetailPage.test.tsx src/features/logistics/logistics.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/orders/OrderDetailPage.tsx src/features/orders/OrderDetailPage.test.tsx
git commit -m "feat: manage delivery from order detail"
```

### Task 4: Verificação responsiva e regressão

**Files:**
- Modify if needed: `e2e/responsive.spec.ts`

**Interfaces:**
- Consumes: fluxo concluído das Tasks 1–3.
- Produces: evidência de que os controles permanecem operáveis em 390 px e 768 px.

- [ ] **Step 1: Escrever cenário responsivo, se não houver cobertura equivalente**

```tsx
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("/pedidos/order-brasil-flora-3824");
await page.getByRole("tab", { name: "Carga e entrega" }).click();
await expect(page.getByRole("button", { name: "Confirmar entrega" })).toBeVisible();
await expect(page.getByRole("button", { name: "Registrar ocorrência" })).toBeVisible();
```

- [ ] **Step 2: Executar a verificação completa**

Run: `pnpm lint && pnpm test:run && pnpm test:e2e && pnpm build && git diff --check`

Expected: todos os comandos concluem com código 0.

- [ ] **Step 3: Commit da cobertura de regressão, caso alterada**

```bash
git add e2e/responsive.spec.ts
git commit -m "test: cover delivery actions on mobile"
```
