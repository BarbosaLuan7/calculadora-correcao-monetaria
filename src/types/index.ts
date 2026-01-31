export type TipoVerba = 'MATERIAL' | 'MORAL'

export interface ResultadoVerba {
  tipo: TipoVerba
  valorPrincipal: number
  valorCorrigido: number
  valorJuros: number
  valorTotal: number
  fatorCorrecao: number
  percentualJuros: number
  detalhamento: DetalheCalculo[]
}

export interface Autor {
  id: string
  nome: string
  cpf?: string

  // Campo legado (mantido para retrocompatibilidade)
  valorPrincipal: number

  // Valores separados por verba
  valorDanoMaterial?: number
  valorDanoMoral?: number

  // Resultados calculados por verba
  resultadoMaterial?: ResultadoVerba
  resultadoMoral?: ResultadoVerba

  // Totais consolidados
  valorCorrigido?: number
  valorJuros?: number
  valorTotal?: number
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
