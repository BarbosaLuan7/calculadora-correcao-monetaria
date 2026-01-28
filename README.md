# Calculadora de Correção Monetária

Calculadora para cálculo de correção monetária e juros de mora em cumprimento de sentença judicial.

## Funcionalidades

- **Upload de sentença com IA** - Extração automática de dados via Claude API (PDF/imagens)
- **Cálculo de correção monetária** - IPCA, INPC, IGP-M, Selic, TR (via API BCB)
- **Cálculo de juros de mora** - 1% ao mês, Selic, ou Selic-IPCA
- **Múltiplos autores** - Suporte a vários exequentes com valores individuais
- **Cache local** - Funciona offline com dados pré-carregados
- **Geração de PDF** - Memória de cálculo detalhada
- **Geração de DOCX** - Petição de cumprimento de sentença

## Tecnologias

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- Radix UI (shadcn/ui)
- jsPDF (geração de PDF)
- docx (geração de DOCX)
- API Banco Central do Brasil (índices econômicos)
- Claude API (extração de documentos)

## Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd calculadora-correcao-monetaria

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua API key do Anthropic

# Inicie o servidor de desenvolvimento
npm run dev
```

## Configuração

### Variáveis de Ambiente

```env
# API Key do Anthropic (Claude) para extração automática
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

A API key pode ser obtida em: https://console.anthropic.com/

### Sem API Key

A calculadora funciona normalmente sem a API key - você só precisa preencher os dados manualmente ao invés de usar a extração automática.

## Uso

1. **Upload (opcional)** - Faça upload do PDF da sentença para extração automática
2. **Dados do processo** - Preencha número do processo, tribunal e vara
3. **Parâmetros** - Configure data da citação, índice de correção e tipo de juros
4. **Autores** - Adicione os autores/exequentes com seus valores principais
5. **Calcular** - Clique em "Calcular Correção"
6. **Download** - Baixe a memória de cálculo (PDF) e/ou petição (DOCX)

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

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes base (Button, Input, etc.)
│   ├── Calculator.tsx   # Componente principal
│   ├── DocumentUpload.tsx
│   ├── AuthorList.tsx
│   └── ResultPanel.tsx
├── services/
│   ├── bcb.ts           # API Banco Central
│   ├── cache.ts         # Cache localStorage
│   ├── calculo.ts       # Lógica de correção
│   ├── extracao.ts      # Claude API
│   ├── pdf.ts           # Geração de memória
│   └── docx.ts          # Geração de petição
├── types/
│   └── index.ts         # Tipos TypeScript
├── lib/
│   └── utils.ts         # Funções utilitárias
└── App.tsx
```

## API do Banco Central

Os índices são obtidos da API pública do BCB (Sistema Gerenciador de Séries Temporais):

```
https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados
```

### Limitações da API BCB

- Máximo de 10 anos por consulta
- Endpoint "últimos N" limitado a 20 registros
- Sem rate limit explícito, mas uso abusivo pode resultar em bloqueio

## Scripts

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificação de código
```

## Licença

MIT
