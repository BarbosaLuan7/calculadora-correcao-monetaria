import jsPDF from 'jspdf'
import { type ResultadoCalculo, type ResultadoVerba, NOMES_INDICES, NOMES_JUROS, NOMES_MARCO_JUROS, type TipoIndice, type TipoJuros, type TipoMarcoJuros } from '@/types'
import { formatCurrency, formatPercent, formatDateToBR } from '@/lib/utils'

interface DadosMemoria {
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
  resultados: ResultadoCalculo[]
}

/**
 * Renderiza uma tabela de verba (dano moral ou material)
 */
function renderizarTabelaVerba(
  doc: jsPDF,
  verba: ResultadoVerba,
  tipoLabel: string,
  dataBase: string,
  y: number,
  _pageWidth: number
): number {
  // Título da verba
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`${tipoLabel}:`, 25, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`(correção desde ${dataBase})`, 70, y)
  y += 6

  // Valores da verba
  const valores = [
    ['Valor Principal:', formatCurrency(verba.valorPrincipal)],
    ['Fator de Correção:', verba.fatorCorrecao.toFixed(8)],
    ['Valor Corrigido:', formatCurrency(verba.valorCorrigido)],
    ['Percentual de Juros:', formatPercent(verba.percentualJuros * 100)],
    ['Valor dos Juros:', formatCurrency(verba.valorJuros)],
  ]

  for (const [label, value] of valores) {
    doc.text(label, 30, y)
    doc.text(value, 85, y)
    y += 5
  }

  // Subtotal da verba
  doc.setFont('helvetica', 'bold')
  doc.text(`Subtotal ${tipoLabel}:`, 30, y)
  doc.text(formatCurrency(verba.valorTotal), 85, y)
  y += 8

  // Detalhamento mensal
  if (verba.detalhamento.length > 0 && verba.detalhamento.length <= 60) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalhamento da Correção:', 30, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)

    // Cabeçalho da tabela
    doc.text('Período', 30, y)
    doc.text('Índice %', 60, y)
    doc.text('Fator Acum.', 85, y)
    doc.text('Valor Corrigido', 115, y)
    y += 4

    doc.line(30, y, 150, y)
    y += 3

    for (const detalhe of verba.detalhamento) {
      if (y > 280) {
        doc.addPage()
        y = 20
      }

      doc.text(detalhe.periodo, 30, y)
      doc.text(detalhe.indiceMes.toFixed(4), 60, y)
      doc.text(detalhe.fatorAcumulado.toFixed(6), 85, y)
      doc.text(formatCurrency(detalhe.valorCorrigidoPeriodo), 115, y)
      y += 4
    }
  }

  return y + 5
}

/**
 * Gera memória de cálculo em PDF
 */
export function gerarMemoriaPDF(dados: DadosMemoria): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Título
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MEMÓRIA DE CÁLCULO', pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFontSize(12)
  doc.text('Correção Monetária e Juros de Mora', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Dados do processo
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const dados_processo: [string, string][] = [
    ['Processo:', dados.numeroProcesso || 'Não informado'],
    ['Tribunal:', dados.tribunal || 'Não informado'],
    ['Vara:', dados.vara || 'Não informada'],
  ]

  // Adiciona datas se disponíveis
  if (dados.dataAjuizamento) {
    dados_processo.push(['Data Ajuizamento:', dados.dataAjuizamento])
  }
  if (dados.dataSentenca) {
    dados_processo.push(['Data Sentença:', dados.dataSentenca])
  }
  const labelDataJuros = dados.marcoJuros ? NOMES_MARCO_JUROS[dados.marcoJuros] : 'Data da Citação'
  dados_processo.push([`${labelDataJuros}:`, dados.dataCitacao])
  dados_processo.push(['Data do Cálculo:', dados.dataCalculo])
  dados_processo.push(['Índice de Correção:', NOMES_INDICES[dados.indiceCorrecao]])
  dados_processo.push(['Juros de Mora:', NOMES_JUROS[dados.tipoJuros]])

  for (const [label, value] of dados_processo) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 70, y)
    y += 6
  }

  y += 10

  // Linha separadora
  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)
  y += 10

  // Para cada autor
  for (const resultado of dados.resultados) {
    // Verifica se precisa de nova página
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    // Nome do autor
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Autor: ${resultado.autor.nome}`, 20, y)
    if (resultado.autor.cpf) {
      doc.setFont('helvetica', 'normal')
      doc.text(`CPF: ${resultado.autor.cpf}`, pageWidth - 60, y)
    }
    y += 10

    // Verifica se tem verbas separadas
    const temVerbasSeparadas = resultado.resultadoMaterial || resultado.resultadoMoral

    if (temVerbasSeparadas) {
      // Renderiza dano material se existir
      if (resultado.resultadoMaterial) {
        if (y > 200) {
          doc.addPage()
          y = 20
        }
        y = renderizarTabelaVerba(
          doc,
          resultado.resultadoMaterial,
          'DANO MATERIAL',
          dados.dataAjuizamento || dados.dataCitacao,
          y,
          pageWidth
        )
      }

      // Renderiza dano moral se existir
      if (resultado.resultadoMoral) {
        if (y > 200) {
          doc.addPage()
          y = 20
        }
        y = renderizarTabelaVerba(
          doc,
          resultado.resultadoMoral,
          'DANO MORAL',
          dados.dataSentenca || dados.dataCitacao,
          y,
          pageWidth
        )
      }

      // Total consolidado do autor
      y += 5
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL DO AUTOR:', 25, y)
      doc.text(formatCurrency(resultado.valorTotal), 85, y)
      y += 10

    } else {
      // Modo legado: valor único
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const valores = [
        ['Valor Principal:', formatCurrency(resultado.valorPrincipal)],
        ['Fator de Correção:', resultado.fatorCorrecao.toFixed(8)],
        ['Valor Corrigido:', formatCurrency(resultado.valorCorrigido)],
        ['Percentual de Juros:', formatPercent(resultado.percentualJuros * 100)],
        ['Valor dos Juros:', formatCurrency(resultado.valorJuros)],
      ]

      for (const [label, value] of valores) {
        doc.text(label, 25, y)
        doc.text(value, 80, y)
        y += 5
      }

      // Total em destaque
      doc.setFont('helvetica', 'bold')
      doc.text('VALOR TOTAL:', 25, y)
      doc.text(formatCurrency(resultado.valorTotal), 80, y)
      y += 10

      // Detalhamento mensal (simplificado)
      if (resultado.detalhamento.length > 0 && resultado.detalhamento.length <= 60) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Detalhamento da Correção:', 25, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)

        // Cabeçalho da tabela
        doc.text('Período', 25, y)
        doc.text('Índice %', 55, y)
        doc.text('Fator Acum.', 80, y)
        doc.text('Valor Corrigido', 110, y)
        y += 4

        doc.line(25, y, 140, y)
        y += 3

        for (const detalhe of resultado.detalhamento) {
          if (y > 280) {
            doc.addPage()
            y = 20
          }

          doc.text(detalhe.periodo, 25, y)
          doc.text(detalhe.indiceMes.toFixed(4), 55, y)
          doc.text(detalhe.fatorAcumulado.toFixed(6), 80, y)
          doc.text(formatCurrency(detalhe.valorCorrigidoPeriodo), 110, y)
          y += 4
        }
      }
    }

    y += 5
    doc.line(20, y, pageWidth - 20, y)
    y += 10
  }

  // Totais gerais
  if (dados.resultados.length > 1) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAIS GERAIS', 20, y)
    y += 8

    // Calcula totais por verba se houver
    const totalMaterial = dados.resultados.reduce((sum, r) => sum + (r.resultadoMaterial?.valorTotal ?? 0), 0)
    const totalMoral = dados.resultados.reduce((sum, r) => sum + (r.resultadoMoral?.valorTotal ?? 0), 0)
    const totalPrincipal = dados.resultados.reduce((sum, r) => sum + r.valorPrincipal, 0)
    const totalCorrigido = dados.resultados.reduce((sum, r) => sum + r.valorCorrigido, 0)
    const totalJuros = dados.resultados.reduce((sum, r) => sum + r.valorJuros, 0)
    const totalGeral = dados.resultados.reduce((sum, r) => sum + r.valorTotal, 0)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    if (totalMaterial > 0) {
      doc.text(`Total Dano Material: ${formatCurrency(totalMaterial)}`, 25, y)
      y += 5
    }
    if (totalMoral > 0) {
      doc.text(`Total Dano Moral: ${formatCurrency(totalMoral)}`, 25, y)
      y += 5
    }

    doc.text(`Total Principal: ${formatCurrency(totalPrincipal)}`, 25, y)
    y += 5
    doc.text(`Total Corrigido: ${formatCurrency(totalCorrigido)}`, 25, y)
    y += 5
    doc.text(`Total Juros: ${formatCurrency(totalJuros)}`, 25, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL GERAL: ${formatCurrency(totalGeral)}`, 25, y)
  }

  // Rodapé
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Gerado em ${formatDateToBR(new Date())} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }

  return doc
}

/**
 * Salva o PDF
 */
export function salvarMemoriaPDF(dados: DadosMemoria, nomeArquivo?: string): void {
  const doc = gerarMemoriaPDF(dados)
  const nome = nomeArquivo || `memoria-calculo-${dados.numeroProcesso || 'processo'}.pdf`
  doc.save(nome)
}
