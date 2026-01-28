import { type TipoIndice, type IndiceData, type CacheIndices } from '@/types'
import { buscarIndice } from './bcb'

const CACHE_KEY = 'indices_correcao_monetaria'
const CACHE_EXPIRY_HOURS = 24

/**
 * Carrega cache do localStorage
 */
function carregarCache(): CacheIndices {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('Erro ao carregar cache:', error)
  }
  return {}
}

/**
 * Salva cache no localStorage
 */
function salvarCache(cache: CacheIndices): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Erro ao salvar cache:', error)
  }
}

/**
 * Verifica se o cache está expirado
 */
function cacheExpirado(ultimaAtualizacao: string): boolean {
  const ultima = new Date(ultimaAtualizacao)
  const agora = new Date()
  const diffHours = (agora.getTime() - ultima.getTime()) / (1000 * 60 * 60)
  return diffHours > CACHE_EXPIRY_HOURS
}

/**
 * Busca índices com cache
 */
export async function buscarIndicesComCache(
  tipo: TipoIndice,
  dataInicial: Date,
  dataFinal: Date,
  forcarAtualizacao: boolean = false
): Promise<IndiceData[]> {
  const cache = carregarCache()
  const cacheKey = tipo

  // Verifica se tem cache válido
  if (
    !forcarAtualizacao &&
    cache[cacheKey] &&
    !cacheExpirado(cache[cacheKey].ultimaAtualizacao)
  ) {
    // Filtra os dados do cache pelo período solicitado
    const dadosFiltrados = cache[cacheKey].dados.filter(d => {
      const [dia, mes, ano] = d.data.split('/').map(Number)
      const dataIndice = new Date(ano, mes - 1, dia)
      return dataIndice >= dataInicial && dataIndice <= dataFinal
    })

    if (dadosFiltrados.length > 0) {
      return dadosFiltrados
    }
  }

  // Busca da API
  try {
    const dados = await buscarIndice(tipo, dataInicial, dataFinal)

    // Atualiza cache
    const cacheAtual = cache[cacheKey]?.dados || []
    const novosDados = [...cacheAtual]

    // Adiciona apenas dados novos
    for (const dado of dados) {
      const existe = novosDados.some(d => d.data === dado.data)
      if (!existe) {
        novosDados.push(dado)
      }
    }

    // Ordena por data
    novosDados.sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/').map(Number)
      const [diaB, mesB, anoB] = b.data.split('/').map(Number)
      const dateA = new Date(anoA, mesA - 1, diaA)
      const dateB = new Date(anoB, mesB - 1, diaB)
      return dateA.getTime() - dateB.getTime()
    })

    cache[cacheKey] = {
      dados: novosDados,
      ultimaAtualizacao: new Date().toISOString()
    }

    salvarCache(cache)

    return dados
  } catch (error) {
    // Se falhar, tenta usar cache mesmo expirado
    if (cache[cacheKey]?.dados) {
      console.warn('Usando cache expirado devido a erro na API:', error)
      return cache[cacheKey].dados.filter(d => {
        const [dia, mes, ano] = d.data.split('/').map(Number)
        const dataIndice = new Date(ano, mes - 1, dia)
        return dataIndice >= dataInicial && dataIndice <= dataFinal
      })
    }
    throw error
  }
}

/**
 * Limpa todo o cache
 */
export function limparCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

/**
 * Retorna informações sobre o cache
 */
export function infosCache(): { tipo: TipoIndice; qtdRegistros: number; ultimaAtualizacao: string }[] {
  const cache = carregarCache()
  return Object.entries(cache).map(([tipo, dados]) => ({
    tipo: tipo as TipoIndice,
    qtdRegistros: dados.dados.length,
    ultimaAtualizacao: dados.ultimaAtualizacao
  }))
}

/**
 * Pré-carrega todos os índices principais
 */
export async function preCarregarIndices(): Promise<void> {
  const tipos: TipoIndice[] = ['IPCA', 'INPC', 'IGP-M', 'SELIC']
  const dataFinal = new Date()
  const dataInicial = new Date()
  dataInicial.setFullYear(dataInicial.getFullYear() - 5) // Últimos 5 anos

  for (const tipo of tipos) {
    try {
      await buscarIndicesComCache(tipo, dataInicial, dataFinal, true)
    } catch (error) {
      console.error(`Erro ao pré-carregar ${tipo}:`, error)
    }
  }
}
