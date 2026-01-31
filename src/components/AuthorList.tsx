import { useState } from 'react'
import { Plus, Trash2, User, ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
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
import {
  type Autor,
  type ConfiguracaoVerba,
  type TipoIndice,
  type TipoJuros,
  type TipoPresetSentenca,
  NOMES_INDICES,
  NOMES_JUROS,
  PRESETS_SENTENCA
} from '@/types'
import { formatNumberBR, parseNumber } from '@/lib/utils'

interface AuthorListProps {
  autores: Autor[]
  onChange: (autores: Autor[]) => void
  // Datas padrão do processo (usadas como fallback)
  dataAjuizamento?: string
  dataSentenca?: string
  dataCitacao?: string
  dataEventoDanoso?: string
}

// Configuração padrão para nova verba
function criarConfiguracaoPadrao(
  tipo: 'material' | 'moral',
  valor: number = 0,
  dataAjuizamento?: string,
  dataSentenca?: string,
  dataCitacao?: string
): ConfiguracaoVerba {
  const dataCorrecao = tipo === 'material'
    ? (dataAjuizamento || dataCitacao || '')
    : (dataSentenca || dataCitacao || '')

  return {
    valor,
    dataInicioCorrecao: dataCorrecao,
    indiceCorrecao: 'IPCA',
    dataInicioJuros: dataCitacao || '',
    tipoJuros: '1_PORCENTO'
  }
}

export function AuthorList({
  autores,
  onChange,
  dataAjuizamento,
  dataSentenca,
  dataCitacao,
  dataEventoDanoso
}: AuthorListProps) {
  const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({})
  const [presetSelecionado, setPresetSelecionado] = useState<TipoPresetSentenca>('classica')

  const toggleExpanded = (id: string) => {
    setExpandedAuthors(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const adicionarAutor = () => {
    const novoAutor: Autor = {
      id: `autor-${Date.now()}`,
      nome: '',
      valorPrincipal: 0
    }
    onChange([...autores, novoAutor])
  }

  const removerAutor = (id: string) => {
    if (autores.length <= 1) return
    onChange(autores.filter(a => a.id !== id))
  }

  const atualizarAutor = (id: string, updates: Partial<Autor>) => {
    onChange(autores.map(a => {
      if (a.id !== id) return a
      return { ...a, ...updates }
    }))
  }

  // Atualiza configuração de uma verba específica
  const atualizarVerba = (
    autorId: string,
    tipo: 'danoMaterial' | 'danoMoral',
    updates: Partial<ConfiguracaoVerba>
  ) => {
    onChange(autores.map(a => {
      if (a.id !== autorId) return a

      const verbaAtual = a[tipo] || criarConfiguracaoPadrao(
        tipo === 'danoMaterial' ? 'material' : 'moral',
        0,
        dataAjuizamento,
        dataSentenca,
        dataCitacao
      )

      return {
        ...a,
        [tipo]: { ...verbaAtual, ...updates }
      }
    }))
  }

  // Ativa uma verba com configuração inicial
  const ativarVerba = (autorId: string, tipo: 'danoMaterial' | 'danoMoral') => {
    const tipoVerba = tipo === 'danoMaterial' ? 'material' : 'moral'
    const config = criarConfiguracaoPadrao(tipoVerba, 0, dataAjuizamento, dataSentenca, dataCitacao)

    // Aplica preset selecionado
    if (presetSelecionado !== 'personalizado') {
      const preset = PRESETS_SENTENCA[presetSelecionado]
      const presetConfig = tipo === 'danoMaterial' ? preset.material : preset.moral

      config.indiceCorrecao = presetConfig.indice
      config.tipoJuros = presetConfig.juros

      // Define data de juros baseada no marco
      if (presetConfig.marcoJuros === 'evento' && dataEventoDanoso) {
        config.dataInicioJuros = dataEventoDanoso
      } else if (dataCitacao) {
        config.dataInicioJuros = dataCitacao
      }

      // Define data de correção baseada no marco
      if (tipo === 'danoMaterial') {
        if (presetConfig.marcoCorrecao === 'evento' && dataEventoDanoso) {
          config.dataInicioCorrecao = dataEventoDanoso
        } else if (presetConfig.marcoCorrecao === 'desembolso') {
          config.dataInicioCorrecao = '' // Usuário deve preencher
        } else if (dataAjuizamento) {
          config.dataInicioCorrecao = dataAjuizamento
        }
      }
    }

    atualizarAutor(autorId, { [tipo]: config })
  }

  // Desativa uma verba
  const desativarVerba = (autorId: string, tipo: 'danoMaterial' | 'danoMoral') => {
    atualizarAutor(autorId, { [tipo]: undefined })
  }

  // Aplica preset a todas as verbas ativas do autor
  const aplicarPreset = (autorId: string, preset: TipoPresetSentenca) => {
    if (preset === 'personalizado') return

    const presetConfig = PRESETS_SENTENCA[preset]
    const autor = autores.find(a => a.id === autorId)
    if (!autor) return

    const updates: Partial<Autor> = {}

    if (autor.danoMaterial) {
      const p = presetConfig.material
      updates.danoMaterial = {
        ...autor.danoMaterial,
        indiceCorrecao: p.indice,
        tipoJuros: p.juros,
        dataInicioCorrecao: p.marcoCorrecao === 'evento' && dataEventoDanoso
          ? dataEventoDanoso
          : (dataAjuizamento || autor.danoMaterial.dataInicioCorrecao),
        dataInicioJuros: p.marcoJuros === 'evento' && dataEventoDanoso
          ? dataEventoDanoso
          : (dataCitacao || autor.danoMaterial.dataInicioJuros)
      }
    }

    if (autor.danoMoral) {
      const p = presetConfig.moral
      updates.danoMoral = {
        ...autor.danoMoral,
        indiceCorrecao: p.indice,
        tipoJuros: p.juros,
        dataInicioCorrecao: dataSentenca || autor.danoMoral.dataInicioCorrecao,
        dataInicioJuros: p.marcoJuros === 'evento' && dataEventoDanoso
          ? dataEventoDanoso
          : (dataCitacao || autor.danoMoral.dataInicioJuros)
      }
    }

    atualizarAutor(autorId, updates)
  }

  // Verifica se algum autor tem verbas no novo formato
  const temNovoFormato = autores.some(a => a.danoMaterial || a.danoMoral)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Autores / Exequentes
            </CardTitle>
            <CardDescription>
              Configure as verbas e parâmetros de cálculo para cada autor
            </CardDescription>
          </div>

          {/* Seletor de preset global */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Tipo de Sentença:
            </Label>
            <Select
              value={presetSelecionado}
              onValueChange={(v) => setPresetSelecionado(v as TipoPresetSentenca)}
            >
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS_SENTENCA).map(([key, preset]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{preset.label}</span>
                      <span className="text-xs text-muted-foreground">{preset.descricao}</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="personalizado">
                  <div className="flex flex-col">
                    <span>Personalizado</span>
                    <span className="text-xs text-muted-foreground">Configuração manual</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {autores.map((autor, index) => {
          const isExpanded = expandedAuthors[autor.id] ?? true
          const temMaterial = !!autor.danoMaterial
          const temMoral = !!autor.danoMoral
          const temVerbas = temMaterial || temMoral

          return (
            <div key={autor.id} className="border rounded-xl overflow-hidden">
              {/* Cabeçalho do autor */}
              <div className="p-4 bg-gray-50/50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleExpanded(autor.id)}
                      className="h-8 w-8"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                      Autor {index + 1}
                    </span>
                    {autor.nome && (
                      <span className="text-sm font-semibold">{autor.nome}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {temVerbas && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => aplicarPreset(autor.id, presetSelecionado)}
                        className="h-8 text-xs"
                      >
                        <Settings2 className="h-3 w-3 mr-1" />
                        Aplicar Preset
                      </Button>
                    )}
                    {autores.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerAutor(autor.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Conteúdo expandido */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Dados básicos do autor */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`nome-${autor.id}`}>Nome completo</Label>
                      <Input
                        id={`nome-${autor.id}`}
                        placeholder="Nome do autor"
                        value={autor.nome}
                        onChange={(e) => atualizarAutor(autor.id, { nome: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`cpf-${autor.id}`}>CPF (opcional)</Label>
                      <Input
                        id={`cpf-${autor.id}`}
                        placeholder="000.000.000-00"
                        value={autor.cpf || ''}
                        onChange={(e) => atualizarAutor(autor.id, { cpf: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Verbas */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <span>Verbas Indenizatórias</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Dano Material */}
                    <VerbaConfig
                      tipo="material"
                      label="Dano Material"
                      descricaoCorrecao="Correção desde ajuizamento/desembolso"
                      config={autor.danoMaterial}
                      ativo={temMaterial}
                      onAtivar={() => ativarVerba(autor.id, 'danoMaterial')}
                      onDesativar={() => desativarVerba(autor.id, 'danoMaterial')}
                      onUpdate={(updates) => atualizarVerba(autor.id, 'danoMaterial', updates)}
                    />

                    {/* Dano Moral */}
                    <VerbaConfig
                      tipo="moral"
                      label="Dano Moral"
                      descricaoCorrecao="Correção desde sentença (Súmula 362 STJ)"
                      config={autor.danoMoral}
                      ativo={temMoral}
                      onAtivar={() => ativarVerba(autor.id, 'danoMoral')}
                      onDesativar={() => desativarVerba(autor.id, 'danoMoral')}
                      onUpdate={(updates) => atualizarVerba(autor.id, 'danoMoral', updates)}
                    />
                  </div>

                  {/* Modo legado (quando não há verbas no novo formato) */}
                  {!temNovoFormato && (
                    <div className="space-y-2 border-t pt-4 mt-4">
                      <Label htmlFor={`valor-${autor.id}`}>
                        Valor Principal (R$)
                        <span className="text-xs text-muted-foreground ml-2">
                          (use apenas se não separar dano moral/material)
                        </span>
                      </Label>
                      <Input
                        id={`valor-${autor.id}`}
                        placeholder="0,00"
                        value={autor.valorPrincipal ? formatNumberBR(autor.valorPrincipal) : ''}
                        onChange={(e) => atualizarAutor(autor.id, {
                          valorPrincipal: parseNumber(e.target.value)
                        })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <Button
          variant="outline"
          onClick={adicionarAutor}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Autor
        </Button>
      </CardContent>
    </Card>
  )
}

// Componente para configuração de uma verba
interface VerbaConfigProps {
  tipo: 'material' | 'moral'
  label: string
  descricaoCorrecao: string
  config?: ConfiguracaoVerba
  ativo: boolean
  onAtivar: () => void
  onDesativar: () => void
  onUpdate: (updates: Partial<ConfiguracaoVerba>) => void
}

function VerbaConfig({
  tipo,
  label,
  descricaoCorrecao,
  config,
  ativo,
  onAtivar,
  onDesativar,
  onUpdate
}: VerbaConfigProps) {
  const corBorda = tipo === 'material' ? 'border-blue-200' : 'border-purple-200'
  const corFundo = tipo === 'material' ? 'bg-blue-50/50' : 'bg-purple-50/50'
  const corTexto = tipo === 'material' ? 'text-blue-700' : 'text-purple-700'

  if (!ativo) {
    return (
      <Button
        variant="outline"
        onClick={onAtivar}
        className={`w-full justify-start h-12 border-dashed ${corBorda} hover:${corFundo}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar {label}
      </Button>
    )
  }

  return (
    <div className={`border rounded-lg p-4 space-y-4 ${corBorda} ${corFundo}`}>
      <div className="flex items-center justify-between">
        <span className={`font-medium ${corTexto}`}>{label}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDesativar}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <Label>Valor (R$)</Label>
        <Input
          placeholder="0,00"
          value={config?.valor ? formatNumberBR(config.valor) : ''}
          onChange={(e) => onUpdate({ valor: parseNumber(e.target.value) })}
          className="bg-white"
        />
      </div>

      {/* Correção Monetária */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data Início Correção</Label>
          <Input
            placeholder="DD/MM/AAAA"
            value={config?.dataInicioCorrecao || ''}
            onChange={(e) => onUpdate({ dataInicioCorrecao: e.target.value })}
            className="bg-white"
          />
          <p className="text-xs text-muted-foreground">{descricaoCorrecao}</p>
        </div>

        <div className="space-y-2">
          <Label>Índice de Correção</Label>
          <Select
            value={config?.indiceCorrecao || 'IPCA'}
            onValueChange={(v) => onUpdate({ indiceCorrecao: v as TipoIndice })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NOMES_INDICES).map(([key, nome]) => (
                <SelectItem key={key} value={key}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Juros de Mora */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Data Início Juros</Label>
          <Input
            placeholder="DD/MM/AAAA"
            value={config?.dataInicioJuros || ''}
            onChange={(e) => onUpdate({ dataInicioJuros: e.target.value })}
            className="bg-white"
          />
          <p className="text-xs text-muted-foreground">
            Art. 405 CC (citação) ou Súmula 54 STJ (evento)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Tipo de Juros</Label>
          <Select
            value={config?.tipoJuros || '1_PORCENTO'}
            onValueChange={(v) => onUpdate({ tipoJuros: v as TipoJuros })}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(NOMES_JUROS).map(([key, nome]) => (
                <SelectItem key={key} value={key}>{nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
