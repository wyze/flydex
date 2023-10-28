import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number) {
  return Number.isNaN(value)
    ? ''
    : Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        style: 'percent',
      }).format(value)
}
