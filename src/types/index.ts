export type TipoVerba = 'MATERIAL' | 'MORAL'

/**
 * Configuração independente para cada verba (dano material ou moral)
 * Permite definir parâmetros diferentes de correção e juros para cada tipo de dano
 */
export interface ConfiguracaoVerba {
  valor: number
  dataInicioCorrecao: string      // DD/MM/YYYY - quando começa a correção monetária
  indiceCorrecao: TipoIndice      // IPCA, INPC, IGP-M, SELIC, TR
  dataInicioJuros: string         // DD/MM/YYYY - quando começam os juros de mora
  tipoJuros: TipoJuros            // 1_PORCENTO, SELIC, SELIC_MENOS_IPCA
}

export interface ResultadoVerba {
  tipo: TipoVerba
  valorPrincipal: number
  valorCorrigido: number
  valorJuros: number
  valorTotal: number
  fatorCorrecao: number
  percentualJuros: number
  detalhamento: DetalheCalculo[]
  // Parâmetros usados no cálculo (para exibição)
  parametros?: {
    dataInicioCorrecao: string
    indiceCorrecao: TipoIndice
    dataInicioJuros: string
    tipoJuros: TipoJuros
  }
}

export interface Autor {
  id: string
  nome: string
  cpf?: string

  // NOVO: Verbas com configuração independente (4 campos cada)
  danoMaterial?: ConfiguracaoVerba
  danoMoral?: ConfiguracaoVerba

  // Resultados calculados por verba
  resultadoMaterial?: ResultadoVerba
  resultadoMoral?: ResultadoVerba

  // Totais consolidados
  valorCorrigido?: number
  valorJuros?: number
  valorTotal?: number

  // LEGADO: mantido para retrocompatibilidade
  valorPrincipal: number
  valorDanoMaterial?: number
  valorDanoMoral?: number
}

export interface IndiceData {
  data: string // DD/MM/YYYY
  valor: number
}

export type TipoIndice = 'IPCA' | 'INPC' | 'IGP-M' | 'SELIC' | 'TR'

export type TipoJuros = 'SELIC' | '1_PORCENTO' | 'SELIC_MENOS_IPCA'

export type TipoMarcoJuros = 'CITACAO' | 'EVENTO_DANOSO' | 'DESEMBOLSO'

export interface DadosExtraidos {
  autores: Autor[]
  dataBase?: string // Data base para correção (legado)
  dataAjuizamento?: string // Data de ajuizamento (para dano material)
  dataSentenca?: string // Data da sentença (para dano moral - Súmula 362 STJ)
  dataCitacao?: string // Data da citação (para juros de mora)
  indiceCorrecao?: TipoIndice
  tipoJuros?: TipoJuros
  tribunal?: string
  numeroProcesso?: string
  vara?: string
}

export interface ParametrosCalculo {
  dataCitacao: string // DD/MM/YYYY - início dos juros de mora
  dataAjuizamento?: string // DD/MM/YYYY - correção do dano material
  dataSentenca?: string // DD/MM/YYYY - correção do dano moral (Súmula 362 STJ)
  dataCalculo: string // DD/MM/YYYY - geralmente hoje
  indiceCorrecao: TipoIndice
  tipoJuros: TipoJuros
  autores: Autor[]
}

export interface ResultadoCalculo {
  autor: Autor
  valorPrincipal: number
  valorCorrigido: number
  valorJuros: number
  valorTotal: number
  fatorCorrecao: number
  percentualJuros: number
  detalhamento: DetalheCalculo[]

  // Resultados separados por verba (quando aplicável)
  resultadoMaterial?: ResultadoVerba
  resultadoMoral?: ResultadoVerba
}

export interface DetalheCalculo {
  periodo: string
  indiceMes: number
  fatorAcumulado: number
  valorCorrigidoPeriodo: number
  jurosPeriodo: number
}

export interface CacheIndices {
  [key: string]: {
    dados: IndiceData[]
    ultimaAtualizacao: string
  }
}

export interface APIBCBResponse {
  data: string
  valor: string
}

/**
 * Metadados sobre a consulta ao BCB
 */
export interface BCBMetadata {
  online: boolean
  ultimaAtualizacao: Date | null
  seriesConsultadas: {
    tipo: TipoIndice
    codigo: number
    registros: number
  }[]
}

export const CODIGOS_SERIES_BCB: Record<TipoIndice, number> = {
  'IPCA': 433,
  'INPC': 188,
  'IGP-M': 189,
  'SELIC': 11,
  'TR': 226
}

export const NOMES_INDICES: Record<TipoIndice, string> = {
  'IPCA': 'IPCA (Índice de Preços ao Consumidor Amplo)',
  'INPC': 'INPC (Índice Nacional de Preços ao Consumidor)',
  'IGP-M': 'IGP-M (Índice Geral de Preços do Mercado)',
  'SELIC': 'Taxa Selic',
  'TR': 'TR (Taxa Referencial)'
}

export const NOMES_JUROS: Record<TipoJuros, string> = {
  'SELIC': 'Taxa Selic',
  '1_PORCENTO': '1% ao mês',
  'SELIC_MENOS_IPCA': 'Selic - IPCA'
}

export const NOMES_MARCO_JUROS: Record<TipoMarcoJuros, string> = {
  'CITACAO': 'Data da Citação',
  'EVENTO_DANOSO': 'Data do Evento Danoso',
  'DESEMBOLSO': 'Data do Desembolso'
}

export const FUNDAMENTOS_MARCO_JUROS: Record<TipoMarcoJuros, string> = {
  'CITACAO': 'Art. 405 CC - regra geral',
  'EVENTO_DANOSO': 'Súmula 54 STJ - responsabilidade extracontratual',
  'DESEMBOLSO': 'Data do efetivo prejuízo'
}

/**
 * Presets de sentença para facilitar preenchimento
 */
export type TipoPresetSentenca = 'classica' | 'extracontratual' | 'personalizado'

export interface PresetConfig {
  label: string
  descricao: string
  material: {
    indice: TipoIndice
    juros: TipoJuros
    marcoCorrecao: 'ajuizamento' | 'evento' | 'desembolso'
    marcoJuros: 'citacao' | 'evento'
  }
  moral: {
    indice: TipoIndice
    juros: TipoJuros
    marcoCorrecao: 'sentenca'
    marcoJuros: 'citacao' | 'evento'
  }
}

export const PRESETS_SENTENCA: Record<Exclude<TipoPresetSentenca, 'personalizado'>, PresetConfig> = {
  'classica': {
    label: 'Clássica (Art. 405 CC)',
    descricao: 'IPCA + 1% a.m. desde citação',
    material: { indice: 'IPCA', juros: '1_PORCENTO', marcoCorrecao: 'ajuizamento', marcoJuros: 'citacao' },
    moral: { indice: 'IPCA', juros: '1_PORCENTO', marcoCorrecao: 'sentenca', marcoJuros: 'citacao' }
  },
  'extracontratual': {
    label: 'Extracontratual (Súmula 54 STJ)',
    descricao: 'Juros desde o evento danoso',
    material: { indice: 'IPCA', juros: '1_PORCENTO', marcoCorrecao: 'evento', marcoJuros: 'evento' },
    moral: { indice: 'IPCA', juros: '1_PORCENTO', marcoCorrecao: 'sentenca', marcoJuros: 'evento' }
  }
}

/**
 * Verifica se o autor usa o novo modo (ConfiguracaoVerba)
 */
export function isNovoModo(autor: Autor): boolean {
  return !!(autor.danoMaterial || autor.danoMoral)
}

/**
 * Verifica se o autor usa o modo legado (valorPrincipal)
 */
export function isModoLegado(autor: Autor): boolean {
  return autor.valorPrincipal > 0 && !isNovoModo(autor)
}
