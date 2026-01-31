import jsPDF from 'jspdf'
import { type ResultadoCalculo, type ResultadoVerba, type BCBMetadata, NOMES_INDICES, NOMES_JUROS } from '@/types'
import { formatCurrency, formatPercent, formatDateToBR } from '@/lib/utils'

// Design tokens (matching the web app)
const COLORS = {
  primary: [47, 58, 68] as [number, number, number],      // #2f3a44
  gold: [147, 120, 74] as [number, number, number],       // #93784a
  goldLight: [168, 137, 106] as [number, number, number], // #a8896a
  gray50: [249, 250, 251] as [number, number, number],    // #f9fafb
  gray100: [243, 244, 246] as [number, number, number],   // #f3f4f6
  gray200: [229, 231, 235] as [number, number, number],   // #e5e7eb
  gray400: [156, 163, 175] as [number, number, number],   // #9ca3af
  gray500: [107, 114, 128] as [number, number, number],   // #6b7280
  gray600: [75, 85, 99] as [number, number, number],      // #4b5563
  gray700: [55, 65, 81] as [number, number, number],      // #374151
  white: [255, 255, 255] as [number, number, number],
  blue500: [59, 130, 246] as [number, number, number],    // #3b82f6
  purple600: [147, 51, 234] as [number, number, number],  // #9333ea
}

interface DadosMemoria {
  numeroProcesso: string
  tribunal: string
  vara: string
  dataAjuizamento?: string
  dataSentenca?: string
  dataCitacao: string
  dataCalculo: string
  resultados: ResultadoCalculo[]
  bcbMetadata?: BCBMetadata
}

/**
 * Desenha um retângulo arredondado
 */
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean = true,
  stroke: boolean = false
) {
  doc.roundedRect(x, y, w, h, r, r, fill ? (stroke ? 'FD' : 'F') : 'S')
}

/**
 * Desenha o header do documento
 */
function renderHeader(doc: jsPDF, pageWidth: number): number {
  let y = 15

  // Fundo do header
  doc.setFillColor(...COLORS.primary)
  roundedRect(doc, 15, 10, pageWidth - 30, 35, 4)

  // Título
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('MEMÓRIA DE CÁLCULO', pageWidth / 2, y + 10, { align: 'center' })

  // Subtítulo
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Correção Monetária e Juros de Mora', pageWidth / 2, y + 18, { align: 'center' })

  // Marca
  doc.setFontSize(8)
  doc.setTextColor(200, 200, 200)
  doc.text('Luan Barbosa Advocacia Especializada', pageWidth / 2, y + 26, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  return 55
}

/**
 * Desenha uma seção de card
 */
function renderCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string
): number {
  // Sombra sutil (simulada com retângulo mais escuro)
  doc.setFillColor(230, 230, 230)
  roundedRect(doc, x + 1, y + 1, w, h, 3)

  // Card branco
  doc.setFillColor(...COLORS.white)
  doc.setDrawColor(...COLORS.gray200)
  roundedRect(doc, x, y, w, h, 3, true, true)

  if (title) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(title, x + 8, y + 8)
    return y + 14
  }

  return y + 6
}

/**
 * Renderiza os dados do processo em um card
 */
function renderDadosProcesso(
  doc: jsPDF,
  dados: DadosMemoria,
  pageWidth: number,
  startY: number
): number {
  const cardX = 15
  const cardW = pageWidth - 30
  const cardH = 52

  let y = renderCard(doc, cardX, startY, cardW, cardH, 'Dados do Processo')

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.gray600)

  const col1X = cardX + 8
  const col2X = cardX + cardW / 2 + 5

  // Coluna 1
  doc.setFont('helvetica', 'bold')
  doc.text('Processo:', col1X, y)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.numeroProcesso || 'Não informado', col1X + 25, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Tribunal:', col1X, y)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.tribunal || 'Não informado', col1X + 25, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Vara:', col1X, y)
  doc.setFont('helvetica', 'normal')
  const vara = dados.vara || 'Não informada'
  doc.text(vara.length > 45 ? vara.substring(0, 45) + '...' : vara, col1X + 25, y)

  // Coluna 2 - Datas
  y = startY + 14
  doc.setFont('helvetica', 'bold')
  doc.text('Ajuizamento:', col2X, y)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.dataAjuizamento || '-', col2X + 28, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Sentença:', col2X, y)
  doc.setFont('helvetica', 'normal')
  doc.text(dados.dataSentenca || '-', col2X + 28, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.text('Data Cálculo:', col2X, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gold)
  doc.setFont('helvetica', 'bold')
  doc.text(dados.dataCalculo, col2X + 28, y)

  doc.setTextColor(0, 0, 0)
  return startY + cardH + 8
}

/**
 * Renderiza uma tabela de verba com estilo melhorado
 */
function renderizarTabelaVerba(
  doc: jsPDF,
  verba: ResultadoVerba,
  tipoLabel: string,
  startY: number,
  pageWidth: number
): number {
  const isMaterial = verba.tipo === 'MATERIAL'
  const corTipo = isMaterial ? COLORS.blue500 : COLORS.purple600
  const cardX = 20
  const cardW = pageWidth - 40

  // Calcula altura do card baseado no conteúdo
  const temDetalhamento = verba.detalhamento.length > 0 && verba.detalhamento.length <= 40
  const linhasDetalhamento = temDetalhamento ? Math.min(verba.detalhamento.length, 40) : 0
  const cardH = temDetalhamento ? 75 + (linhasDetalhamento * 4) : 70

  // Verifica se precisa de nova página
  if (startY + cardH > 280) {
    doc.addPage()
    startY = 20
  }

  let y = startY

  // Header colorido da verba
  doc.setFillColor(...corTipo)
  roundedRect(doc, cardX, y, cardW, 8, 2)

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(tipoLabel, cardX + 5, y + 5.5)
  y += 10

  // Card de conteúdo
  doc.setFillColor(...COLORS.gray50)
  doc.setDrawColor(...COLORS.gray200)
  const contentH = cardH - 12
  roundedRect(doc, cardX, y, cardW, contentH, 2, true, true)
  y += 6

  // Parâmetros usados
  if (verba.parametros) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.gray500)

    const indiceNome = NOMES_INDICES[verba.parametros.indiceCorrecao] || verba.parametros.indiceCorrecao
    const jurosNome = NOMES_JUROS[verba.parametros.tipoJuros] || verba.parametros.tipoJuros

    doc.text(`Correção: ${indiceNome} desde ${verba.parametros.dataInicioCorrecao}  |  Juros: ${jurosNome} desde ${verba.parametros.dataInicioJuros}`, cardX + 5, y)
    y += 6
  }

  // Grid de valores
  doc.setTextColor(...COLORS.gray700)
  doc.setFontSize(9)

  const col1 = cardX + 5
  const col2 = cardX + 45
  const col3 = cardX + 90
  const col4 = cardX + 130

  // Linha 1
  doc.setFont('helvetica', 'normal')
  doc.text('Valor Principal:', col1, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(verba.valorPrincipal), col2, y)

  doc.setFont('helvetica', 'normal')
  doc.text('Fator Correção:', col3, y)
  doc.setFont('helvetica', 'bold')
  doc.text(verba.fatorCorrecao.toFixed(6), col4, y)
  y += 5

  // Linha 2
  doc.setFont('helvetica', 'normal')
  doc.text('Valor Corrigido:', col1, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(verba.valorCorrigido), col2, y)

  doc.setFont('helvetica', 'normal')
  doc.text('Juros (' + formatPercent(verba.percentualJuros * 100) + '):', col3, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(verba.valorJuros), col4, y)
  y += 7

  // Total da verba em destaque
  doc.setFillColor(...COLORS.gold)
  roundedRect(doc, cardX + 5, y - 1, 70, 8, 2)

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('SUBTOTAL:', cardX + 8, y + 4)
  doc.text(formatCurrency(verba.valorTotal), cardX + 40, y + 4)
  y += 12

  // Detalhamento mensal (se não for muito extenso)
  if (temDetalhamento) {
    doc.setTextColor(...COLORS.gray600)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Detalhamento Mensal', cardX + 5, y)
    y += 5

    // Cabeçalho da tabela
    doc.setFillColor(...COLORS.gray200)
    doc.rect(cardX + 5, y - 2, cardW - 10, 5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...COLORS.gray600)
    doc.text('Período', cardX + 7, y + 1.5)
    doc.text('Índice %', cardX + 35, y + 1.5)
    doc.text('Fator Acum.', cardX + 60, y + 1.5)
    doc.text('Valor Corrigido', cardX + 95, y + 1.5)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLORS.gray700)

    for (let i = 0; i < verba.detalhamento.length && i < 40; i++) {
      const detalhe = verba.detalhamento[i]

      // Linhas alternadas
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 253)
        doc.rect(cardX + 5, y - 2.5, cardW - 10, 4, 'F')
      }

      doc.text(detalhe.periodo, cardX + 7, y)
      doc.text(detalhe.indiceMes.toFixed(4), cardX + 35, y)
      doc.text(detalhe.fatorAcumulado.toFixed(6), cardX + 60, y)
      doc.text(formatCurrency(detalhe.valorCorrigidoPeriodo), cardX + 95, y)
      y += 4
    }

    if (verba.detalhamento.length > 40) {
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(...COLORS.gray400)
      doc.text(`... e mais ${verba.detalhamento.length - 40} períodos`, cardX + 7, y)
      y += 4
    }
  }

  return startY + cardH + 5
}

/**
 * Renderiza o total do autor
 */
function renderTotalAutor(
  doc: jsPDF,
  total: number,
  pageWidth: number,
  y: number
): number {
  const boxW = 80
  const boxX = pageWidth - 15 - boxW

  doc.setFillColor(...COLORS.primary)
  roundedRect(doc, boxX, y, boxW, 12, 3)

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', boxX + 5, y + 7.5)
  doc.setFontSize(11)
  doc.text(formatCurrency(total), boxX + 30, y + 7.5)

  return y + 18
}

/**
 * Renderiza o rodapé
 */
function renderFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  pageNum: number,
  totalPages: number,
  bcbMetadata?: BCBMetadata
) {
  const y = pageHeight - 12

  // Linha decorativa
  doc.setDrawColor(...COLORS.gold)
  doc.setLineWidth(0.5)
  doc.line(15, y - 3, pageWidth - 15, y - 3)

  // Texto do rodapé
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.gray400)

  doc.text(`Gerado em ${formatDateToBR(new Date())}`, 15, y)

  // Fonte dos dados
  if (bcbMetadata && bcbMetadata.seriesConsultadas.length > 0) {
    const series = bcbMetadata.seriesConsultadas.map(s => `${s.codigo}`).join(', ')
    doc.text(`Fonte: BCB/SGS (Séries: ${series})`, pageWidth / 2, y, { align: 'center' })
  } else {
    doc.text('Fonte: Banco Central do Brasil', pageWidth / 2, y, { align: 'center' })
  }

  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 15, y, { align: 'right' })
}

/**
 * Gera memória de cálculo em PDF com design melhorado
 */
export function gerarMemoriaPDF(dados: DadosMemoria): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Header
  let y = renderHeader(doc, pageWidth)

  // Dados do processo
  y = renderDadosProcesso(doc, dados, pageWidth, y)

  // Para cada autor
  for (let i = 0; i < dados.resultados.length; i++) {
    const resultado = dados.resultados[i]

    // Verifica se precisa de nova página
    if (y > 220) {
      doc.addPage()
      y = 20
    }

    // Nome do autor em destaque
    doc.setFillColor(...COLORS.gray100)
    roundedRect(doc, 15, y, pageWidth - 30, 10, 2)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(`${i + 1}. ${resultado.autor.nome}`, 20, y + 6.5)

    if (resultado.autor.cpf) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...COLORS.gray500)
      doc.text(`CPF: ${resultado.autor.cpf}`, pageWidth - 20, y + 6.5, { align: 'right' })
    }
    y += 15

    // Verifica se tem verbas separadas
    const temVerbasSeparadas = resultado.resultadoMaterial || resultado.resultadoMoral

    if (temVerbasSeparadas) {
      // Dano material
      if (resultado.resultadoMaterial) {
        y = renderizarTabelaVerba(doc, resultado.resultadoMaterial, 'DANO MATERIAL', y, pageWidth)
      }

      // Dano moral
      if (resultado.resultadoMoral) {
        y = renderizarTabelaVerba(doc, resultado.resultadoMoral, 'DANO MORAL', y, pageWidth)
      }

      // Total do autor
      y = renderTotalAutor(doc, resultado.valorTotal, pageWidth, y)

    } else {
      // Modo legado: card único com valores
      const cardX = 20
      const cardW = pageWidth - 40

      doc.setFillColor(...COLORS.gray50)
      doc.setDrawColor(...COLORS.gray200)
      roundedRect(doc, cardX, y, cardW, 45, 3, true, true)

      const innerY = y + 8
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.gray700)

      const valores = [
        ['Valor Principal:', formatCurrency(resultado.valorPrincipal)],
        ['Fator de Correção:', resultado.fatorCorrecao.toFixed(8)],
        ['Valor Corrigido:', formatCurrency(resultado.valorCorrigido)],
        ['Percentual de Juros:', formatPercent(resultado.percentualJuros * 100)],
        ['Valor dos Juros:', formatCurrency(resultado.valorJuros)],
      ]

      let lineY = innerY
      for (const [label, value] of valores) {
        doc.setFont('helvetica', 'normal')
        doc.text(label, cardX + 8, lineY)
        doc.setFont('helvetica', 'bold')
        doc.text(value, cardX + 50, lineY)
        lineY += 5
      }

      // Total em destaque
      doc.setFillColor(...COLORS.gold)
      roundedRect(doc, cardX + 8, lineY + 2, 60, 8, 2)
      doc.setTextColor(...COLORS.white)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL:', cardX + 12, lineY + 7)
      doc.text(formatCurrency(resultado.valorTotal), cardX + 35, lineY + 7)

      y += 55
    }
  }

  // Totais gerais (se múltiplos autores)
  if (dados.resultados.length > 1) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }

    const totalGeral = dados.resultados.reduce((sum, r) => sum + r.valorTotal, 0)
    const totalMaterial = dados.resultados.reduce((sum, r) => sum + (r.resultadoMaterial?.valorTotal ?? 0), 0)
    const totalMoral = dados.resultados.reduce((sum, r) => sum + (r.resultadoMoral?.valorTotal ?? 0), 0)

    // Card de totais gerais
    const cardX = 15
    const cardW = pageWidth - 30

    doc.setFillColor(...COLORS.primary)
    roundedRect(doc, cardX, y, cardW, 35, 4)

    doc.setTextColor(...COLORS.white)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAIS GERAIS', cardX + 10, y + 10)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    let innerY = y + 18

    if (totalMaterial > 0) {
      doc.text(`Total Dano Material: ${formatCurrency(totalMaterial)}`, cardX + 10, innerY)
      innerY += 5
    }
    if (totalMoral > 0) {
      doc.text(`Total Dano Moral: ${formatCurrency(totalMoral)}`, cardX + 10, innerY)
    }

    // Total geral em destaque
    doc.setFillColor(...COLORS.gold)
    roundedRect(doc, cardX + cardW - 85, y + 8, 75, 18, 3)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL GERAL', cardX + cardW - 80, y + 15)
    doc.setFontSize(12)
    doc.text(formatCurrency(totalGeral), cardX + cardW - 80, y + 22)
  }

  // Indicador de fonte BCB antes dos totais
  if (dados.bcbMetadata && dados.bcbMetadata.seriesConsultadas.length > 0) {
    if (y > 260) {
      doc.addPage()
      y = 20
    }

    // Card verde com fonte BCB
    doc.setFillColor(236, 253, 245) // emerald-50
    doc.setDrawColor(167, 243, 208) // emerald-200
    roundedRect(doc, 15, y, pageWidth - 30, 14, 3, true, true)

    doc.setFontSize(8)
    doc.setTextColor(5, 150, 105) // emerald-600
    doc.setFont('helvetica', 'bold')
    doc.text('Fonte dos Índices:', 20, y + 5)
    doc.setFont('helvetica', 'normal')
    const seriesText = dados.bcbMetadata.seriesConsultadas
      .map(s => `Série ${s.codigo} - ${s.tipo} (${s.registros} registros)`)
      .join('  |  ')
    doc.text(`Banco Central do Brasil (SGS) — ${seriesText}`, 20, y + 10)

    y += 20
  }

  // Adiciona rodapé em todas as páginas
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    renderFooter(doc, pageWidth, pageHeight, i, pageCount, dados.bcbMetadata)
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
