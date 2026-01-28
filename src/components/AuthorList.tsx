import { Plus, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type Autor } from '@/types'
import { formatNumberBR, parseNumber } from '@/lib/utils'

interface AuthorListProps {
  autores: Autor[]
  onChange: (autores: Autor[]) => void
}

export function AuthorList({ autores, onChange }: AuthorListProps) {
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

  const atualizarAutor = (id: string, campo: keyof Autor, valor: string | number) => {
    onChange(autores.map(a => {
      if (a.id !== id) return a
      return { ...a, [campo]: valor }
    }))
  }

  const handleValorChange = (id: string, campo: 'valorPrincipal' | 'valorDanoMaterial' | 'valorDanoMoral', valorStr: string) => {
    const valor = parseNumber(valorStr)
    atualizarAutor(id, campo, valor)
  }

  // Verifica se algum autor tem verbas separadas
  const temVerbasSeparadas = autores.some(a =>
    (a.valorDanoMaterial ?? 0) > 0 || (a.valorDanoMoral ?? 0) > 0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Autores / Exequentes
        </CardTitle>
        <CardDescription>
          Adicione os autores e seus respectivos valores principais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {autores.map((autor, index) => (
          <div key={autor.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Autor {index + 1}
              </span>
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`nome-${autor.id}`}>Nome completo</Label>
                <Input
                  id={`nome-${autor.id}`}
                  placeholder="Nome do autor"
                  value={autor.nome}
                  onChange={(e) => atualizarAutor(autor.id, 'nome', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`cpf-${autor.id}`}>CPF (opcional)</Label>
                <Input
                  id={`cpf-${autor.id}`}
                  placeholder="000.000.000-00"
                  value={autor.cpf || ''}
                  onChange={(e) => atualizarAutor(autor.id, 'cpf', e.target.value)}
                />
              </div>
            </div>

            {/* Valores separados por verba */}
            <div className="border-t pt-3 mt-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Valores por Tipo de Dano
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Preencha os valores separados. Se tiver apenas um valor total, use o campo "Valor Principal" abaixo.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`dano-material-${autor.id}`}>Dano Material (R$)</Label>
                  <Input
                    id={`dano-material-${autor.id}`}
                    placeholder="0,00"
                    value={autor.valorDanoMaterial ? formatNumberBR(autor.valorDanoMaterial) : ''}
                    onChange={(e) => handleValorChange(autor.id, 'valorDanoMaterial', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Correção desde ajuizamento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`dano-moral-${autor.id}`}>Dano Moral (R$)</Label>
                  <Input
                    id={`dano-moral-${autor.id}`}
                    placeholder="0,00"
                    value={autor.valorDanoMoral ? formatNumberBR(autor.valorDanoMoral) : ''}
                    onChange={(e) => handleValorChange(autor.id, 'valorDanoMoral', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Correção desde sentença
                  </p>
                </div>
              </div>
            </div>

            {/* Campo legado para valor único */}
            {!temVerbasSeparadas && (
              <div className="space-y-2 border-t pt-3 mt-3">
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
                  onChange={(e) => handleValorChange(autor.id, 'valorPrincipal', e.target.value)}
                />
              </div>
            )}
          </div>
        ))}

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
