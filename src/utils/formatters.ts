import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoanStatus } from "@/types";

/**
 * Format a date string to Brazilian format (dd/MM/yyyy)
 */
export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format a number as currency (R$ XX.XXX,XX)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format a percentage (XX,X%)
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Get the color for a loan status
 */
export function getStatusColor(status: LoanStatus): {
  textColor: string;
  bgColor: string;
  borderColor: string;
} {
  switch (status) {
    case 'active':
      return {
        textColor: 'text-blue-800',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-300',
      };
    case 'paid':
      return {
        textColor: 'text-green-800',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
      };
    case 'overdue':
      return {
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
      };
    case 'defaulted':
      return {
        textColor: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
      };
  }
}

/**
 * Get the display name for a loan status
 */
export function getStatusName(status: LoanStatus): string {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'paid':
      return 'Pago';
    case 'overdue':
      return 'Vencido';
    case 'defaulted':
      return 'Inadimplente';
  }
}
