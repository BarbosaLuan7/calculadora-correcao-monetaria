export interface Autor {
  id: string
  nome: string
  cpf?: string
  valorPrincipal: number
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

export interface DadosExtraidos {
  autores: Autor[]
  dataBase?: string // Data base para correção
  indiceCorrecao?: TipoIndice
  tipoJuros?: TipoJuros
  tribunal?: string
  numeroProcesso?: string
  vara?: string
}

export interface ParametrosCalculo {
  dataCitacao: string // DD/MM/YYYY
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
