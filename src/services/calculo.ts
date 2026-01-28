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
  type TipoVerba,
  type Autor,
  type IndiceData,
  type ResultadoCalculo,
  type ResultadoVerba,
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
 * Parâmetros para cálculo de uma verba individual
 */
interface ParametrosVerba {
  tipo: TipoVerba
  valor: number
  dataCorrecao: string // Data base para correção monetária
  dataJuros: string // Data base para juros de mora (citação)
  dataCalculo: string
  indiceCorrecao: TipoIndice
  tipoJuros: TipoJuros
}

/**
 * Calcula correção monetária e juros para uma verba individual
 */
export async function calcularVerba(params: ParametrosVerba): Promise<ResultadoVerba> {
  const { tipo, valor, dataCorrecao, dataJuros, dataCalculo, indiceCorrecao, tipoJuros } = params

  const dataCorrecaoDate = parseDateBR(dataCorrecao)!
  const dataJurosDate = parseDateBR(dataJuros)!
  const dataCalculoDate = parseDateBR(dataCalculo)!

  // Busca índices de correção (a partir da data base de correção)
  const indices = await buscarIndicesComCache(
    indiceCorrecao,
    dataCorrecaoDate,
    dataCalculoDate
  )

  // Calcula fator de correção
  const fatorCorrecao = calcularFatorCorrecao(indices)
  const valorCorrigido = valor * fatorCorrecao

  // Calcula juros (a partir da data de citação)
  let percentualJuros = 0

  switch (tipoJuros) {
    case '1_PORCENTO': {
      const juros = calcularJuros1Porcento(dataJurosDate, dataCalculoDate)
      percentualJuros = juros.percentual
      break
    }
    case 'SELIC': {
      const juros = await calcularJurosSelic(dataJurosDate, dataCalculoDate)
      percentualJuros = juros.percentual
      break
    }
    case 'SELIC_MENOS_IPCA': {
      const juros = await calcularJurosSelicMenosIPCA(dataJurosDate, dataCalculoDate)
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
    const valorCorrigidoPeriodo = valor * fatorAcumulado

    detalhamento.push({
      periodo: indice.data,
      indiceMes: indice.valor,
      fatorAcumulado,
      valorCorrigidoPeriodo,
      jurosPeriodo: 0 // Simplificado, juros calculado no final
    })
  }

  return {
    tipo,
    valorPrincipal: valor,
    valorCorrigido,
    valorJuros,
    valorTotal,
    fatorCorrecao,
    percentualJuros,
    detalhamento
  }
}

/**
 * Calcula correção monetária e juros para um autor
 * Suporta verbas separadas (dano moral e material) com datas diferentes
 */
export async function calcularCorrecao(
  autor: Autor,
  indiceCorrecao: TipoIndice,
  tipoJuros: TipoJuros,
  dataCitacao: string,
  dataCalculo: string,
  dataAjuizamento?: string,
  dataSentenca?: string
): Promise<ResultadoCalculo> {
  // Verifica se tem verbas separadas
  const temDanoMaterial = (autor.valorDanoMaterial ?? 0) > 0
  const temDanoMoral = (autor.valorDanoMoral ?? 0) > 0
  const temVerbasSeparadas = temDanoMaterial || temDanoMoral

  // Se tem verbas separadas, calcula cada uma independentemente
  if (temVerbasSeparadas) {
    let resultadoMaterial: ResultadoVerba | undefined
    let resultadoMoral: ResultadoVerba | undefined

    // Calcula dano material (correção desde ajuizamento)
    if (temDanoMaterial) {
      const dataCorrecaoMaterial = dataAjuizamento || dataCitacao
      resultadoMaterial = await calcularVerba({
        tipo: 'MATERIAL',
        valor: autor.valorDanoMaterial!,
        dataCorrecao: dataCorrecaoMaterial,
        dataJuros: dataCitacao,
        dataCalculo,
        indiceCorrecao,
        tipoJuros
      })
    }

    // Calcula dano moral (correção desde sentença - Súmula 362 STJ)
    if (temDanoMoral) {
      const dataCorrecaoMoral = dataSentenca || dataCitacao
      resultadoMoral = await calcularVerba({
        tipo: 'MORAL',
        valor: autor.valorDanoMoral!,
        dataCorrecao: dataCorrecaoMoral,
        dataJuros: dataCitacao,
        dataCalculo,
        indiceCorrecao,
        tipoJuros
      })
    }

    // Consolida totais
    const valorPrincipal = (resultadoMaterial?.valorPrincipal ?? 0) + (resultadoMoral?.valorPrincipal ?? 0)
    const valorCorrigido = (resultadoMaterial?.valorCorrigido ?? 0) + (resultadoMoral?.valorCorrigido ?? 0)
    const valorJuros = (resultadoMaterial?.valorJuros ?? 0) + (resultadoMoral?.valorJuros ?? 0)
    const valorTotal = (resultadoMaterial?.valorTotal ?? 0) + (resultadoMoral?.valorTotal ?? 0)

    // Fator e percentual médios ponderados
    const fatorCorrecao = valorPrincipal > 0 ? valorCorrigido / valorPrincipal : 1
    const percentualJuros = valorCorrigido > 0 ? valorJuros / valorCorrigido : 0

    // Combina detalhamento (prioriza material, depois moral)
    const detalhamento = resultadoMaterial?.detalhamento || resultadoMoral?.detalhamento || []

    return {
      autor: {
        ...autor,
        resultadoMaterial,
        resultadoMoral,
        valorCorrigido,
        valorJuros,
        valorTotal
      },
      valorPrincipal,
      valorCorrigido,
      valorJuros,
      valorTotal,
      fatorCorrecao,
      percentualJuros,
      detalhamento,
      resultadoMaterial,
      resultadoMoral
    }
  }

  // Modo legado: usa valorPrincipal único
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
  dataCalculo: string,
  dataAjuizamento?: string,
  dataSentenca?: string
): Promise<ResultadoCalculo[]> {
  const resultados: ResultadoCalculo[] = []

  for (const autor of autores) {
    const resultado = await calcularCorrecao(
      autor,
      indiceCorrecao,
      tipoJuros,
      dataCitacao,
      dataCalculo,
      dataAjuizamento,
      dataSentenca
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
