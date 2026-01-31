import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Calculator as CalculatorIcon, Database, Clock } from 'lucide-react'
import LogoLB from '@/assets/logo-lb.svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DocumentUpload } from './DocumentUpload'
import { AuthorList } from './AuthorList'
import { ResultPanel } from './ResultPanel'
import {
  type Autor,
  type DadosExtraidos,
  type ResultadoCalculo,
  type BCBMetadata,
  isNovoModo
} from '@/types'
import { calcularCorrecaoMultiplosAutores } from '@/services/calculo'
import { verificarConexaoBCB, getBCBMetadata, resetBCBMetadata } from '@/services/bcb'
import { formatDateToBR } from '@/lib/utils'

export function Calculator() {
  // Estados do formulário
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [tribunal, setTribunal] = useState('')
  const [vara, setVara] = useState('')

  // Datas do processo (usadas como fallback/padrão)
  const [dataAjuizamento, setDataAjuizamento] = useState('')
  const [dataSentenca, setDataSentenca] = useState('')
  const [dataCitacao, setDataCitacao] = useState('')
  const [dataEventoDanoso, setDataEventoDanoso] = useState('')
  const [dataCalculo, setDataCalculo] = useState(formatDateToBR(new Date()))

  const [autores, setAutores] = useState<Autor[]>([{
    id: 'autor-1',
    nome: '',
    valorPrincipal: 0
  }])

  // Estados de resultado e loading
  const [resultados, setResultados] = useState<ResultadoCalculo[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bcbOnline, setBcbOnline] = useState<boolean | null>(null)
  const [bcbMetadata, setBcbMetadata] = useState<BCBMetadata | null>(null)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)

  // Verifica conexão com BCB e API key ao carregar
  useEffect(() => {
    verificarConexaoBCB().then(setBcbOnline)
    // Em produção usa o Worker, em dev precisa da API key
    const isProduction = import.meta.env.PROD
    setApiKeyConfigured(isProduction || !!import.meta.env.VITE_ANTHROPIC_API_KEY)
  }, [])

  // Handler para dados extraídos do documento
  const handleDataExtracted = (data: DadosExtraidos) => {
    if (data.autores.length > 0) {
      setAutores(data.autores)
    }
    if (data.numeroProcesso) setNumeroProcesso(data.numeroProcesso)
    if (data.tribunal) setTribunal(data.tribunal)
    if (data.vara) setVara(data.vara)

    // Datas do processo
    if (data.dataAjuizamento) setDataAjuizamento(data.dataAjuizamento)
    if (data.dataSentenca) setDataSentenca(data.dataSentenca)
    if (data.dataCitacao) setDataCitacao(data.dataCitacao)

    // Fallback para campo legado
    if (data.dataBase && !data.dataCitacao) setDataCitacao(data.dataBase)
  }

  // Calcular correção
  const handleCalcular = async () => {
    // Verifica se tem pelo menos um autor com verba configurada
    const autoresValidos = autores.filter(a =>
      isNovoModo(a) ||
      a.valorPrincipal > 0 ||
      (a.valorDanoMaterial ?? 0) > 0 ||
      (a.valorDanoMoral ?? 0) > 0
    )

    if (autoresValidos.length === 0) {
      setError('Informe pelo menos um autor com valor')
      return
    }

    // Validação para novo modo: cada verba deve ter datas configuradas
    const errosValidacao: string[] = []

    for (const autor of autoresValidos) {
      if (autor.danoMaterial) {
        if (!autor.danoMaterial.dataInicioCorrecao) {
          errosValidacao.push(`${autor.nome || 'Autor'}: Data de correção do dano material não informada`)
        }
        if (!autor.danoMaterial.dataInicioJuros) {
          errosValidacao.push(`${autor.nome || 'Autor'}: Data de juros do dano material não informada`)
        }
        if (autor.danoMaterial.valor <= 0) {
          errosValidacao.push(`${autor.nome || 'Autor'}: Valor do dano material deve ser maior que zero`)
        }
      }
      if (autor.danoMoral) {
        if (!autor.danoMoral.dataInicioCorrecao) {
          errosValidacao.push(`${autor.nome || 'Autor'}: Data de correção do dano moral não informada`)
        }
        if (!autor.danoMoral.dataInicioJuros) {
          errosValidacao.push(`${autor.nome || 'Autor'}: Data de juros do dano moral não informada`)
        }
        if (autor.danoMoral.valor <= 0) {
          errosValidacao.push(`${autor.nome || 'Autor'}: Valor do dano moral deve ser maior que zero`)
        }
      }
    }

    // Validação para modo legado
    const usandoModoLegado = autoresValidos.some(a =>
      !isNovoModo(a) && (a.valorPrincipal > 0 || (a.valorDanoMaterial ?? 0) > 0 || (a.valorDanoMoral ?? 0) > 0)
    )

    if (usandoModoLegado && !dataCitacao) {
      errosValidacao.push('Data de citação não informada (necessária para modo legado)')
    }

    if (errosValidacao.length > 0) {
      setError(errosValidacao.join('\n'))
      return
    }

    setError(null)
    setIsCalculating(true)
    setResultados([])
    setBcbMetadata(null)

    // Reseta metadados do BCB antes do cálculo
    resetBCBMetadata()

    try {
      const results = await calcularCorrecaoMultiplosAutores(
        autoresValidos,
        dataCalculo,
        // Parâmetros legados (fallback)
        dataCitacao,
        dataAjuizamento || undefined,
        dataSentenca || undefined
      )
      setResultados(results)

      // Captura metadados do BCB após o cálculo
      const metadata = getBCBMetadata()
      setBcbMetadata(metadata)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular correção')
    } finally {
      setIsCalculating(false)
    }
  }

  // Limpar formulário
  const handleLimpar = () => {
    setNumeroProcesso('')
    setTribunal('')
    setVara('')
    setDataAjuizamento('')
    setDataSentenca('')
    setDataCitacao('')
    setDataEventoDanoso('')
    setDataCalculo(formatDateToBR(new Date()))
    setAutores([{ id: 'autor-1', nome: '', valorPrincipal: 0 }])
    setResultados([])
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header - Light Premium */}
        <header className="text-center pt-6 pb-8 animate-reveal">
          <div className="flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="bg-[#2f3a44] px-8 py-4 rounded-2xl">
              <img
                src={LogoLB}
                alt="Luan Barbosa Advocacia Especializada"
                className="w-40 sm:w-48 md:w-56 h-auto"
              />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                <CalculatorIcon className="h-5 w-5 text-[#93784a]" />
                <span className="text-sm font-medium text-gray-600">Cumprimento de Sentença</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#2f3a44]">
                Calculadora de{' '}
                <span className="text-[#93784a]">Correção Monetária</span>
              </h1>

              <p className="text-base text-gray-500 font-light max-w-lg mx-auto">
                Calcule correção monetária e juros de mora com precisão
              </p>
            </div>

            {/* Status BCB */}
            {bcbOnline !== null && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {/* Status Online/Offline */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${bcbOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-xs text-gray-500 font-medium">
                    API Banco Central: {bcbOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Séries consultadas (após cálculo) */}
                {bcbMetadata && bcbMetadata.seriesConsultadas.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                    <Database className="w-3.5 h-3.5 text-[#93784a]" />
                    <span className="text-xs text-gray-500 font-medium">
                      {bcbMetadata.seriesConsultadas.map(s => `Série ${s.codigo} (${s.tipo})`).join(', ')}
                    </span>
                  </div>
                )}

                {/* Última atualização (após cálculo) */}
                {bcbMetadata && bcbMetadata.ultimaAtualizacao && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-[#93784a]" />
                    <span className="text-xs text-gray-500 font-medium">
                      Atualizado: {bcbMetadata.ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

      {/* Upload de documento */}
      <DocumentUpload
        onDataExtracted={handleDataExtracted}
        apiKeyConfigured={apiKeyConfigured}
      />

      {/* Dados do processo */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Processo</CardTitle>
          <CardDescription>
            Informações sobre o processo judicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numeroProcesso">Número do Processo</Label>
              <Input
                id="numeroProcesso"
                placeholder="0000000-00.0000.0.00.0000"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tribunal">Tribunal</Label>
              <Input
                id="tribunal"
                placeholder="Ex: TJSP, TJRJ, TRF1"
                value={tribunal}
                onChange={(e) => setTribunal(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vara">Vara</Label>
            <Input
              id="vara"
              placeholder="Ex: 1ª Vara Cível"
              value={vara}
              onChange={(e) => setVara(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Datas do Processo */}
      <Card>
        <CardHeader>
          <CardTitle>Datas do Processo</CardTitle>
          <CardDescription>
            Datas padrão do processo (podem ser sobrescritas por verba)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="dataAjuizamento">Data de Ajuizamento</Label>
              <Input
                id="dataAjuizamento"
                placeholder="DD/MM/AAAA"
                value={dataAjuizamento}
                onChange={(e) => setDataAjuizamento(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Correção do dano material
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSentenca">Data da Sentença</Label>
              <Input
                id="dataSentenca"
                placeholder="DD/MM/AAAA"
                value={dataSentenca}
                onChange={(e) => setDataSentenca(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Correção do dano moral
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataCitacao">Data da Citação</Label>
              <Input
                id="dataCitacao"
                placeholder="DD/MM/AAAA"
                value={dataCitacao}
                onChange={(e) => setDataCitacao(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Juros de mora (Art. 405 CC)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEventoDanoso">Data do Evento</Label>
              <Input
                id="dataEventoDanoso"
                placeholder="DD/MM/AAAA"
                value={dataEventoDanoso}
                onChange={(e) => setDataEventoDanoso(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Súmula 54 STJ (extracontratual)
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dataCalculo">Data do Cálculo *</Label>
                <Input
                  id="dataCalculo"
                  placeholder="DD/MM/AAAA"
                  value={dataCalculo}
                  onChange={(e) => setDataCalculo(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Data final do cálculo (geralmente hoje)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de autores */}
      <AuthorList
        autores={autores}
        onChange={setAutores}
        dataAjuizamento={dataAjuizamento}
        dataSentenca={dataSentenca}
        dataCitacao={dataCitacao}
        dataEventoDanoso={dataEventoDanoso}
      />

      {/* Botões de ação */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="gold"
          onClick={handleCalcular}
          disabled={isCalculating}
          className="flex-1 h-14 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
          size="lg"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <CalculatorIcon className="h-5 w-5 mr-2" />
              Calcular Correção
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleLimpar}
          size="lg"
          className="h-14 rounded-xl bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#2f3a44] hover:border-gray-300 transition-all duration-300"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Resultados */}
      <ResultPanel
        resultados={resultados}
        dadosProcesso={{
          numeroProcesso,
          tribunal,
          vara,
          dataAjuizamento,
          dataSentenca,
          dataCitacao,
          dataCalculo
        }}
        bcbMetadata={bcbMetadata}
      />

      </div>
    </div>
  )
}
