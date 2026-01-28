# Calculadora de Correção Monetária

Calculadora de correção monetária e juros de mora para cumprimento de sentença judicial, com suporte a dano moral e material separados.

**Acesse:** https://barbosaluan7.github.io/calculadora-correcao-monetaria/

## Funcionalidades

- **Upload de sentença com IA** - Extração automática de dados via Claude API (PDF/imagens)
- **Dano moral e material separados** - Cálculo com datas base diferentes conforme regras jurídicas
- **Cálculo de correção monetária** - IPCA, INPC, IGP-M, Selic, TR (via API BCB)
- **Cálculo de juros de mora** - 1% ao mês, Selic, ou Selic-IPCA
- **Múltiplos autores** - Suporte a vários exequentes com valores individuais
- **Cache local** - Funciona offline com dados pré-carregados
- **Geração de PDF** - Memória de cálculo detalhada com tabelas separadas por verba
- **Geração de DOCX** - Petição de cumprimento de sentença

## Regras de Cálculo

O sistema aplica as regras jurídicas corretas para cada tipo de dano:

| Tipo de Dano | Correção Monetária | Juros de Mora |
|--------------|-------------------|---------------|
| **Material** | Desde ajuizamento | Desde citação |
| **Moral**    | Desde sentença (Súmula 362 STJ) | Desde citação |

## Tecnologias

- React 19 + TypeScript + Vite 7
- Tailwind CSS 3 + Radix UI (shadcn/ui)
- jsPDF (geração de PDF) + docx (geração de DOCX)
- API Banco Central do Brasil (índices econômicos)
- Claude API (extração de documentos)
- GitHub Pages + Cloudflare Workers (deploy)

## Uso Online

Acesse https://barbosaluan7.github.io/calculadora-correcao-monetaria/ e:

1. **Upload (opcional)** - Faça upload do PDF da sentença para extração automática
2. **Datas do processo** - Preencha ajuizamento, sentença e citação
3. **Parâmetros** - Configure índice de correção e tipo de juros
4. **Autores** - Adicione os autores com valores de dano moral e/ou material
5. **Calcular** - Clique em "Calcular Correção"
6. **Download** - Baixe a memória de cálculo (PDF) e/ou petição (DOCX)

## Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/BarbosaLuan7/calculadora-correcao-monetaria.git
cd calculadora-correcao-monetaria

# Instale as dependências
npm install

# Configure as variáveis de ambiente (opcional, para extração IA)
echo "VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx" > .env

# Inicie o servidor de desenvolvimento
npm run dev
```

A calculadora funciona normalmente sem a API key - você só precisa preencher os dados manualmente.

## Índices Suportados

| Índice | Código BCB | Descrição |
|--------|------------|-----------|
| IPCA | 433 | Índice de Preços ao Consumidor Amplo |
| INPC | 188 | Índice Nacional de Preços ao Consumidor |
| IGP-M | 189 | Índice Geral de Preços do Mercado |
| Selic | 11 | Taxa Selic |
| TR | 226 | Taxa Referencial |

## Tipos de Juros

- **1% ao mês** - Juros simples de 1% ao mês (12% ao ano)
- **Selic** - Taxa Selic acumulada
- **Selic - IPCA** - Juros reais (Selic menos inflação)

## Arquitetura

```
┌─────────────────────┐     ┌──────────────────────────────────────┐
│   GitHub Pages      │     │   Cloudflare Worker                  │
│   (Frontend)        │────▶│   (Proxy API Anthropic)              │
└─────────────────────┘     └──────────────────────────────────────┘
         │                                    │
         │                                    ▼
         │                  ┌──────────────────────────────────────┐
         │                  │   Anthropic API (Claude)             │
         │                  └──────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│   API BCB           │
│   (Índices)         │
└─────────────────────┘
```

## Estrutura do Projeto

```
src/
├── components/
│   ├── Calculator.tsx      # Componente principal
│   ├── DocumentUpload.tsx  # Upload e extração de PDF
│   ├── AuthorList.tsx      # Gerenciamento de autores
│   └── ResultPanel.tsx     # Exibição de resultados
├── services/
│   ├── bcb.ts              # API Banco Central
│   ├── cache.ts            # Cache localStorage
│   ├── calculo.ts          # Lógica de correção (dano moral/material)
│   ├── extracao.ts         # Claude API
│   ├── pdf.ts              # Geração de memória (tabelas separadas)
│   └── docx.ts             # Geração de petição
├── types/index.ts          # Tipos TypeScript
└── lib/utils.ts            # Funções utilitárias

worker/                     # Cloudflare Worker (proxy)
.github/workflows/          # GitHub Actions (deploy automático)
```

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificação de código
```

## Licença

MIT
