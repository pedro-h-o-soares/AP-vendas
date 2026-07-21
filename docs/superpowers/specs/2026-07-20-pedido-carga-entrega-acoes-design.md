# Ações de entrega no detalhe do pedido

## Objetivo

Permitir que as pessoas responsáveis pela operação confirmem a entrega de um
embarque ou registrem uma ocorrência diretamente em **Pedidos → Carga e
entrega**, sem precisar abrir a tela de Logística.

## Experiência proposta

Cada embarque exibido na aba terá uma área de ações. Para um embarque pendente,
ela apresentará **Confirmar entrega** e **Registrar ocorrência**. Após a
confirmação, a data de entrega e o status serão atualizados na própria tabela;
a segunda confirmação não deverá criar registros duplicados.

O botão de confirmação abrirá o mesmo diálogo de confirmação já usado em
Logística. O registro de ocorrência abrirá um formulário compacto com tipo
(item faltante, produto incorreto ou outra divergência), prioridade e
descrição. Ao salvar, a ocorrência ficará imediatamente visível abaixo dos
embarques e no histórico relacionado ao pedido.

## Regras de negócio e acesso

- Administrador e Comercial podem confirmar entregas e registrar ocorrências.
- Financeiro visualiza embarques e ocorrências, mas não recebe controles de
  alteração.
- A confirmação registra a data atual, atualiza o embarque e o pedido conforme
  a regra já existente e adiciona o evento de histórico uma única vez.
- A ocorrência é vinculada ao pedido e ao embarque selecionado; tipos de
  inconsistência cobrem itens faltantes, itens errados e outras divergências.
- Todas as alterações permanecem apenas na sessão, coerente com o protótipo.

## Implementação

Será extraído/reutilizado o comportamento já presente em `DeliveryForm` e no
formulário de ocorrência de Logística, evitando duas regras diferentes para o
mesmo embarque. A aba de detalhe terá ações por linha (ou bloco equivalente em
mobile), diálogo acessível e atualização reativa pelo store.

## Verificação

- Teste unitário: confirmação atualiza o embarque e não duplica o histórico.
- Teste de interface: Comercial vê e executa ambas as ações; Financeiro não vê
  ações de alteração.
- Teste de interface: ocorrência criada no pedido contém embarque, tipo,
  prioridade e descrição.
- Teste responsivo: os controles continuam acessíveis em celular e tablet.
