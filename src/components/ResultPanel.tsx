import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ResultadoCalculo, type TipoIndice, type TipoJuros, NOMES_INDICES, NOMES_JUROS } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { salvarMemoriaPDF } from '@/services/pdf'
import { salvarPeticaoDOCX } from '@/services/docx'

interface ResultPanelProps {
  resultados: ResultadoCalculo[]
  dadosProcesso: {
    numeroProcesso: string
    tribunal: string
    vara: string
    dataCitacao: string
    dataCalculo: string
    indiceCorrecao: TipoIndice
    tipoJuros: TipoJuros
  }
}

export function ResultPanel({ resultados, dadosProcesso }: ResultPanelProps) {
  const totais = {
    principal: resultados.reduce((sum, r) => sum + r.valorPrincipal, 0),
    corrigido: resultados.reduce((sum, r) => sum + r.valorCorrigido, 0),
    juros: resultados.reduce((sum, r) => sum + r.valorJuros, 0),
    total: resultados.reduce((sum, r) => sum + r.valorTotal, 0)
  }

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
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabela de resultados por autor */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Autor</th>
                <th className="text-right py-2 px-3 font-medium">Principal</th>
                <th className="text-right py-2 px-3 font-medium">Corrigido</th>
                <th className="text-right py-2 px-3 font-medium">Juros</th>
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
                  <td className="text-right py-2 px-3 font-medium">{formatCurrency(r.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
            {resultados.length > 1 && (
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td className="py-2 px-3">TOTAL</td>
                  <td className="text-right py-2 px-3">{formatCurrency(totais.principal)}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(totais.corrigido)}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(totais.juros)}</td>
                  <td className="text-right py-2 px-3">{formatCurrency(totais.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Total em destaque */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor Total do Crédito</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totais.total)}</p>
          </div>
        </div>

        {/* Botões de download */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleDownloadPDF} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Baixar Memória de Cálculo (PDF)
          </Button>
          <Button onClick={handleDownloadDOCX} variant="outline" className="flex-1">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Baixar Petição (DOCX)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
