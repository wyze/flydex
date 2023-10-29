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

export function getTopLoadout<
  T extends Record<`slot_${number}`, Array<{ wl_ratio: string }>>,
>(value: T) {
  const loadout = [
    ...value.slot_0,
    ...value.slot_1,
    ...value.slot_2,
    ...value.slot_3,
  ].reduce<(typeof value)['slot_0'][number] | null>((acc, loadout) => {
    if (!acc) {
      return loadout
    }

    return Number(loadout.wl_ratio.slice(0, -1)) >
      Number(acc.wl_ratio.slice(0, -1))
      ? loadout
      : acc
  }, null)

  return { ...value, loadout }
}

export function traitDescription<
  T extends { description: string; tags: string[]; value: number },
>({ description, tags, value, ...item }: T) {
  const prefix = description.indexOf('<value>') > 0 ? '' : value > 0 ? '+' : '-'
  const suffix = tags.includes('percentage') ? '%' : ''

  return {
    ...item,
    description: description.replace('<value>', `${prefix}${value}${suffix}`),
    tags,
    value,
  }
}
