# CLAUDE.md - Instruções para Claude Code

## Visão Geral do Projeto

Calculadora de correção monetária para cumprimento de sentença judicial. Calcula correção monetária (IPCA, INPC, IGP-M, etc.) e juros de mora com suporte a dano moral e material separados.

**URL de Produção:** https://barbosaluan7.github.io/calculadora-correcao-monetaria/

## Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite 7
- **Estilização:** Tailwind CSS 3 + shadcn/ui (Radix)
- **APIs:** Banco Central do Brasil (índices), Anthropic Claude (extração de documentos)
- **Documentos:** jsPDF (PDF), docx (DOCX)
- **Deploy:** GitHub Pages + Cloudflare Workers (proxy API)

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
                            │   Anthropic API                      │
                            │   api.anthropic.com                  │
                            └──────────────────────────────────────┘
```

- **GitHub Pages:** Hospeda o frontend estático
- **Cloudflare Worker:** Proxy seguro para API Anthropic (evita expor API key)
- **GitHub Actions:** Deploy automático a cada push na main

## Estrutura de Arquivos

```
src/
├── components/
│   ├── Calculator.tsx       # Componente principal - orquestra todo o fluxo
│   ├── DocumentUpload.tsx   # Upload e extração de PDF via Claude
│   ├── AuthorList.tsx       # Gerenciamento de múltiplos autores
│   └── ResultPanel.tsx      # Exibição de resultados e downloads
├── services/
│   ├── bcb.ts               # Chamadas à API do Banco Central
│   ├── cache.ts             # Cache de índices no localStorage
│   ├── calculo.ts           # Lógica de cálculo de correção e juros
│   ├── extracao.ts          # Integração com Claude API
│   ├── pdf.ts               # Geração de memória de cálculo PDF
│   └── docx.ts              # Geração de petição DOCX
├── types/index.ts           # Interfaces e tipos TypeScript
└── lib/utils.ts             # Funções utilitárias

worker/
├── src/index.ts             # Cloudflare Worker (proxy Anthropic)
├── wrangler.toml            # Configuração do Worker
└── package.json

.github/workflows/
└── deploy.yml               # GitHub Actions para deploy automático
```

## Fluxo Principal

1. Usuário faz upload de PDF da sentença (opcional)
2. Claude extrai: autores, valores, datas, tribunal, índice, juros
3. Usuário revisa/completa dados
4. Sistema busca índices na API BCB (com fallback para cache)
5. Calcula correção monetária e juros separadamente para cada verba
6. Gera memória de cálculo (PDF) e petição (DOCX)

## Cálculo de Dano Moral e Material

O sistema suporta cálculo separado conforme regras jurídicas:

| Tipo de Dano | Correção Monetária | Juros de Mora |
|--------------|-------------------|---------------|
| **Material** | Desde ajuizamento | Desde citação |
| **Moral**    | Desde sentença (Súmula 362 STJ) | Desde citação |

## Códigos das Séries BCB

| Índice | Código |
|--------|--------|
| IPCA | 433 |
| INPC | 188 |
| IGP-M | 189 |
| Selic | 11 |
| TR | 226 |

## Desenvolvimento Local

### Pré-requisitos

```bash
npm install
```

### Variáveis de Ambiente

Criar arquivo `.env`:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Comandos

```bash
npm run dev      # Desenvolvimento (localhost:5173)
npm run build    # Build produção
npm run lint     # Linting
```

### Proxy Local

Em desenvolvimento, o Vite faz proxy para a API Anthropic:
- Frontend chama: `/api/anthropic/v1/messages`
- Proxy redireciona para: `https://api.anthropic.com/v1/messages`

## Deploy

### Deploy Automático

Push na branch `main` dispara GitHub Actions que:
1. Faz build do projeto
2. Deploy no GitHub Pages

### Deploy Manual do Worker

```bash
cd worker
CLOUDFLARE_API_TOKEN="xxx" CLOUDFLARE_ACCOUNT_ID="xxx" npx wrangler deploy
```

### Secrets do Worker

```bash
# Configurar API key da Anthropic
echo "sk-ant-xxx" | npx wrangler secret put ANTHROPIC_API_KEY
```

## Padrões de Código

- Componentes funcionais com hooks
- Tipos explícitos (sem `any`)
- Path alias: `@/` aponta para `src/`
- Formatação de moeda: `formatCurrency()` em `lib/utils.ts`
- Formatação de data BR: `formatDateToBR()` em `lib/utils.ts`

## Considerações de Segurança

- API key da Anthropic armazenada como secret no Cloudflare Worker
- Frontend não tem acesso direto à API key
- Cache local não contém dados sensíveis
- Documentos gerados localmente (não enviados a servidor)

## TODO / Melhorias Futuras

### Prioridade Média

- [ ] Adicionar testes unitários
- [ ] Implementar PWA para uso offline completo
- [ ] Adicionar suporte a mais tribunais com regras específicas
- [ ] Histórico de cálculos salvos localmente

### Prioridade Baixa

- [ ] Exportar para Excel
- [ ] Domínio customizado
