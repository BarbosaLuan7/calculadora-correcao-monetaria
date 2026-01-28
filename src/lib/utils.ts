import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function parseDateBR(dateStr: string): Date | null {
  // Aceita formato DD/MM/YYYY ou YYYY-MM-DD
  if (!dateStr) return null

  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/')
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  }

  if (dateStr.includes('-')) {
    return new Date(dateStr)
  }

  return null
}

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatDateToBR(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatPercent(value: number): string {
  return `${value.toFixed(4)}%`
}

export function parseNumber(value: string): number {
  // Converte string BR (1.234,56) para number
  if (!value) return 0
  const cleaned = value
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

export function formatNumberBR(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
