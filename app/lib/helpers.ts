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

export function parse(value: string) {
  return JSON.parse(value)
}

export function traitDescription<
  T extends { description: string; tags: string[]; value: number },
>({ description, tags, value, ...item }: T) {
  const prefix = description.indexOf('<value>') > 0 ? '' : value > 0 ? '+' : ''
  const suffix = tags.includes('percentage') ? '%' : ''

  return {
    ...item,
    description: description.replace('<value>', `${prefix}${value}${suffix}`),
    tags,
    value,
  }
}
