import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, Calculator as CalculatorIcon } from 'lucide-react'
import LogoLB from '@/assets/logo-lb.svg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DocumentUpload } from './DocumentUpload'
import { AuthorList } from './AuthorList'
import { ResultPanel } from './ResultPanel'
import {
  type Autor,
  type TipoIndice,
  type TipoJuros,
  type DadosExtraidos,
  type ResultadoCalculo,
  NOMES_INDICES,
  NOMES_JUROS
} from '@/types'
import { calcularCorrecaoMultiplosAutores } from '@/services/calculo'
import { verificarConexaoBCB } from '@/services/bcb'
import { formatDateToBR } from '@/lib/utils'

export function Calculator() {
  // Estados do formulário
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [tribunal, setTribunal] = useState('')
  const [vara, setVara] = useState('')

  // Datas do processo
  const [dataAjuizamento, setDataAjuizamento] = useState('') // Correção dano material
  const [dataSentenca, setDataSentenca] = useState('') // Correção dano moral (Súmula 362 STJ)
  const [dataCitacao, setDataCitacao] = useState('') // Juros de mora
  const [dataCalculo, setDataCalculo] = useState(formatDateToBR(new Date()))

  const [indiceCorrecao, setIndiceCorrecao] = useState<TipoIndice>('IPCA')
  const [tipoJuros, setTipoJuros] = useState<TipoJuros>('1_PORCENTO')
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
    if (data.indiceCorrecao) setIndiceCorrecao(data.indiceCorrecao)
    if (data.tipoJuros) setTipoJuros(data.tipoJuros)

    // Novas datas do processo
    if (data.dataAjuizamento) setDataAjuizamento(data.dataAjuizamento)
    if (data.dataSentenca) setDataSentenca(data.dataSentenca)
    if (data.dataCitacao) setDataCitacao(data.dataCitacao)

    // Fallback para campo legado
    if (data.dataBase && !data.dataCitacao) setDataCitacao(data.dataBase)
  }

  // Calcular correção
  const handleCalcular = async () => {
    // Validações
    if (!dataCitacao) {
      setError('Informe a data da citação')
      return
    }

    // Verifica se tem pelo menos um valor (principal, dano material ou dano moral)
    const autoresValidos = autores.filter(a =>
      a.valorPrincipal > 0 ||
      (a.valorDanoMaterial ?? 0) > 0 ||
      (a.valorDanoMoral ?? 0) > 0
    )
    if (autoresValidos.length === 0) {
      setError('Informe pelo menos um autor com valor')
      return
    }

    // Validação de datas para verbas separadas
    const temDanoMaterial = autoresValidos.some(a => (a.valorDanoMaterial ?? 0) > 0)
    const temDanoMoral = autoresValidos.some(a => (a.valorDanoMoral ?? 0) > 0)

    if (temDanoMaterial && !dataAjuizamento) {
      setError('Informe a data de ajuizamento para correção do dano material')
      return
    }

    if (temDanoMoral && !dataSentenca) {
      setError('Informe a data da sentença para correção do dano moral (Súmula 362 STJ)')
      return
    }

    setError(null)
    setIsCalculating(true)
    setResultados([])

    try {
      const results = await calcularCorrecaoMultiplosAutores(
        autoresValidos,
        indiceCorrecao,
        tipoJuros,
        dataCitacao,
        dataCalculo,
        dataAjuizamento || undefined,
        dataSentenca || undefined
      )
      setResultados(results)
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
    setDataCalculo(formatDateToBR(new Date()))
    setIndiceCorrecao('IPCA')
    setTipoJuros('1_PORCENTO')
    setAutores([{ id: 'autor-1', nome: '', valorPrincipal: 0 }])
    setResultados([])
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <header className="bg-[#2f3a44] -mx-4 -mt-4 px-4 py-8 sm:py-10 mb-6 rounded-b-lg">
        <div className="flex flex-col items-center gap-5">
          {/* Logo responsiva: maior em desktop, menor em mobile */}
          <img
            src={LogoLB}
            alt="Luan Barbosa Advocacia Especializada"
            className="w-64 sm:w-80 md:w-96 lg:w-[28rem] h-auto max-w-full"
          />
          <div className="text-center space-y-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-light tracking-wider text-white flex items-center justify-center gap-2">
              <CalculatorIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#93784a]" />
              Calculadora de Correção Monetária
            </h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Correção monetária e juros de mora para cumprimento de sentença
            </p>
          </div>
        </div>
        {bcbOnline !== null && (
          <p className={`text-xs text-center mt-3 ${bcbOnline ? 'text-green-400' : 'text-yellow-400'}`}>
            API BCB: {bcbOnline ? 'Online' : 'Offline (usando cache)'}
          </p>
        )}
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
            Datas base para correção monetária e juros de mora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataAjuizamento">Data de Ajuizamento</Label>
              <Input
                id="dataAjuizamento"
                placeholder="DD/MM/AAAA"
                value={dataAjuizamento}
                onChange={(e) => setDataAjuizamento(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Correção monetária do dano material
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
              <p className="text-xs text-muted-foreground">
                Correção monetária do dano moral (Súmula 362 STJ)
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataCitacao">Data da Citação *</Label>
              <Input
                id="dataCitacao"
                placeholder="DD/MM/AAAA"
                value={dataCitacao}
                onChange={(e) => setDataCitacao(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Início dos juros de mora (obrigatório)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataCalculo">Data do Cálculo</Label>
              <Input
                id="dataCalculo"
                placeholder="DD/MM/AAAA"
                value={dataCalculo}
                onChange={(e) => setDataCalculo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Data final do cálculo (geralmente hoje)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parâmetros de cálculo */}
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Cálculo</CardTitle>
          <CardDescription>
            Configure o índice de correção e tipo de juros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="indiceCorrecao">Índice de Correção</Label>
              <Select
                value={indiceCorrecao}
                onValueChange={(v) => setIndiceCorrecao(v as TipoIndice)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOMES_INDICES).map(([key, nome]) => (
                    <SelectItem key={key} value={key}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoJuros">Juros de Mora</Label>
              <Select
                value={tipoJuros}
                onValueChange={(v) => setTipoJuros(v as TipoJuros)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOMES_JUROS).map(([key, nome]) => (
                    <SelectItem key={key} value={key}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de autores */}
      <AuthorList autores={autores} onChange={setAutores} />

      {/* Botões de ação */}
      <div className="flex gap-3">
        <Button
          onClick={handleCalcular}
          disabled={isCalculating}
          className="flex-1"
        >
          {isCalculating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <CalculatorIcon className="h-4 w-4 mr-2" />
              Calcular Correção
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleLimpar}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
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
          dataCalculo,
          indiceCorrecao,
          tipoJuros
        }}
      />
    </div>
  )
}
