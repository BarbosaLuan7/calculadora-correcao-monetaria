/**
 * Serviço de integração com a API do Banco Central do Brasil (BCB)
 *
 * Utiliza o Sistema Gerenciador de Séries Temporais (SGS) para buscar
 * índices econômicos como IPCA, INPC, IGP-M, Selic e TR.
 *
 * Documentação: https://dadosabertos.bcb.gov.br/dataset/taxas-de-juros-de-operacoes-de-credito
 *
 * @module services/bcb
 */

import { type TipoIndice, type IndiceData, CODIGOS_SERIES_BCB, type APIBCBResponse } from '@/types'

const API_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

/**
 * Busca dados de uma série do BCB
 * @param codigo Código da série (ex: 433 para IPCA)
 * @param dataInicial Data inicial no formato DD/MM/YYYY
 * @param dataFinal Data final no formato DD/MM/YYYY
 */
async function fetchSerie(
  codigo: number,
  dataInicial: string,
  dataFinal: string
): Promise<APIBCBResponse[]> {
  const url = `${API_BASE}.${codigo}/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro ao buscar série ${codigo}: ${response.status}`)
  }

  return response.json()
}

/**
 * Busca os últimos N valores de uma série
 */
async function fetchUltimos(codigo: number, quantidade: number = 12): Promise<APIBCBResponse[]> {
  // Limite do BCB é 20 registros
  const qtd = Math.min(quantidade, 20)
  const url = `${API_BASE}.${codigo}/dados/ultimos/${qtd}?formato=json`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro ao buscar últimos valores da série ${codigo}: ${response.status}`)
  }

  return response.json()
}

/**
 * Busca índice por tipo e período
 */
export async function buscarIndice(
  tipo: TipoIndice,
  dataInicial: Date,
  dataFinal: Date
): Promise<IndiceData[]> {
  const codigo = CODIGOS_SERIES_BCB[tipo]

  // Valida se as datas são válidas
  if (isNaN(dataInicial.getTime()) || isNaN(dataFinal.getTime())) {
    throw new Error('Datas inválidas. Use o formato DD/MM/AAAA.')
  }

  // Formata datas para DD/MM/YYYY
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // BCB limita a 10 anos por consulta, dividir se necessário
  const diffYears = (dataFinal.getFullYear() - dataInicial.getFullYear())

  if (diffYears > 10) {
    // Divide em múltiplas consultas
    const resultados: IndiceData[] = []
    let currentStart = new Date(dataInicial)

    while (currentStart < dataFinal) {
      const currentEnd = new Date(currentStart)
      currentEnd.setFullYear(currentEnd.getFullYear() + 10)

      if (currentEnd > dataFinal) {
        currentEnd.setTime(dataFinal.getTime())
      }

      const dados = await fetchSerie(
        codigo,
        formatDate(currentStart),
        formatDate(currentEnd)
      )

      resultados.push(...dados.map(d => ({
        data: d.data,
        valor: parseFloat(d.valor)
      })))

      currentStart = new Date(currentEnd)
      currentStart.setMonth(currentStart.getMonth() + 1)
    }

    return resultados
  }

  const dados = await fetchSerie(
    codigo,
    formatDate(dataInicial),
    formatDate(dataFinal)
  )

  return dados.map(d => ({
    data: d.data,
    valor: parseFloat(d.valor)
  }))
}

/**
 * Busca últimos valores de um índice
 */
export async function buscarUltimosIndices(
  tipo: TipoIndice,
  quantidade: number = 12
): Promise<IndiceData[]> {
  const codigo = CODIGOS_SERIES_BCB[tipo]
  const dados = await fetchUltimos(codigo, quantidade)

  return dados.map(d => ({
    data: d.data,
    valor: parseFloat(d.valor)
  }))
}

/**
 * Verifica se a API do BCB está acessível
 */
export async function verificarConexaoBCB(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}.433/dados/ultimos/1?formato=json`)
    return response.ok
  } catch {
    return false
  }
}
