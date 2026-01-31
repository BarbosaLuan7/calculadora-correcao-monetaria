import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ResultadoCalculo, type TipoIndice, type TipoJuros, type TipoMarcoJuros, NOMES_INDICES, NOMES_JUROS, NOMES_MARCO_JUROS } from '@/types'
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
    indiceCorrecao: TipoIndice
    tipoJuros: TipoJuros
    marcoJuros?: TipoMarcoJuros
  }
}

export function ResultPanel({ resultados, dadosProcesso }: ResultPanelProps) {
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
      resultados
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
          Correção: {NOMES_INDICES[dadosProcesso.indiceCorrecao]} | Juros: {NOMES_JUROS[dadosProcesso.tipoJuros]}
          {dadosProcesso.marcoJuros && ` (desde ${NOMES_MARCO_JUROS[dadosProcesso.marcoJuros].toLowerCase()})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabela de resultados por autor */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Autor</th>
                {temVerbasSeparadas ? (
                  <>
                    <th className="text-right py-2 px-3 font-medium">D. Material</th>
                    <th className="text-right py-2 px-3 font-medium">D. Moral</th>
                  </>
                ) : (
                  <>
                    <th className="text-right py-2 px-3 font-medium">Principal</th>
                    <th className="text-right py-2 px-3 font-medium">Corrigido</th>
                    <th className="text-right py-2 px-3 font-medium">Juros</th>
                  </>
                )}
                <th className="text-right py-2 px-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.autor.id} className="border-b">
                  <td className="py-2 px-3">
                    <div>
                      <div className="font-medium">{r.autor.nome || 'Sem nome'}</div>
                      {r.autor.cpf && (
                        <div className="text-xs text-muted-foreground">{r.autor.cpf}</div>
                      )}
                    </div>
                  </td>
                  {temVerbasSeparadas ? (
                    <>
                      <td className="text-right py-2 px-3">
                        {r.resultadoMaterial ? (
                          <div>
                            <div>{formatCurrency(r.resultadoMaterial.valorTotal)}</div>
                            <div className="text-xs text-muted-foreground">
                              principal: {formatCurrency(r.resultadoMaterial.valorPrincipal)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="text-right py-2 px-3">
                        {r.resultadoMoral ? (
                          <div>
                            <div>{formatCurrency(r.resultadoMoral.valorTotal)}</div>
                            <div className="text-xs text-muted-foreground">
                              principal: {formatCurrency(r.resultadoMoral.valorPrincipal)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-right py-2 px-3">{formatCurrency(r.valorPrincipal)}</td>
                      <td className="text-right py-2 px-3">
                        <div>{formatCurrency(r.valorCorrigido)}</div>
                        <div className="text-xs text-muted-foreground">
                          fator: {r.fatorCorrecao.toFixed(6)}
                        </div>
                      </td>
                      <td className="text-right py-2 px-3">
                        <div>{formatCurrency(r.valorJuros)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercent(r.percentualJuros * 100)}
                        </div>
                      </td>
                    </>
                  )}
                  <td className="text-right py-2 px-3 font-medium">{formatCurrency(r.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
            {resultados.length > 1 && (
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td className="py-2 px-3">TOTAL</td>
                  {temVerbasSeparadas ? (
                    <>
                      <td className="text-right py-2 px-3">{formatCurrency(totais.material)}</td>
                      <td className="text-right py-2 px-3">{formatCurrency(totais.moral)}</td>
                    </>
                  ) : (
                    <>
                      <td className="text-right py-2 px-3">{formatCurrency(totais.principal)}</td>
                      <td className="text-right py-2 px-3">{formatCurrency(totais.corrigido)}</td>
                      <td className="text-right py-2 px-3">{formatCurrency(totais.juros)}</td>
                    </>
                  )}
                  <td className="text-right py-2 px-3">{formatCurrency(totais.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Resumo das verbas quando tem separação */}
        {temVerbasSeparadas && (
          <div className="grid gap-3 sm:grid-cols-2">
            {totais.material > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Dano Material (total)</p>
                <p className="text-lg font-semibold">{formatCurrency(totais.material)}</p>
                <p className="text-xs text-muted-foreground">
                  Correção desde {dadosProcesso.dataAjuizamento || dadosProcesso.dataCitacao}
                </p>
              </div>
            )}
            {totais.moral > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Dano Moral (total)</p>
                <p className="text-lg font-semibold">{formatCurrency(totais.moral)}</p>
                <p className="text-xs text-muted-foreground">
                  Correção desde {dadosProcesso.dataSentenca || dadosProcesso.dataCitacao} (Súmula 362 STJ)
                </p>
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
