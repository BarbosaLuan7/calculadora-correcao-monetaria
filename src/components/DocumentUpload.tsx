import { useState, useCallback } from 'react'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type DadosExtraidos } from '@/types'
import { extrairDadosSentenca } from '@/services/extracao'

interface DocumentUploadProps {
  onDataExtracted: (data: DadosExtraidos) => void
  apiKeyConfigured: boolean
}

export function DocumentUpload({ onDataExtracted, apiKeyConfigured }: DocumentUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    setIsLoading(true)

    try {
      if (!apiKeyConfigured) {
        throw new Error('API key do Claude não configurada')
      }

      const dados = await extrairDadosSentenca(file)
      onDataExtracted(dados)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar documento')
    } finally {
      setIsLoading(false)
    }
  }, [onDataExtracted, apiKeyConfigured])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      const input = document.createElement('input')
      input.type = 'file'
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)

      const changeEvent = {
        target: { files: dataTransfer.files }
      } as React.ChangeEvent<HTMLInputElement>

      handleFileChange(changeEvent)
    }
  }, [handleFileChange])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload da Sentença
        </CardTitle>
        <CardDescription>
          Faça upload do PDF da sentença para extração automática dos dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Analisando documento...</p>
              <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste e solte o arquivo aqui ou
              </p>
              <label>
                <Button variant="outline" asChild>
                  <span>Selecionar arquivo</span>
                </Button>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, PNG ou JPG (máx. 10MB)
              </p>
            </>
          )}
        </div>

        {fileName && !isLoading && !error && (
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {fileName}
          </p>
        )}

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Erro ao processar</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
