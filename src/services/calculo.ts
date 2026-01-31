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
  type ConfiguracaoVerba,
  type IndiceData,
  type ResultadoCalculo,
  type ResultadoVerba,
  type DetalheCalculo,
  isNovoModo
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
 * Calcula juros de mora de 1% ao mês (juros simples, conforme Art. 406 CC)
 *
 * Nota: Juros de mora são simples, não compostos.
 * A contagem é feita mês a mês, do mês da citação até o mês do cálculo.
 */
function calcularJuros1Porcento(
  dataInicio: Date,
  dataCalculo: Date
): { percentual: number; meses: number } {
  // Validação: data de início não pode ser posterior à data de cálculo
  if (dataInicio > dataCalculo) {
    console.warn('Data de início dos juros posterior à data de cálculo')
    return { percentual: 0, meses: 0 }
  }

  const meses =
    (dataCalculo.getFullYear() - dataInicio.getFullYear()) * 12 +
    (dataCalculo.getMonth() - dataInicio.getMonth())

  // Garante que meses não seja negativo
  const mesesPositivos = Math.max(0, meses)
  const percentual = mesesPositivos * 0.01 // 1% ao mês (juros simples)

  return { percentual, meses: mesesPositivos }
}

/**
 * Calcula juros pela Selic acumulada (juros compostos)
 *
 * A Selic é capitalizada mensalmente de forma composta:
 * Fator = Π(1 + taxa_mensal)
 * Percentual de juros = Fator - 1
 *
 * Nota: A série 11 do BCB retorna a taxa Selic MENSAL em percentual.
 */
async function calcularJurosSelic(
  dataInicio: Date,
  dataCalculo: Date
): Promise<{ percentual: number; indices: IndiceData[] }> {
  // Validação: data de início não pode ser posterior à data de cálculo
  if (dataInicio > dataCalculo) {
    console.warn('Data de início dos juros posterior à data de cálculo')
    return { percentual: 0, indices: [] }
  }

  const indices = await buscarIndicesComCache('SELIC', dataInicio, dataCalculo)

  // Capitalização composta: multiplica os fatores mensais
  let fatorAcumulado = 1
  for (const indice of indices) {
    fatorAcumulado *= (1 + indice.valor / 100)
  }

  // Retorna apenas a parte dos juros (fator - 1)
  return { percentual: fatorAcumulado - 1, indices }
}

/**
 * Extrai chave de mês/ano de uma data no formato DD/MM/YYYY
 * Usado para parear índices mensais (Selic e IPCA) que podem ter dias diferentes
 */
function extrairChaveMesAno(dataStr: string): string {
  // Formato esperado: DD/MM/YYYY
  const partes = dataStr.split('/')
  if (partes.length === 3) {
    return `${partes[1]}/${partes[2]}` // MM/YYYY
  }
  return dataStr
}

/**
 * Calcula juros reais (Selic menos IPCA) usando a fórmula de Fisher
 *
 * A taxa de juros real é calculada pela equação de Fisher:
 * Taxa real mensal = (1 + Selic) / (1 + IPCA) - 1
 *
 * O resultado acumulado é a capitalização composta das taxas reais mensais:
 * Fator real = Π[(1 + Selic_i) / (1 + IPCA_i)]
 */
async function calcularJurosSelicMenosIPCA(
  dataInicio: Date,
  dataCalculo: Date
): Promise<{ percentual: number; indices: IndiceData[] }> {
  // Validação: data de início não pode ser posterior à data de cálculo
  if (dataInicio > dataCalculo) {
    console.warn('Data de início dos juros posterior à data de cálculo')
    return { percentual: 0, indices: [] }
  }

  const [selicIndices, ipcaIndices] = await Promise.all([
    buscarIndicesComCache('SELIC', dataInicio, dataCalculo),
    buscarIndicesComCache('IPCA', dataInicio, dataCalculo)
  ])

  // Criar mapa de IPCA por MÊS/ANO para pareamento correto
  // (BCB pode retornar dias diferentes para Selic e IPCA no mesmo mês)
  const ipcaMap = new Map<string, number>()
  for (const indice of ipcaIndices) {
    const chaveMesAno = extrairChaveMesAno(indice.data)
    ipcaMap.set(chaveMesAno, indice.valor)
  }

  // Calcular taxa real composta (fórmula de Fisher)
  let fatorRealAcumulado = 1
  for (const selic of selicIndices) {
    const chaveMesAno = extrairChaveMesAno(selic.data)
    const ipcaValor = ipcaMap.get(chaveMesAno) ?? 0

    const taxaNominal = 1 + (selic.valor / 100)
    const taxaInflacao = 1 + (ipcaValor / 100)

    // Fórmula de Fisher: (1 + nominal) / (1 + inflação)
    const fatorRealMensal = taxaNominal / taxaInflacao

    fatorRealAcumulado *= fatorRealMensal
  }

  // Retorna apenas a parte dos juros (fator - 1), mínimo zero
  return {
    percentual: Math.max(0, fatorRealAcumulado - 1),
    indices: selicIndices
  }
}

/**
 * Parâmetros para cálculo de uma verba individual
 */
interface ParametrosVerba {
  tipo: TipoVerba
  valor: number
  dataCorrecao: string // Data base para correção monetária
  dataJuros: string // Data base para juros de mora
  dataCalculo: string
  indiceCorrecao: TipoIndice
  tipoJuros: TipoJuros
}

/**
 * Calcula correção monetária e juros para uma verba individual
 * Retorna o resultado com os parâmetros usados no cálculo
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

  // Calcula juros (a partir da data de início dos juros)
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
    detalhamento,
    // Parâmetros usados no cálculo (para exibição)
    parametros: {
      dataInicioCorrecao: dataCorrecao,
      indiceCorrecao,
      dataInicioJuros: dataJuros,
      tipoJuros
    }
  }
}

/**
 * Calcula correção para uma verba usando ConfiguracaoVerba
 */
async function calcularVerbaComConfig(
  tipo: TipoVerba,
  config: ConfiguracaoVerba,
  dataCalculo: string
): Promise<ResultadoVerba> {
  return calcularVerba({
    tipo,
    valor: config.valor,
    dataCorrecao: config.dataInicioCorrecao,
    dataJuros: config.dataInicioJuros,
    dataCalculo,
    indiceCorrecao: config.indiceCorrecao,
    tipoJuros: config.tipoJuros
  })
}

/**
 * Calcula correção monetária e juros para um autor
 * Suporta novo modo (ConfiguracaoVerba) e modo legado
 *
 * @param autor - Dados do autor com verbas configuradas
 * @param dataCalculo - Data final do cálculo
 * @param dataCitacaoFallback - Data de citação (fallback para modo legado)
 * @param dataAjuizamentoFallback - Data de ajuizamento (fallback para modo legado)
 * @param dataSentencaFallback - Data da sentença (fallback para modo legado)
 */
export async function calcularCorrecao(
  autor: Autor,
  dataCalculo: string,
  dataCitacaoFallback?: string,
  dataAjuizamentoFallback?: string,
  dataSentencaFallback?: string
): Promise<ResultadoCalculo> {
  // Novo modo: usa ConfiguracaoVerba com parâmetros independentes
  if (isNovoModo(autor)) {
    let resultadoMaterial: ResultadoVerba | undefined
    let resultadoMoral: ResultadoVerba | undefined

    // Calcula dano material com seus próprios parâmetros
    if (autor.danoMaterial && autor.danoMaterial.valor > 0) {
      resultadoMaterial = await calcularVerbaComConfig(
        'MATERIAL',
        autor.danoMaterial,
        dataCalculo
      )
    }

    // Calcula dano moral com seus próprios parâmetros
    if (autor.danoMoral && autor.danoMoral.valor > 0) {
      resultadoMoral = await calcularVerbaComConfig(
        'MORAL',
        autor.danoMoral,
        dataCalculo
      )
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

  // Modo legado com verbas separadas (valorDanoMaterial/valorDanoMoral)
  const temDanoMaterial = (autor.valorDanoMaterial ?? 0) > 0
  const temDanoMoral = (autor.valorDanoMoral ?? 0) > 0
  const temVerbasSeparadas = temDanoMaterial || temDanoMoral

  if (temVerbasSeparadas) {
    let resultadoMaterial: ResultadoVerba | undefined
    let resultadoMoral: ResultadoVerba | undefined

    const dataCitacao = dataCitacaoFallback || ''

    // Calcula dano material (correção desde ajuizamento, padrão IPCA + 1%)
    if (temDanoMaterial) {
      const dataCorrecaoMaterial = dataAjuizamentoFallback || dataCitacao
      resultadoMaterial = await calcularVerba({
        tipo: 'MATERIAL',
        valor: autor.valorDanoMaterial!,
        dataCorrecao: dataCorrecaoMaterial,
        dataJuros: dataCitacao,
        dataCalculo,
        indiceCorrecao: 'IPCA',
        tipoJuros: '1_PORCENTO'
      })
    }

    // Calcula dano moral (correção desde sentença - Súmula 362 STJ)
    if (temDanoMoral) {
      const dataCorrecaoMoral = dataSentencaFallback || dataCitacao
      resultadoMoral = await calcularVerba({
        tipo: 'MORAL',
        valor: autor.valorDanoMoral!,
        dataCorrecao: dataCorrecaoMoral,
        dataJuros: dataCitacao,
        dataCalculo,
        indiceCorrecao: 'IPCA',
        tipoJuros: '1_PORCENTO'
      })
    }

    // Consolida totais
    const valorPrincipal = (resultadoMaterial?.valorPrincipal ?? 0) + (resultadoMoral?.valorPrincipal ?? 0)
    const valorCorrigido = (resultadoMaterial?.valorCorrigido ?? 0) + (resultadoMoral?.valorCorrigido ?? 0)
    const valorJuros = (resultadoMaterial?.valorJuros ?? 0) + (resultadoMoral?.valorJuros ?? 0)
    const valorTotal = (resultadoMaterial?.valorTotal ?? 0) + (resultadoMoral?.valorTotal ?? 0)

    const fatorCorrecao = valorPrincipal > 0 ? valorCorrigido / valorPrincipal : 1
    const percentualJuros = valorCorrigido > 0 ? valorJuros / valorCorrigido : 0
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
  const dataCitacao = dataCitacaoFallback || ''
  const dataInicioJurosDate = parseDateBR(dataCitacao)!
  const dataCalculoDate = parseDateBR(dataCalculo)!
  const dataCitacaoDate = parseDateBR(dataCitacao)!

  // Busca índices de correção (usa data de citação como base da correção no modo legado)
  const indices = await buscarIndicesComCache(
    'IPCA',
    dataCitacaoDate,
    dataCalculoDate
  )

  // Calcula fator de correção
  const fatorCorrecao = calcularFatorCorrecao(indices)
  const valorCorrigido = autor.valorPrincipal * fatorCorrecao

  // Calcula juros (1% ao mês padrão)
  const juros = calcularJuros1Porcento(dataInicioJurosDate, dataCalculoDate)
  const percentualJuros = juros.percentual

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
 *
 * @param autores - Lista de autores com verbas configuradas
 * @param dataCalculo - Data final do cálculo
 * @param dataCitacaoFallback - Data de citação (fallback para modo legado)
 * @param dataAjuizamentoFallback - Data de ajuizamento (fallback para modo legado)
 * @param dataSentencaFallback - Data da sentença (fallback para modo legado)
 */
export async function calcularCorrecaoMultiplosAutores(
  autores: Autor[],
  dataCalculo: string,
  dataCitacaoFallback?: string,
  dataAjuizamentoFallback?: string,
  dataSentencaFallback?: string
): Promise<ResultadoCalculo[]> {
  const resultados: ResultadoCalculo[] = []

  for (const autor of autores) {
    const resultado = await calcularCorrecao(
      autor,
      dataCalculo,
      dataCitacaoFallback,
      dataAjuizamentoFallback,
      dataSentencaFallback
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
