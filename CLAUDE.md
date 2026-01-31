# CLAUDE.md - Instruções para Claude Code

## Visão Geral do Projeto

Calculadora de correção monetária para cumprimento de sentença judicial, desenvolvida para **Luan Barbosa Advocacia Especializada**.

Calcula correção monetária (IPCA, INPC, IGP-M, Selic, TR) e juros de mora com suporte a:
- Dano moral e material separados (datas base distintas)
- Múltiplos autores/exequentes
- Extração automática de sentenças via IA

**URL de Produção:** https://barbosaluan7.github.io/calculadora-correcao-monetaria/

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | React 19 + TypeScript + Vite 7 |
| **Estilização** | Tailwind CSS 3 + shadcn/ui (Radix) |
| **IA** | Claude Opus 4.5 (`claude-opus-4-5-20251101`) |
| **APIs** | Banco Central do Brasil (séries temporais SGS) |
| **Documentos** | jsPDF (memória de cálculo), docx (petição) |
| **Deploy** | GitHub Pages + Cloudflare Workers (proxy) |

---

## Arquitetura de Deploy

```
┌─────────────────────┐     ┌──────────────────────────────────────┐
│   GitHub Pages      │     │   Cloudflare Worker                  │
│   (Frontend)        │────▶│   calculadora-correcao-proxy         │
│                     │     │   .garantedireito.workers.dev        │
└─────────────────────┘     └──────────────────────────────────────┘
                                          │
                                          ▼
                            ┌──────────────────────────────────────┐
                            │   Claude Opus 4.5                    │
                            │   api.anthropic.com                  │
                            └──────────────────────────────────────┘
```

- **GitHub Pages:** Hospeda o frontend estático (deploy automático via GitHub Actions)
- **Cloudflare Worker:** Proxy seguro para API Anthropic (API key protegida como secret)
- **API BCB:** Chamada direta do frontend (pública, sem autenticação)

---

## Estrutura de Arquivos

```
src/
├── assets/
│   └── logo-lb.svg          # Logo do escritório (otimizado para dark bg)
├── components/
│   ├── Calculator.tsx       # Componente principal - orquestra todo o fluxo
│   ├── DocumentUpload.tsx   # Upload e extração de PDF via Claude
│   ├── AuthorList.tsx       # Gerenciamento de múltiplos autores
│   └── ResultPanel.tsx      # Exibição de resultados e downloads
├── services/
│   ├── bcb.ts               # Chamadas à API do Banco Central (com validação de datas)
│   ├── cache.ts             # Cache de índices no localStorage
│   ├── calculo.ts           # Lógica de cálculo de correção e juros
│   ├── extracao.ts          # Integração com Claude Opus 4.5
│   ├── pdf.ts               # Geração de memória de cálculo PDF
│   └── docx.ts              # Geração de petição DOCX
├── types/index.ts           # Interfaces e tipos TypeScript
└── lib/utils.ts             # Funções utilitárias (datas, moeda, números)

worker/
├── src/index.ts             # Cloudflare Worker (proxy Anthropic)
├── wrangler.toml            # Configuração do Worker
└── package.json

.github/workflows/
└── deploy.yml               # GitHub Actions para deploy automático
```

---

## Fluxo Principal

1. **Upload (opcional):** Usuário faz upload de PDF da sentença
2. **Extração IA:** Claude Opus 4.5 extrai autores, valores, datas, tribunal, índice, juros
3. **Revisão:** Usuário revisa e completa dados extraídos
4. **Busca índices:** Sistema busca índices na API BCB (com fallback para cache)
5. **Cálculo:** Correção monetária e juros calculados separadamente por verba
6. **Documentos:** Gera memória de cálculo (PDF) e petição (DOCX)

---

## Regras Jurídicas de Cálculo

| Tipo de Dano | Correção Monetária | Juros de Mora | Fundamento |
|--------------|-------------------|---------------|------------|
| **Material** | Desde ajuizamento | Desde citação | Art. 405 CC |
| **Moral** | Desde sentença | Desde citação | Súmula 362 STJ |

### Marco Inicial dos Juros

O sistema permite configurar o marco inicial dos juros de mora:

| Marco | Fundamento Legal | Quando Usar |
|-------|-----------------|-------------|
| **Citação** | Art. 405 CC | Regra geral - obrigações contratuais |
| **Evento Danoso** | Súmula 54 STJ | Responsabilidade extracontratual (ilícito) |
| **Desembolso** | Art. 398 CC | Danos emergentes com data específica de pagamento |

**Tipos definidos em `src/types/index.ts`:**
- `TipoMarcoJuros = 'CITACAO' | 'EVENTO_DANOSO' | 'DESEMBOLSO'`
- `NOMES_MARCO_JUROS` - Labels para exibição
- `FUNDAMENTOS_MARCO_JUROS` - Texto jurídico de cada marco

---

## Extração com Claude Opus 4.5

### Configuração (`src/services/extracao.ts`)

```typescript
model: 'claude-opus-4-5-20251101'
max_tokens: 16384
```

### Prompt Engineering

O prompt utiliza **melhores práticas da Anthropic**:

- **Tags XML** para estruturação clara:
  - `<task>` - Define a tarefa
  - `<output_format>` - Especifica formato JSON esperado
  - `<extraction_rules>` - Regras organizadas por categoria
  - `<rule name="..." priority="critical">` - Regras com prioridades
  - `<important>` - Instruções finais

- **Dados extraídos:**
  - Autores (nome, CPF, valores)
  - Datas (ajuizamento, sentença, citação)
  - Índice de correção (IPCA, INPC, IGP-M, Selic, TR)
  - Tipo de juros (1%, Selic, Selic-IPCA)
  - Identificação do processo (número, tribunal, vara)

### Normalização de Datas

O sistema aceita datas nos formatos:
- `DD/MM/YYYY` (padrão)
- `MM/YYYY` (convertido para `01/MM/YYYY`)
- `YYYY-MM-DD` (ISO)

Função: `normalizeDateBR()` em `lib/utils.ts`

---

## Códigos das Séries BCB

| Índice | Código | Descrição |
|--------|--------|-----------|
| IPCA | 433 | Índice de Preços ao Consumidor Amplo |
| INPC | 188 | Índice Nacional de Preços ao Consumidor |
| IGP-M | 189 | Índice Geral de Preços do Mercado |
| Selic | 11 | Taxa Selic |
| TR | 226 | Taxa Referencial |

**Endpoint:** `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados`

---

## Desenvolvimento Local

### Instalação

```bash
npm install
```

### Variáveis de Ambiente (opcional)

Criar arquivo `.env` para desenvolvimento local com IA:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

**Nota:** Em produção, a API key é gerenciada pelo Cloudflare Worker.

### Comandos

```bash
npm run dev      # Desenvolvimento (localhost:5173)
npm run build    # Build produção
npm run preview  # Preview do build
npm run lint     # Verificação de código
```

### Proxy Local

Em desenvolvimento, o Vite faz proxy para a API Anthropic:
- Frontend chama: `/api/anthropic/v1/messages`
- Proxy redireciona para: `https://api.anthropic.com/v1/messages`

---

## Deploy

### Deploy Automático (Frontend)

Push na branch `main` dispara GitHub Actions que:
1. Faz build do projeto
2. Deploy no GitHub Pages

### Deploy Manual (Worker)

```bash
cd worker
CLOUDFLARE_API_TOKEN="xxx" CLOUDFLARE_ACCOUNT_ID="xxx" npx wrangler deploy
```

### Secrets do Worker

```bash
echo "sk-ant-xxx" | npx wrangler secret put ANTHROPIC_API_KEY
```

---

## Padrões de Código

| Item | Padrão |
|------|--------|
| Componentes | Funcionais com hooks |
| Tipos | Explícitos (sem `any`) |
| Path alias | `@/` aponta para `src/` |
| Moeda | `formatCurrency()` |
| Data BR | `formatDateToBR()`, `parseDateBR()`, `normalizeDateBR()` |
| Números BR | `formatNumberBR()`, `parseNumber()` |

---

## Funções Utilitárias (`lib/utils.ts`)

| Função | Descrição |
|--------|-----------|
| `parseDateBR(str)` | Parse de data BR (aceita DD/MM/YYYY e MM/YYYY) |
| `formatDateToBR(date)` | Formata Date para DD/MM/YYYY |
| `normalizeDateBR(str)` | Normaliza qualquer formato para DD/MM/YYYY |
| `formatCurrency(num)` | Formata número para R$ X.XXX,XX |
| `parseNumber(str)` | Parse de número BR (1.234,56 → 1234.56) |
| `formatNumberBR(num)` | Formata número para padrão BR |
| `formatPercent(num)` | Formata percentual com 4 casas |

---

## Considerações de Segurança

- API key da Anthropic armazenada como secret no Cloudflare Worker
- Frontend não tem acesso direto à API key em produção
- Cache local não contém dados sensíveis
- Documentos gerados localmente (não enviados a servidor)
- Validação de datas antes de chamadas à API BCB

---

## Design System

Baseado no **Branding Book 2024** com estética **Light Mode Elegante**.

### Filosofia de Design

- **Clean & Professional**: Fundo cinza sutil com cards brancos
- **Minimalista**: Whitespace generoso, bordas suaves (rounded-xl/2xl)
- **Sofisticado**: Transições suaves (300ms), sombras sutis
- **Premium**: Tipografia moderna, acentos dourados elegantes

### Arquivos de Design

| Arquivo | Descrição |
|---------|-----------|
| `src/styles/design-tokens.ts` | Tokens de cor, tipografia, espaçamento |
| `src/index.css` | Variáveis CSS + componentes customizados |
| `tailwind.config.js` | Extensões do Tailwind com cores da marca |

### Paleta de Cores

| Nome | HEX | Variável CSS | Uso |
|------|-----|--------------|-----|
| Background | `#f3f4f6` | `--background` | Fundo da página |
| Card | `#ffffff` | `--card` | Cards e superfícies |
| Primary | `#2f3a44` | `--lb-primary` | Textos principais, header |
| Secondary | `#424e5b` | `--lb-secondary` | Labels, textos secundários |
| Gold | `#93784a` | `--lb-gold` | CTAs, botões, acentos |
| Gold Light | `#a8896a` | - | Hover do gold |
| Gray 50 | `#f9fafb` | - | Inputs, selects |
| Gray 200 | `#e5e7eb` | - | Bordas |
| Gray 400 | `#9ca3af` | - | Placeholders |
| Gray 500 | `#6b7280` | - | Textos muted |

### Tipografia

| Elemento | Fonte | Peso | Características |
|----------|-------|------|-----------------|
| Headings | Plus Jakarta Sans | 600 | tracking-tight (-0.02em) |
| Body | Plus Jakarta Sans | 400 | Legível, moderna |
| Labels | Plus Jakarta Sans | 500 | Cor secondary |

### Componentes Principais

#### Cards
```css
/* Card padrão - branco com sombra suave */
bg-white rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md
```

#### Inputs
```css
/* Input com fundo cinza claro */
bg-gray-50 border border-gray-200 rounded-xl
focus:border-[#93784a] focus:bg-white focus:ring-2 focus:ring-[rgba(147,120,74,0.15)]
```

#### Botões
```css
/* Botão Gold - CTA principal */
.btn-gold: bg-[#93784a] text-white rounded-xl shadow-lg hover:shadow-xl

/* Botão Outline - secundário */
bg-white border-gray-200 text-gray-600 hover:bg-gray-50
```

### Classes Utilitárias

```css
.shadow-gold      /* box-shadow: 0 4px 20px rgba(147,120,74,0.15) */
.shadow-soft      /* Sombra suave para cards */
.hover-lift       /* Elevação no hover com sombra */
.animate-reveal   /* Animação de entrada (fade + slide up) */
.text-gold        /* color: #93784a */
.bg-gradient-gold /* Gradiente dourado */
```

### Espaçamento

| Token | Valor | Uso |
|-------|-------|-----|
| Card padding | `py-5 px-6` | Padding interno dos cards |
| Section gap | `space-y-8` | Entre seções principais |
| Form gap | `space-y-4` | Entre campos de formulário |
| Grid gap | `gap-4` | Entre colunas do grid |

### Logo

- **Arquivo:** `src/assets/logo-lb.svg`
- **Exibição:** Container escuro (#2f3a44) com logo branco
- **Tamanhos:** w-40 (mobile), w-48 (tablet), w-56 (desktop)

---

## TODO / Melhorias Futuras

### Prioridade Alta
- [ ] Adicionar testes unitários para cálculos
- [ ] Validação de datas no frontend

### Prioridade Média
- [ ] PWA para uso offline completo
- [ ] Suporte a tribunais com regras específicas
- [ ] Histórico de cálculos salvos localmente

### Prioridade Baixa
- [ ] Exportar para Excel
- [ ] Domínio customizado
