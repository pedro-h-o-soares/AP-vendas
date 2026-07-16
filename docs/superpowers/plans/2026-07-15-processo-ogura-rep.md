# Processo da Ogura Rep — Plano de Implementação

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar este plano tarefa por tarefa. As etapas usam caixas de seleção (`- [ ]`) para acompanhamento.

**Objetivo:** Criar um documento Markdown que descreva o processo operacional atual da Ogura Rep e apresente, em seção separada, propostas de melhorias.

**Arquitetura:** Um único arquivo organiza o conteúdo pela jornada do pedido, complementado por responsabilidades, controles administrativos e recomendações. O texto deriva somente de `Modelo.md`; qualquer sugestão aparece exclusivamente na seção de melhorias.

**Tecnologias:** Markdown e comandos de inspeção textual com `rg`.

## Restrições globais

- Não atribuir responsabilidades que não estejam explicitamente indicadas em `Modelo.md`.
- Não inventar prazos, regras de aprovação, sistemas ou integrações.
- Explicar o processo atual antes de apresentar recomendações.
- Incluir todas as planilhas e formas de pagamento citadas na fonte.
- Usar linguagem profissional, clara e acessível a pessoas externas à empresa.

---

### Tarefa 1: Redigir e validar o processo operacional

**Arquivos:**

- Consultar: `Modelo.md`
- Consultar: `docs/superpowers/specs/2026-07-15-processo-ogura-rep-design.md`
- Criar: `Processo-Ogura-Rep.md`

**Conteúdo produzido:**

- Uma visão geral da Ogura Rep como representante de produtos de madeira acabados e madeira pura.
- Uma seção de papéis e responsabilidades que distingue Luiz, Luiza e Tiele.
- Um fluxo operacional com recebimento da solicitação, orçamento, emissão do pedido, acompanhamento da carga, entrega, tratamento de inconsistências, liquidação financeira e comissão.
- Uma seção sobre `ROL de Pedidos`, `Recebimentos`, `Relatório de Acerto`, `Controle - Brasil Flora - Anual` e `Ogura Rep - Estrutura`.
- Uma seção independente de melhorias propostas.

- [x] **Etapa 1: Criar a estrutura do documento**

Criar `Processo-Ogura-Rep.md` com estes títulos, nesta ordem:

```markdown
# Processo operacional da Ogura Rep

## 1. Visão geral
## 2. Papéis e responsabilidades
## 3. Processo operacional atual
### 3.1. Recebimento da solicitação do cliente
### 3.2. Cotação com fornecedores
### 3.3. Emissão e registro do pedido
### 3.4. Acompanhamento da carga e da entrega
### 3.5. Tratamento de inconsistências
### 3.6. Pagamentos, recebimentos e cobranças
### 3.7. Apuração e cobrança de comissões
## 4. Controles e documentos utilizados
## 5. Resumo do fluxo atual
## 6. Propostas de melhorias
```

- [x] **Etapa 2: Redigir o processo atual**

Descrever cada etapa usando apenas os fatos de `Modelo.md`. Quando a ordem exata não estiver documentada, empregar formulações neutras, como “ao longo do atendimento” ou “após a formalização do pedido”, sem criar aprovações ou prazos.

- [x] **Etapa 3: Redigir as propostas de melhorias**

Apresentar recomendações compatíveis com os problemas observáveis na fonte:

- centralização dos controles hoje distribuídos em planilhas;
- geração automática e única do número do pedido;
- padronização dos dados e dos status do pedido;
- registro centralizado das interações com clientes e fornecedores;
- alertas de prazos, pagamentos, cobranças e comissões;
- relatórios gerenciais e histórico rastreável;
- definição formal de responsabilidades e procedimentos.

Identificar explicitamente essas medidas como propostas ainda não incorporadas ao processo atual.

- [x] **Etapa 4: Verificar a cobertura do conteúdo**

Executar:

```bash
rg -n "Luiz|Luiza|Tiele|ROL de Pedidos|Recebimentos|Relatório de Acerto|Controle - Brasil Flora - Anual|PIX|cheque|correio|comiss" Processo-Ogura-Rep.md
```

Resultado esperado: todos os termos aparecem em contextos coerentes com `Modelo.md`.

- [x] **Etapa 5: Verificar estrutura e linguagem provisória**

Executar:

```bash
rg -n '^#{1,3} ' Processo-Ogura-Rep.md
rg -n 'PREENCHER_POSTERIORMENTE|CONTEUDO_PENDENTE' Processo-Ogura-Rep.md
```

Resultado esperado: a primeira execução mostra todos os títulos previstos; a segunda não retorna ocorrências.

- [x] **Etapa 6: Revisar o documento contra a fonte**

Comparar `Processo-Ogura-Rep.md` com `Modelo.md` e confirmar que nenhuma recomendação foi apresentada como prática atual e que nenhuma responsabilidade desconhecida foi atribuída a uma pessoa específica.

- [x] **Etapa 7: Registrar a alteração no controle de versão, se disponível**

Este diretório não contém atualmente um repositório Git. Se o arquivo for posteriormente incorporado a um repositório, usar:

```bash
git add Processo-Ogura-Rep.md
git commit -m "docs: descreve processo operacional da Ogura Rep"
```
