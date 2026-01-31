# Calculadora de Correção Monetária

[![Deploy](https://github.com/BarbosaLuan7/calculadora-correcao-monetaria/actions/workflows/deploy.yml/badge.svg)](https://github.com/BarbosaLuan7/calculadora-correcao-monetaria/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/demo-online-brightgreen)](https://barbosaluan7.github.io/calculadora-correcao-monetaria/)

Ferramenta profissional para cálculo de correção monetária e juros de mora em cumprimento de sentença judicial. Desenvolvida para **Luan Barbosa Advocacia Especializada**.

**Acesse:** https://barbosaluan7.github.io/calculadora-correcao-monetaria/

---

## Funcionalidades

### Extração Inteligente com IA
- Upload de sentenças em PDF ou imagem
- Extração automática via **Claude Opus 4.5** (modelo mais avançado da Anthropic)
- Identifica automaticamente: autores, valores, datas, tribunal, índice de correção e juros

### Cálculo Preciso
- **Dano moral e material separados** com datas base distintas (conforme jurisprudência)
- Índices oficiais do Banco Central do Brasil (IPCA, INPC, IGP-M, Selic, TR)
- Juros de mora: 1% ao mês, Selic, ou Selic-IPCA (juros reais)
- **Marco inicial dos juros configurável** (citação, evento danoso ou desembolso)
- Suporte a múltiplos autores/exequentes

### Documentos Prontos para Uso
- **Memória de Cálculo (PDF)** - Detalhamento completo com tabelas separadas por verba
- **Petição (DOCX)** - Modelo de cumprimento de sentença editável

### Funciona Offline
- Cache local de índices econômicos
- Continua funcionando mesmo sem conexão

---

## Regras Jurídicas Aplicadas

O sistema aplica automaticamente as regras corretas para cada tipo de verba:

| Tipo de Dano | Correção Monetária | Juros de Mora | Fundamento |
|--------------|-------------------|---------------|------------|
| **Material** | Desde o ajuizamento | Desde a citação | Art. 405 CC |
| **Moral** | Desde a sentença | Desde a citação | Súmula 362 STJ |

---

## Como Usar

1. **Upload (opcional)** - Faça upload do PDF da sentença para extração automática com IA
2. **Datas do Processo** - Preencha: ajuizamento, sentença e citação
3. **Parâmetros** - Configure índice de correção e tipo de juros conforme a sentença
4. **Autores** - Adicione os exequentes com valores de dano moral e/ou material
5. **Calcular** - Clique em "Calcular Correção"
6. **Download** - Baixe a memória de cálculo (PDF) e/ou petição (DOCX)

---

## Índices Suportados

| Índice | Código BCB | Descrição |
|--------|------------|-----------|
| **IPCA** | 433 | Índice de Preços ao Consumidor Amplo (mais comum) |
| **INPC** | 188 | Índice Nacional de Preços ao Consumidor |
| **IGP-M** | 189 | Índice Geral de Preços do Mercado |
| **Selic** | 11 | Taxa Selic (inclui correção + juros) |
| **TR** | 226 | Taxa Referencial |

---

## Tipos de Juros de Mora

| Tipo | Descrição | Uso Comum |
|------|-----------|-----------|
| **1% ao mês** | Juros simples de 1% ao mês | Regra geral (Art. 406 CC) |
| **Selic** | Taxa Selic acumulada | Fazenda Pública |
| **Selic - IPCA** | Juros reais | EC 113/2021 |

---

## Marco Inicial dos Juros

| Marco | Fundamento | Quando Usar |
|-------|------------|-------------|
| **Citação** | Art. 405 CC | Regra geral - obrigações contratuais |
| **Evento Danoso** | Súmula 54 STJ | Responsabilidade extracontratual |
| **Desembolso** | Art. 398 CC | Danos emergentes com data de pagamento |

---

## Tecnologias

- **Frontend:** React 19 + TypeScript + Vite 7
- **UI:** Tailwind CSS 3 + Radix UI (shadcn/ui)
- **Design:** Design System próprio baseado no Branding Book 2024
- **IA:** Claude Opus 4.5 (Anthropic) para extração de documentos
- **APIs:** Banco Central do Brasil (séries temporais)
- **Documentos:** jsPDF + docx
- **Deploy:** GitHub Pages + Cloudflare Workers

---

## Design System

Interface moderna e profissional baseada no **Branding Book 2024**:

- **Tema:** Light mode elegante com fundo cinza sutil (#f3f4f6)
- **Cards:** Brancos com sombras suaves
- **Tipografia:** Plus Jakarta Sans (moderna e premium)
- **Cores:** Primary (#2f3a44), Gold (#93784a) para CTAs
- **Componentes:** Inputs arredondados, transições suaves (300ms)

---

## Arquitetura

```
┌─────────────────────┐     ┌──────────────────────────────────────┐
│   GitHub Pages      │     │   Cloudflare Worker                  │
│   (Frontend)        │────▶│   (Proxy Seguro - API Anthropic)     │
└─────────────────────┘     └──────────────────────────────────────┘
         │                                    │
         │                                    ▼
         │                  ┌──────────────────────────────────────┐
         │                  │   Claude Opus 4.5 (Anthropic)        │
         │                  │   Extração inteligente de sentenças  │
         │                  └──────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│   API BCB           │
│   Índices oficiais  │
└─────────────────────┘
```

---

## Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/BarbosaLuan7/calculadora-correcao-monetaria.git
cd calculadora-correcao-monetaria

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A calculadora funciona normalmente sem configuração adicional. A extração por IA utiliza o proxy em produção.

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (localhost:5173) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificação de código |

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── Calculator.tsx      # Componente principal (orquestrador)
│   ├── DocumentUpload.tsx  # Upload e extração de PDF
│   ├── AuthorList.tsx      # Gerenciamento de autores
│   └── ResultPanel.tsx     # Exibição de resultados e downloads
├── services/
│   ├── bcb.ts              # Integração API Banco Central
│   ├── cache.ts            # Cache localStorage
│   ├── calculo.ts          # Lógica de correção monetária
│   ├── extracao.ts         # Integração Claude Opus 4.5
│   ├── pdf.ts              # Geração de memória de cálculo
│   └── docx.ts             # Geração de petição
├── types/index.ts          # Interfaces TypeScript
└── lib/utils.ts            # Funções utilitárias

worker/                     # Cloudflare Worker (proxy seguro)
.github/workflows/          # GitHub Actions (CI/CD)
```

---

## Licença

MIT

---

Desenvolvido com dedicação para **Luan Barbosa Advocacia Especializada**
