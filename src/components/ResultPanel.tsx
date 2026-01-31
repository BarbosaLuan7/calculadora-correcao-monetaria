import { Download, FileText, FileSpreadsheet, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ResultadoCalculo, type ResultadoVerba, type BCBMetadata, NOMES_JUROS } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { salvarMemoriaPDF } from '@/services/pdf'
import { salvarPeticaoDOCX } from '@/services/docx'

interface ResultPanelProps {
  resultados: ResultadoCalculo[]
  dadosProcesso: {
    numeroProcesso: string
    tribunal: string
    vara: string
    dataAjuizamento?: string
    dataSentenca?: string
    dataCitacao: string
    dataCalculo: string
  }
  bcbMetadata?: BCBMetadata | null
}

// Exibe detalhes de uma verba com seus parâmetros
function VerbaDetails({ verba, label }: { verba: ResultadoVerba; label: string }) {
  const corFundo = verba.tipo === 'MATERIAL' ? 'bg-blue-50/50' : 'bg-purple-50/50'
  const corBorda = verba.tipo === 'MATERIAL' ? 'border-blue-200' : 'border-purple-200'
  const corTexto = verba.tipo === 'MATERIAL' ? 'text-blue-700' : 'text-purple-700'

  return (
    <div className={`p-4 rounded-lg border ${corBorda} ${corFundo}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-medium ${corTexto}`}>{label}</span>
        <span className="text-lg font-semibold">{formatCurrency(verba.valorTotal)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Principal:</span>
          <span className="ml-2">{formatCurrency(verba.valorPrincipal)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Corrigido:</span>
          <span className="ml-2">{formatCurrency(verba.valorCorrigido)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Fator:</span>
          <span className="ml-2">{verba.fatorCorrecao.toFixed(6)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Juros:</span>
          <span className="ml-2">{formatCurrency(verba.valorJuros)}</span>
          <span className="text-xs text-muted-foreground ml-1">
            ({formatPercent(verba.percentualJuros * 100)})
          </span>
        </div>
      </div>

      {/* Parâmetros usados no cálculo */}
      {verba.parametros && (
        <div className="mt-3 pt-3 border-t border-dashed grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span>Correção desde:</span>
            <span className="ml-1 font-medium text-foreground">
              {verba.parametros.dataInicioCorrecao}
            </span>
          </div>
          <div>
            <span>Índice:</span>
            <span className="ml-1 font-medium text-foreground">
              {verba.parametros.indiceCorrecao}
            </span>
          </div>
          <div>
            <span>Juros desde:</span>
            <span className="ml-1 font-medium text-foreground">
              {verba.parametros.dataInicioJuros}
            </span>
          </div>
          <div>
            <span>Tipo:</span>
            <span className="ml-1 font-medium text-foreground">
              {NOMES_JUROS[verba.parametros.tipoJuros]}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function ResultPanel({ resultados, dadosProcesso, bcbMetadata }: ResultPanelProps) {
  const totais = {
    principal: resultados.reduce((sum, r) => sum + r.valorPrincipal, 0),
    corrigido: resultados.reduce((sum, r) => sum + r.valorCorrigido, 0),
    juros: resultados.reduce((sum, r) => sum + r.valorJuros, 0),
    total: resultados.reduce((sum, r) => sum + r.valorTotal, 0),
    material: resultados.reduce((sum, r) => sum + (r.resultadoMaterial?.valorTotal ?? 0), 0),
    moral: resultados.reduce((sum, r) => sum + (r.resultadoMoral?.valorTotal ?? 0), 0)
  }

  const temVerbasSeparadas = totais.material > 0 || totais.moral > 0

  const handleDownloadPDF = () => {
    salvarMemoriaPDF({
      ...dadosProcesso,
      resultados,
      bcbMetadata: bcbMetadata || undefined
    })
  }

  const handleDownloadDOCX = async () => {
    await salvarPeticaoDOCX({
      ...dadosProcesso,
      resultados
    })
  }

  if (resultados.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resultado do Cálculo
        </CardTitle>
        <CardDescription>
          {temVerbasSeparadas
            ? 'Cálculo com parâmetros independentes por verba'
            : 'Cálculo com parâmetros globais'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resultados por autor com detalhes das verbas */}
        {resultados.map((r) => (
          <div key={r.autor.id} className="border rounded-xl p-4 space-y-4">
            {/* Cabeçalho do autor */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{r.autor.nome || 'Sem nome'}</div>
                {r.autor.cpf && (
                  <div className="text-xs text-muted-foreground">{r.autor.cpf}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-bold text-[#93784a]">
                  {formatCurrency(r.valorTotal)}
                </div>
              </div>
            </div>

            {/* Detalhes das verbas */}
            {(r.resultadoMaterial || r.resultadoMoral) ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {r.resultadoMaterial && (
                  <VerbaDetails verba={r.resultadoMaterial} label="Dano Material" />
                )}
                {r.resultadoMoral && (
                  <VerbaDetails verba={r.resultadoMoral} label="Dano Moral" />
                )}
              </div>
            ) : (
              /* Modo legado: exibe valores consolidados */
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Principal</div>
                  <div className="font-medium">{formatCurrency(r.valorPrincipal)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Corrigido</div>
                  <div className="font-medium">{formatCurrency(r.valorCorrigido)}</div>
                  <div className="text-xs text-muted-foreground">
                    fator: {r.fatorCorrecao.toFixed(6)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Juros</div>
                  <div className="font-medium">{formatCurrency(r.valorJuros)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(r.percentualJuros * 100)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">{formatCurrency(r.valorTotal)}</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Totais por verba quando tem separação */}
        {temVerbasSeparadas && resultados.length > 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {totais.material > 0 && (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">Dano Material (total)</p>
                <p className="text-2xl font-bold">{formatCurrency(totais.material)}</p>
              </div>
            )}
            {totais.moral > 0 && (
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700 font-medium">Dano Moral (total)</p>
                <p className="text-2xl font-bold">{formatCurrency(totais.moral)}</p>
              </div>
            )}
          </div>
        )}

        {/* Total em destaque */}
        <div className="p-8 rounded-2xl border border-[#93784a]/30 bg-gradient-to-br from-[#93784a]/5 to-[#93784a]/10">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3 font-medium tracking-wide uppercase">Valor Total do Crédito</p>
            <p className="text-4xl sm:text-5xl font-bold text-[#93784a] tracking-tight">{formatCurrency(totais.total)}</p>
          </div>
        </div>

        {/* Fonte dos dados BCB */}
        {bcbMetadata && bcbMetadata.seriesConsultadas.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700">
              <span className="font-medium">Fonte:</span> Banco Central do Brasil (SGS) —{' '}
              {bcbMetadata.seriesConsultadas.map(s => `Série ${s.codigo} (${s.tipo})`).join(', ')}
              {bcbMetadata.ultimaAtualizacao && (
                <span className="text-emerald-600">
                  {' '}— Consultado às {bcbMetadata.ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Botões de download */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleDownloadPDF} variant="gold" className="flex-1 h-12 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <Download className="h-5 w-5 mr-2" />
            Baixar Memória de Cálculo (PDF)
          </Button>
          <Button onClick={handleDownloadDOCX} variant="outline" className="flex-1 h-12 rounded-xl bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#2f3a44] hover:border-gray-300 transition-all duration-300">
            <FileSpreadsheet className="h-5 w-5 mr-2" />
            Baixar Petição (DOCX)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
