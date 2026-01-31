import { type DadosExtraidos, type Autor, type ConfiguracaoVerba, type TipoIndice, type TipoJuros } from '@/types'
import { normalizeDateBR } from '@/lib/utils'

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
const WORKER_URL = 'https://calculadora-correcao-proxy.garantedireito.workers.dev'
const IS_PRODUCTION = import.meta.env.PROD

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | { type: string; source?: { type: string; media_type: string; data: string }; text?: string }[]
}

interface AnthropicResponse {
  content: { type: string; text: string }[]
}

/**
 * Converte arquivo para base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove o prefixo "data:application/pdf;base64,"
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}

/**
 * Prompt para extração de dados da sentença
 * Atualizado para extrair 4 parâmetros independentes por verba
 */
const PROMPT_EXTRACAO = `Você é um assistente jurídico especializado em análise de sentenças judiciais brasileiras para cálculo de cumprimento de sentença.

<task>
Analise cuidadosamente o documento judicial anexo e extraia as informações necessárias para cálculo de correção monetária e juros de mora.

IMPORTANTE: O sistema suporta parâmetros INDEPENDENTES para cada verba (dano material e dano moral). Cada verba pode ter:
- Data diferente de início da correção monetária
- Índice de correção diferente
- Data diferente de início dos juros de mora
- Tipo de juros diferente
</task>

<output_format>
Retorne APENAS um objeto JSON válido, sem texto adicional, comentários ou marcadores de código.

Estrutura esperada:
{
  "autores": [
    {
      "nome": "string",
      "cpf": "string ou null",
      "danoMaterial": {
        "valor": number,
        "dataInicioCorrecao": "DD/MM/YYYY",
        "indiceCorrecao": "IPCA | INPC | IGP-M | SELIC | TR",
        "dataInicioJuros": "DD/MM/YYYY",
        "tipoJuros": "SELIC | 1_PORCENTO | SELIC_MENOS_IPCA"
      } ou null,
      "danoMoral": {
        "valor": number,
        "dataInicioCorrecao": "DD/MM/YYYY",
        "indiceCorrecao": "IPCA | INPC | IGP-M | SELIC | TR",
        "dataInicioJuros": "DD/MM/YYYY",
        "tipoJuros": "SELIC | 1_PORCENTO | SELIC_MENOS_IPCA"
      } ou null,
      "valorPrincipal": number
    }
  ],
  "dataAjuizamento": "DD/MM/YYYY ou null",
  "dataSentenca": "DD/MM/YYYY ou null",
  "dataCitacao": "DD/MM/YYYY ou null",
  "dataEventoDanoso": "DD/MM/YYYY ou null",
  "tribunal": "string ou null",
  "numeroProcesso": "string ou null",
  "vara": "string ou null"
}
</output_format>

<extraction_rules>

<rule name="autores">
Identifique TODOS os autores/requerentes/demandantes listados no processo.
- Extraia o nome completo conforme aparece no documento
- Se houver CPF mencionado, extraia no formato XXX.XXX.XXX-XX
</rule>

<rule name="verbas" priority="critical">
Para CADA verba (dano material e dano moral), extraia os 4 parâmetros independentes:

1. **DANO MATERIAL** (se houver):
   - "valor": valor em reais (número decimal)
   - "dataInicioCorrecao": data de início da correção monetária
     → Procure: "desde o ajuizamento", "desde a data do desembolso", "desde o efetivo prejuízo", "desde o evento"
     → Se não especificado, use a data de ajuizamento
   - "indiceCorrecao": índice de correção monetária
     → IPCA, INPC, IGP-M, SELIC ou TR
   - "dataInicioJuros": data de início dos juros de mora
     → Regra geral: citação (Art. 405 CC)
     → Exceção extracontratual: evento danoso (Súmula 54 STJ)
   - "tipoJuros": tipo de juros de mora
     → "1_PORCENTO" (1% a.m.), "SELIC", ou "SELIC_MENOS_IPCA"

2. **DANO MORAL** (se houver):
   - "valor": valor em reais (número decimal)
   - "dataInicioCorrecao": data de início da correção monetária
     → IMPORTANTE: Súmula 362 STJ determina correção desde a data do ARBITRAMENTO (sentença)
     → Procure: "desde a sentença", "desde o arbitramento", "desta data"
     → Se não especificado, use a data da sentença
   - "indiceCorrecao": índice de correção monetária
   - "dataInicioJuros": data de início dos juros de mora
     → Mesma lógica do dano material (citação ou evento)
   - "tipoJuros": tipo de juros de mora

Exemplos de sentenças e como extrair:

EXEMPLO 1 - Sentença Clássica:
"Condeno ao pagamento de R$ 10.000,00 a título de danos materiais e R$ 5.000,00 de danos morais,
ambos corrigidos pelo IPCA desde o ajuizamento (material) e sentença (moral),
com juros de 1% ao mês desde a citação."
→ danoMaterial: { valor: 10000, dataInicioCorrecao: [ajuizamento], indiceCorrecao: "IPCA", dataInicioJuros: [citação], tipoJuros: "1_PORCENTO" }
→ danoMoral: { valor: 5000, dataInicioCorrecao: [sentença], indiceCorrecao: "IPCA", dataInicioJuros: [citação], tipoJuros: "1_PORCENTO" }

EXEMPLO 2 - Responsabilidade Extracontratual:
"Condeno em R$ 20.000,00 de danos morais, corrigidos desde esta data,
com juros de mora desde o evento danoso (15/01/2020)."
→ danoMoral: { valor: 20000, dataInicioCorrecao: [data sentença], indiceCorrecao: "IPCA", dataInicioJuros: "15/01/2020", tipoJuros: "1_PORCENTO" }

</rule>

<rule name="valor_unico">
Se houver apenas um valor total de condenação SEM separação de verbas:
- Preencha "valorPrincipal" com o valor total
- Deixe "danoMaterial" e "danoMoral" como null
- O sistema usará parâmetros globais para o cálculo
</rule>

<rule name="datas" priority="critical">
As datas são essenciais para o cálculo correto:

- **dataAjuizamento**: "ajuizada em", "distribuída em", "proposta em", data da distribuição
  → Usada como fallback para correção do dano material

- **dataSentenca**: data de prolação da sentença, "julgado em", "proferida em"
  → Usada como fallback para correção do dano moral

- **dataCitacao**: "citado em", "citação válida em", "AR juntado em"
  → Usada como fallback para início dos juros de mora

- **dataEventoDanoso**: "evento ocorrido em", "acidente em", "data do fato"
  → Usada para responsabilidade extracontratual (Súmula 54 STJ)

Formato: DD/MM/YYYY (ex: 15/03/2022)
</rule>

<rule name="indice_correcao">
Identifique qual índice de correção monetária a sentença determina:
- "IPCA" → IPCA, IPCA-E, Índice de Preços ao Consumidor Amplo, "índice oficial"
- "INPC" → INPC, Índice Nacional de Preços ao Consumidor
- "IGP-M" → IGP-M, Índice Geral de Preços do Mercado
- "SELIC" → correção pela taxa Selic (quando usar Selic como correção + juros)
- "TR" → Taxa Referencial

Se não especificado, use "IPCA" como padrão.
</rule>

<rule name="juros_mora">
Identifique qual taxa de juros de mora a sentença determina:
- "1_PORCENTO" → 1% ao mês, 12% ao ano, juros legais do Código Civil
- "SELIC" → juros pela taxa Selic
- "SELIC_MENOS_IPCA" → "Selic menos IPCA", "juros reais", EC 113/2021

Se não especificado, use "1_PORCENTO" como padrão.
</rule>

<rule name="identificacao_processo">
- **tribunal**: TJSP, TJRJ, TJMG, TRF1, TRF2, TRF3, TRF4, TRF5, TRT, etc.
- **numeroProcesso**: número CNJ completo (NNNNNNN-NN.NNNN.N.NN.NNNN) ou formato antigo
- **vara**: "1ª Vara Cível", "2ª Vara do Trabalho", "Juizado Especial Cível", etc.
</rule>

</extraction_rules>

<important>
- Leia o documento completo antes de extrair os dados
- Se uma informação não estiver claramente presente, use null
- Números devem ser tipo number, não string (10000.00, não "10000.00")
- Datas devem estar no formato DD/MM/YYYY
- Priorize identificar parâmetros ESPECÍFICOS para cada verba
- Se a sentença menciona datas diferentes para correção vs juros, capture isso
- Retorne SOMENTE o JSON, nada mais
</important>`

/**
 * Extrai dados de uma sentença usando Claude API
 */
export async function extrairDadosSentenca(file: File): Promise<DadosExtraidos> {
  // Em produção usa o Worker (não precisa de API key local)
  if (!IS_PRODUCTION && !CLAUDE_API_KEY) {
    throw new Error('API key do Claude não configurada. Defina VITE_ANTHROPIC_API_KEY no arquivo .env')
  }

  const base64 = await fileToBase64(file)
  const mediaType = file.type === 'application/pdf' ? 'application/pdf' : 'image/png'

  const messages: AnthropicMessage[] = [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64
          }
        },
        {
          type: 'text',
          text: PROMPT_EXTRACAO
        }
      ]
    }
  ]

  // Em produção usa o Worker do Cloudflare, em dev usa o proxy do Vite
  const apiUrl = IS_PRODUCTION ? WORKER_URL : '/api/anthropic/v1/messages'

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 16384,
      messages
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro na API do Claude: ${response.status} - ${error}`)
  }

  const data: AnthropicResponse = await response.json()
  const textContent = data.content.find(c => c.type === 'text')

  if (!textContent) {
    throw new Error('Resposta inválida da API')
  }

  // Extrai JSON da resposta
  let jsonStr = textContent.text.trim()

  // Remove possíveis marcadores de código
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }

  try {
    const parsed = JSON.parse(jsonStr.trim())

    // Função auxiliar para converter valor
    const parseValor = (v: unknown): number => {
      if (typeof v === 'number') return v
      if (typeof v === 'string') return parseFloat(v) || 0
      return 0
    }

    // Função auxiliar para converter ConfiguracaoVerba
    const parseConfigVerba = (v: unknown): ConfiguracaoVerba | undefined => {
      if (!v || typeof v !== 'object') return undefined

      const config = v as Record<string, unknown>
      const valor = parseValor(config.valor)

      if (valor <= 0) return undefined

      return {
        valor,
        dataInicioCorrecao: normalizeDateBR(config.dataInicioCorrecao as string) || '',
        indiceCorrecao: (config.indiceCorrecao as TipoIndice) || 'IPCA',
        dataInicioJuros: normalizeDateBR(config.dataInicioJuros as string) || '',
        tipoJuros: (config.tipoJuros as TipoJuros) || '1_PORCENTO'
      }
    }

    // Converte para formato esperado
    const autores: Autor[] = (parsed.autores || []).map((a: Record<string, unknown>, i: number) => {
      const danoMaterial = parseConfigVerba(a.danoMaterial)
      const danoMoral = parseConfigVerba(a.danoMoral)

      return {
        id: `autor-${i + 1}`,
        nome: a.nome as string,
        cpf: a.cpf as string | undefined,
        // Novo formato
        danoMaterial,
        danoMoral,
        // Legado
        valorPrincipal: parseValor(a.valorPrincipal),
        valorDanoMaterial: danoMaterial?.valor,
        valorDanoMoral: danoMoral?.valor
      }
    })

    return {
      autores,
      // Normaliza datas para formato DD/MM/YYYY (trata MM/YYYY -> 01/MM/YYYY)
      dataAjuizamento: normalizeDateBR(parsed.dataAjuizamento),
      dataSentenca: normalizeDateBR(parsed.dataSentenca),
      dataCitacao: normalizeDateBR(parsed.dataCitacao),
      dataBase: normalizeDateBR(parsed.dataBase),
      tribunal: parsed.tribunal || undefined,
      numeroProcesso: parsed.numeroProcesso || undefined,
      vara: parsed.vara || undefined
    }
  } catch {
    console.error('Erro ao parsear resposta:', jsonStr)
    throw new Error('Não foi possível extrair dados do documento')
  }
}

/**
 * Extrai dados sem API (modo manual/fallback)
 */
export function criarDadosVazios(): DadosExtraidos {
  return {
    autores: [{
      id: 'autor-1',
      nome: '',
      valorPrincipal: 0
    }]
  }
}
