import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Packer
} from 'docx'
import { saveAs } from 'file-saver'
import { type ResultadoCalculo, NOMES_INDICES, NOMES_JUROS, type TipoIndice, type TipoJuros } from '@/types'
import { formatCurrency, formatDateToBR } from '@/lib/utils'

interface DadosPeticao {
  numeroProcesso: string
  tribunal: string
  vara: string
  dataCitacao: string
  dataCalculo: string
  indiceCorrecao: TipoIndice
  tipoJuros: TipoJuros
  resultados: ResultadoCalculo[]
  nomeAdvogado?: string
  oabAdvogado?: string
}

/**
 * Gera petição de cumprimento de sentença em DOCX
 */
export function gerarPeticaoDOCX(dados: DadosPeticao): Document {
  const totalGeral = dados.resultados.reduce((sum, r) => sum + r.valorTotal, 0)
  const listaAutores = dados.resultados.map(r => r.autor.nome).join(', ')

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Cabeçalho
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO',
              bold: true,
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `DA ${dados.vara?.toUpperCase() || 'VARA COMPETENTE'}`,
              bold: true,
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `COMARCA DE ${dados.tribunal?.toUpperCase() || 'COMPETENTE'}`,
              bold: true,
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),

        // Número do processo
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Processo nº ${dados.numeroProcesso || '0000000-00.0000.0.00.0000'}`,
              bold: true,
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),

        // Qualificação
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: listaAutores,
              bold: true,
              size: 24
            }),
            new TextRun({
              text: ', já qualificado(s) nos autos do processo em epígrafe, vem, respeitosamente, à presença de Vossa Excelência, por seu advogado infra-assinado, propor o presente',
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // Título
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'CUMPRIMENTO DE SENTENÇA',
              bold: true,
              size: 28
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // Texto
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'em face de sentença transitada em julgado, pelos fundamentos de fato e de direito a seguir expostos:',
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // DOS FATOS
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: 'I - DOS FATOS',
              bold: true,
              size: 24
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `A sentença proferida nestes autos determinou o pagamento de valores ao(s) exequente(s), devidamente corrigidos monetariamente pelo ${NOMES_INDICES[dados.indiceCorrecao]} desde a data base, acrescidos de juros de mora de ${NOMES_JUROS[dados.tipoJuros]} a partir da citação (${dados.dataCitacao}).`,
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // DO CÁLCULO
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: 'II - DO CÁLCULO',
              bold: true,
              size: 24
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `Conforme demonstrado na memória de cálculo anexa, atualizada até ${dados.dataCalculo}, o valor devido é de `,
              size: 24
            }),
            new TextRun({
              text: formatCurrency(totalGeral),
              bold: true,
              size: 24
            }),
            new TextRun({
              text: ', conforme discriminação abaixo:',
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // Tabela de valores
        criarTabelaValores(dados.resultados),

        // Espaço
        new Paragraph({ text: '' }),

        // DO PEDIDO
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [
            new TextRun({
              text: 'III - DO PEDIDO',
              bold: true,
              size: 24
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'Ante o exposto, requer:',
              size: 24
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'a) A intimação do(a) executado(a) para pagamento do débito no prazo legal de 15 (quinze) dias, sob pena de multa de 10% e honorários advocatícios, nos termos do art. 523 do CPC;',
              size: 24
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'b) Caso não efetuado o pagamento, a expedição de mandado de penhora e avaliação;',
              size: 24
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: 'c) O deferimento de todos os requerimentos necessários à satisfação do crédito.',
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // Valor da causa
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({
              text: `Dá-se à causa o valor de ${formatCurrency(totalGeral)}.`,
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),

        // Termos
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Nestes termos,',
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Pede deferimento.',
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),

        // Data
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Local e data: ${formatDateToBR(new Date())}`,
              size: 24
            })
          ]
        }),

        // Espaço
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),

        // Assinatura
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: '_______________________________________',
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: dados.nomeAdvogado || 'ADVOGADO(A)',
              bold: true,
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `OAB ${dados.oabAdvogado || 'XX 000.000'}`,
              size: 24
            })
          ]
        })
      ]
    }]
  })

  return doc
}

/**
 * Cria tabela de valores
 */
function criarTabelaValores(resultados: ResultadoCalculo[]): Table {
  const rows: TableRow[] = []

  // Cabeçalho
  rows.push(
    new TableRow({
      children: [
        criarCelulaCabecalho('Autor'),
        criarCelulaCabecalho('Principal'),
        criarCelulaCabecalho('Corrigido'),
        criarCelulaCabecalho('Juros'),
        criarCelulaCabecalho('Total')
      ]
    })
  )

  // Dados
  for (const resultado of resultados) {
    rows.push(
      new TableRow({
        children: [
          criarCelula(resultado.autor.nome),
          criarCelula(formatCurrency(resultado.valorPrincipal)),
          criarCelula(formatCurrency(resultado.valorCorrigido)),
          criarCelula(formatCurrency(resultado.valorJuros)),
          criarCelula(formatCurrency(resultado.valorTotal))
        ]
      })
    )
  }

  // Total
  if (resultados.length > 1) {
    const total = resultados.reduce((sum, r) => sum + r.valorTotal, 0)
    rows.push(
      new TableRow({
        children: [
          criarCelulaCabecalho('TOTAL'),
          criarCelula(''),
          criarCelula(''),
          criarCelula(''),
          criarCelulaCabecalho(formatCurrency(total))
        ]
      })
    )
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    rows
  })
}

function criarCelulaCabecalho(texto: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: texto,
            bold: true,
            size: 20
          })
        ]
      })
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 }
    }
  })
}

function criarCelula(texto: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: texto,
            size: 20
          })
        ]
      })
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 }
    }
  })
}

/**
 * Salva a petição em DOCX
 */
export async function salvarPeticaoDOCX(dados: DadosPeticao, nomeArquivo?: string): Promise<void> {
  const doc = gerarPeticaoDOCX(dados)
  const blob = await Packer.toBlob(doc)
  const nome = nomeArquivo || `peticao-cumprimento-${dados.numeroProcesso || 'processo'}.docx`
  saveAs(blob, nome)
}
