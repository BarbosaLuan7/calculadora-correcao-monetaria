import { type DadosExtraidos, type Autor, type TipoIndice, type TipoJuros } from '@/types'

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

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
 */
const PROMPT_EXTRACAO = `Você é um assistente jurídico especializado em análise de sentenças judiciais brasileiras.

Analise o documento anexo (sentença judicial) e extraia as seguintes informações no formato JSON:

{
  "autores": [
    {
      "nome": "Nome completo do autor",
      "cpf": "CPF se disponível",
      "valorPrincipal": 0 // Valor em número (sem R$, sem pontos, vírgula como decimal)
    }
  ],
  "dataBase": "DD/MM/YYYY", // Data base para correção monetária
  "indiceCorrecao": "IPCA" | "INPC" | "IGP-M" | "SELIC" | "TR", // Índice determinado na sentença
  "tipoJuros": "SELIC" | "1_PORCENTO" | "SELIC_MENOS_IPCA", // Tipo de juros de mora
  "tribunal": "Ex: TJSP, TJRJ, TRF1",
  "numeroProcesso": "Número completo do processo",
  "vara": "Nome da vara"
}

REGRAS DE EXTRAÇÃO:

1. **Autores**: Identifique TODOS os autores/requerentes listados. Se houver valores individuais, extraia separadamente. Se houver apenas valor total, distribua igualmente.

2. **Índice de Correção**:
   - "IPCA" - se mencionar IPCA, Índice de Preços ao Consumidor Amplo, ou "índice oficial"
   - "INPC" - se mencionar INPC, Índice Nacional de Preços ao Consumidor
   - "IGP-M" - se mencionar IGP-M ou Índice Geral de Preços do Mercado
   - "SELIC" - se determinar correção pela Selic
   - "TR" - se mencionar Taxa Referencial

3. **Juros de Mora**:
   - "1_PORCENTO" - se mencionar 1% ao mês ou 12% ao ano
   - "SELIC" - se determinar juros pela Selic
   - "SELIC_MENOS_IPCA" - se mencionar "Selic menos IPCA" ou "juros reais"

4. **Data Base**: Procure por expressões como "a partir de", "desde", "data do ajuizamento", "data do dano".

5. **Valores**: Extraia valores numéricos. Converta "R$ 10.000,00" para 10000.00.

Se alguma informação não estiver disponível, deixe como null.

IMPORTANTE: Retorne APENAS o JSON, sem explicações adicionais.`

/**
 * Extrai dados de uma sentença usando Claude API
 */
export async function extrairDadosSentenca(file: File): Promise<DadosExtraidos> {
  if (!CLAUDE_API_KEY) {
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

  const response = await fetch('/api/anthropic/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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

    // Converte para formato esperado
    const autores: Autor[] = (parsed.autores || []).map((a: { nome: string; cpf?: string; valorPrincipal: number }, i: number) => ({
      id: `autor-${i + 1}`,
      nome: a.nome,
      cpf: a.cpf,
      valorPrincipal: typeof a.valorPrincipal === 'number' ? a.valorPrincipal : parseFloat(a.valorPrincipal) || 0
    }))

    return {
      autores,
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
