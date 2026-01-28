/**
 * Serviço de cálculo de correção monetária e juros de mora
 *
 * Implementa a lógica de cálculo para cumprimento de sentença judicial:
 * - Correção monetária: aplica índice (IPCA, INPC, IGP-M, etc.) mês a mês
 * - Juros de mora: 1% ao mês, Selic, ou Selic-IPCA (juros reais)
 *
 * Fórmula geral:
 *   Valor Total = Valor Corrigido + Juros
 *   Valor Corrigido = Principal × Fator de Correção
 *   Fator de Correção = Π (1 + índice_mês/100)
 *   Juros = Valor Corrigido × Percentual de Juros
 *
 * @module services/calculo
 */

import {
  type TipoIndice,
  type TipoJuros,
  type Autor,
  type IndiceData,
  type ResultadoCalculo,
  type DetalheCalculo
} from '@/types'
import { buscarIndicesComCache } from './cache'
import { parseDateBR } from '@/lib/utils'

/**
 * Calcula o fator de correção acumulado entre duas datas
 */
function calcularFatorCorrecao(indices: IndiceData[]): number {
  if (indices.length === 0) return 1

  let fator = 1
  for (const indice of indices) {
    fator *= (1 + indice.valor / 100)
  }
  return fator
}

/**
 * Calcula juros de mora de 1% ao mês
 */
function calcularJuros1Porcento(
  dataCitacao: Date,
  dataCalculo: Date
): { percentual: number; meses: number } {
  const meses =
    (dataCalculo.getFullYear() - dataCitacao.getFullYear()) * 12 +
    (dataCalculo.getMonth() - dataCitacao.getMonth())

  const percentual = meses * 0.01 // 1% ao mês
  return { percentual, meses }
}

/**
 * Calcula juros pela Selic acumulada
 */
async function calcularJurosSelic(
  dataCitacao: Date,
  dataCalculo: Date
): Promise<{ percentual: number; indices: IndiceData[] }> {
  const indices = await buscarIndicesComCache('SELIC', dataCitacao, dataCalculo)

  // Selic é taxa mensal, acumula
  let acumulado = 0
  for (const indice of indices) {
    acumulado += indice.valor / 100 // Selic já vem como percentual
  }

  return { percentual: acumulado, indices }
}

/**
 * Calcula juros Selic menos IPCA
 */
async function calcularJurosSelicMenosIPCA(
  dataCitacao: Date,
  dataCalculo: Date
): Promise<{ percentual: number }> {
  const [selic, ipca] = await Promise.all([
    buscarIndicesComCache('SELIC', dataCitacao, dataCalculo),
    buscarIndicesComCache('IPCA', dataCitacao, dataCalculo)
  ])

  let acumuladoSelic = 0
  for (const indice of selic) {
    acumuladoSelic += indice.valor / 100
  }

  let acumuladoIPCA = 0
  for (const indice of ipca) {
    acumuladoIPCA += indice.valor / 100
  }

  // Juros reais = Selic - IPCA
  return { percentual: Math.max(0, acumuladoSelic - acumuladoIPCA) }
}

/**
 * Calcula correção monetária e juros para um autor
 */
export async function calcularCorrecao(
  autor: Autor,
  indiceCorrecao: TipoIndice,
  tipoJuros: TipoJuros,
  dataCitacao: string,
  dataCalculo: string
): Promise<ResultadoCalculo> {
  const dataCitacaoDate = parseDateBR(dataCitacao)!
  const dataCalculoDate = parseDateBR(dataCalculo)!

  // Busca índices de correção
  const indices = await buscarIndicesComCache(
    indiceCorrecao,
    dataCitacaoDate,
    dataCalculoDate
  )

  // Calcula fator de correção
  const fatorCorrecao = calcularFatorCorrecao(indices)
  const valorCorrigido = autor.valorPrincipal * fatorCorrecao

  // Calcula juros
  let percentualJuros = 0

  switch (tipoJuros) {
    case '1_PORCENTO': {
      const juros = calcularJuros1Porcento(dataCitacaoDate, dataCalculoDate)
      percentualJuros = juros.percentual
      break
    }
    case 'SELIC': {
      const juros = await calcularJurosSelic(dataCitacaoDate, dataCalculoDate)
      percentualJuros = juros.percentual
      break
    }
    case 'SELIC_MENOS_IPCA': {
      const juros = await calcularJurosSelicMenosIPCA(dataCitacaoDate, dataCalculoDate)
      percentualJuros = juros.percentual
      break
    }
  }

  const valorJuros = valorCorrigido * percentualJuros
  const valorTotal = valorCorrigido + valorJuros

  // Monta detalhamento mensal
  const detalhamento: DetalheCalculo[] = []
  let fatorAcumulado = 1

  for (const indice of indices) {
    fatorAcumulado *= (1 + indice.valor / 100)
    const valorCorrigidoPeriodo = autor.valorPrincipal * fatorAcumulado

    detalhamento.push({
      periodo: indice.data,
      indiceMes: indice.valor,
      fatorAcumulado,
      valorCorrigidoPeriodo,
      jurosPeriodo: 0 // Simplificado, juros calculado no final
    })
  }

  return {
    autor: {
      ...autor,
      valorCorrigido,
      valorJuros,
      valorTotal
    },
    valorPrincipal: autor.valorPrincipal,
    valorCorrigido,
    valorJuros,
    valorTotal,
    fatorCorrecao,
    percentualJuros,
    detalhamento
  }
}

/**
 * Calcula correção para múltiplos autores
 */
export async function calcularCorrecaoMultiplosAutores(
  autores: Autor[],
  indiceCorrecao: TipoIndice,
  tipoJuros: TipoJuros,
  dataCitacao: string,
  dataCalculo: string
): Promise<ResultadoCalculo[]> {
  const resultados: ResultadoCalculo[] = []

  for (const autor of autores) {
    const resultado = await calcularCorrecao(
      autor,
      indiceCorrecao,
      tipoJuros,
      dataCitacao,
      dataCalculo
    )
    resultados.push(resultado)
  }

  return resultados
}

/**
 * Calcula totais gerais
 */
export function calcularTotais(resultados: ResultadoCalculo[]): {
  totalPrincipal: number
  totalCorrigido: number
  totalJuros: number
  totalGeral: number
} {
  return {
    totalPrincipal: resultados.reduce((sum, r) => sum + r.valorPrincipal, 0),
    totalCorrigido: resultados.reduce((sum, r) => sum + r.valorCorrigido, 0),
    totalJuros: resultados.reduce((sum, r) => sum + r.valorJuros, 0),
    totalGeral: resultados.reduce((sum, r) => sum + r.valorTotal, 0)
  }
}
