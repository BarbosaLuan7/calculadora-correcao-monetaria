import { type DadosExtraidos, type Autor, type TipoIndice, type TipoJuros } from '@/types'

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
 * Segue melhores práticas de engenharia de prompt da Anthropic
 */
const PROMPT_EXTRACAO = `Você é um assistente jurídico especializado em análise de sentenças judiciais brasileiras para cálculo de cumprimento de sentença.

<task>
Analise cuidadosamente o documento judicial anexo e extraia as informações necessárias para cálculo de correção monetária e juros de mora.
</task>

<output_format>
Retorne APENAS um objeto JSON válido, sem texto adicional, comentários ou marcadores de código.

Estrutura esperada:
{
  "autores": [
    {
      "nome": "string",
      "cpf": "string ou null",
      "valorPrincipal": number,
      "valorDanoMaterial": number,
      "valorDanoMoral": number
    }
  ],
  "dataAjuizamento": "DD/MM/YYYY ou null",
  "dataSentenca": "DD/MM/YYYY ou null",
  "dataCitacao": "DD/MM/YYYY ou null",
  "dataBase": "DD/MM/YYYY ou null",
  "indiceCorrecao": "IPCA | INPC | IGP-M | SELIC | TR | null",
  "tipoJuros": "SELIC | 1_PORCENTO | SELIC_MENOS_IPCA | null",
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

<rule name="valores" priority="critical">
A sentença pode especificar valores de três formas:

1. **Valores SEPARADOS por tipo de dano:**
   - Se encontrar dano material E dano moral especificados separadamente, preencha:
     - "valorDanoMaterial": valor em reais (número decimal)
     - "valorDanoMoral": valor em reais (número decimal)
     - "valorPrincipal": 0

2. **Valor único total:**
   - Se houver apenas um valor total de condenação, preencha:
     - "valorPrincipal": valor em reais (número decimal)
     - "valorDanoMaterial": 0
     - "valorDanoMoral": 0

3. **Conversão de formato:**
   - "R$ 10.000,00" → 10000.00
   - "R$ 1.234,56" → 1234.56
   - Sempre use ponto como separador decimal

Exemplos de dano material: despesas médicas, lucros cessantes, prejuízos patrimoniais, passagens, despesas com transporte, reparos.
Exemplos de dano moral: indenização por sofrimento, abalo psicológico, constrangimento, dano extrapatrimonial.
</rule>

<rule name="datas" priority="critical">
As datas são essenciais para o cálculo correto. Procure atentamente:

- **dataAjuizamento**: "ajuizada em", "distribuída em", "proposta em", "data da distribuição", "protocolo inicial"
  → Usada para correção monetária do dano MATERIAL

- **dataSentenca**: data de prolação da sentença, "julgado em", data no cabeçalho/rodapé, "proferida em", "sentenciado em"
  → Usada para correção monetária do dano MORAL (Súmula 362 STJ)

- **dataCitacao**: "citado em", "citação válida em", "AR juntado em", "citação por edital", "comparecimento espontâneo"
  → Usada para início dos juros de mora

- **dataBase**: qualquer outra data mencionada como base para cálculo (fallback)

Formato: DD/MM/YYYY (ex: 15/03/2022)
</rule>

<rule name="indice_correcao">
Identifique qual índice de correção monetária a sentença determina:

- "IPCA" → IPCA, Índice de Preços ao Consumidor Amplo, "índice oficial", "índice do IBGE"
- "INPC" → INPC, Índice Nacional de Preços ao Consumidor
- "IGP-M" → IGP-M, Índice Geral de Preços do Mercado
- "SELIC" → correção pela taxa Selic
- "TR" → Taxa Referencial

Se não especificado, deixe null.
</rule>

<rule name="juros_mora">
Identifique qual taxa de juros de mora a sentença determina:

- "1_PORCENTO" → 1% ao mês, 12% ao ano, juros legais do Código Civil
- "SELIC" → juros pela taxa Selic
- "SELIC_MENOS_IPCA" → "Selic menos IPCA", "juros reais", EC 113/2021

Se não especificado, deixe null.
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
- Números devem ser tipo number, não string
- Datas devem estar no formato DD/MM/YYYY
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

    // Converte para formato esperado
    const autores: Autor[] = (parsed.autores || []).map((a: {
      nome: string
      cpf?: string
      valorPrincipal?: number
      valorDanoMaterial?: number
      valorDanoMoral?: number
    }, i: number) => ({
      id: `autor-${i + 1}`,
      nome: a.nome,
      cpf: a.cpf,
      valorPrincipal: parseValor(a.valorPrincipal),
      valorDanoMaterial: parseValor(a.valorDanoMaterial) || undefined,
      valorDanoMoral: parseValor(a.valorDanoMoral) || undefined
    }))

    return {
      autores,
      dataAjuizamento: parsed.dataAjuizamento || undefined,
      dataSentenca: parsed.dataSentenca || undefined,
      dataCitacao: parsed.dataCitacao || undefined,
      dataBase: parsed.dataBase || undefined,
      indiceCorrecao: parsed.indiceCorrecao as TipoIndice || undefined,
      tipoJuros: parsed.tipoJuros as TipoJuros || undefined,
      tribunal: parsed.tribunal || undefined,
      numeroProcesso: parsed.numeroProcesso || undefined,
      vara: parsed.vara || undefined
    }
  } catch (e) {
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
