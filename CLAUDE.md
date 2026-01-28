# CLAUDE.md - Instruções para Claude Code

## Visão Geral do Projeto

Calculadora de correção monetária para cumprimento de sentença judicial. Calcula correção monetária (IPCA, INPC, IGP-M, etc.) e juros de mora a partir da data de citação.

## Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite 7
- **Estilização:** Tailwind CSS 3 + shadcn/ui (Radix)
- **APIs:** Banco Central do Brasil (índices), Anthropic Claude (extração de documentos)
- **Documentos:** jsPDF (PDF), docx (DOCX)

## Estrutura de Arquivos Importantes

```
src/
├── components/Calculator.tsx    # Componente principal - orquestra todo o fluxo
├── components/DocumentUpload.tsx # Upload e extração de PDF via Claude
├── components/AuthorList.tsx    # Gerenciamento de múltiplos autores
├── components/ResultPanel.tsx   # Exibição de resultados e downloads
├── services/bcb.ts              # Chamadas à API do Banco Central
├── services/cache.ts            # Cache de índices no localStorage
├── services/calculo.ts          # Lógica de cálculo de correção e juros
├── services/extracao.ts         # Integração com Claude API
├── services/pdf.ts              # Geração de memória de cálculo PDF
├── services/docx.ts             # Geração de petição DOCX
├── types/index.ts               # Interfaces e tipos TypeScript
└── lib/utils.ts                 # Funções utilitárias (formatação, etc.)
```

## Fluxo Principal

1. Usuário faz upload de PDF da sentença (opcional)
2. Claude extrai: autores, valores, tribunal, índice, juros
3. Usuário revisa/completa dados (data de citação é obrigatória)
4. Sistema busca índices na API BCB (com fallback para cache)
5. Calcula correção monetária e juros
6. Gera memória de cálculo (PDF) e petição (DOCX)

## Códigos das Séries BCB

| Índice | Código |
|--------|--------|
| IPCA | 433 |
| INPC | 188 |
| IGP-M | 189 |
| Selic | 11 |
| TR | 226 |

## Proxy para API Anthropic

A API da Anthropic não aceita chamadas diretas do browser (CORS). O Vite está configurado com proxy:

- Frontend chama: `/api/anthropic/v1/messages`
- Proxy redireciona para: `https://api.anthropic.com/v1/messages`
- Headers adicionados automaticamente: `x-api-key`, `anthropic-version`, `anthropic-dangerous-direct-browser-access`

## Variáveis de Ambiente

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

## Comandos Úteis

```bash
npm run dev      # Desenvolvimento
npm run build    # Build produção
npm run lint     # Linting
```

## Padrões de Código

- Componentes funcionais com hooks
- Tipos explícitos (sem `any`)
- Path alias: `@/` aponta para `src/`
- Formatação de moeda: `formatCurrency()` em `lib/utils.ts`
- Formatação de data BR: `formatDateToBR()` em `lib/utils.ts`

## Considerações de Segurança

- API key nunca exposta no frontend (passa pelo proxy)
- Cache local não contém dados sensíveis
- Documentos gerados localmente (não enviados a servidor)

## TODO / Melhorias Futuras

- [ ] Adicionar testes unitários
- [ ] Implementar PWA para uso offline completo
- [ ] Adicionar suporte a mais tribunais com regras específicas
- [ ] Histórico de cálculos salvos localmente
- [ ] Exportar para Excel
