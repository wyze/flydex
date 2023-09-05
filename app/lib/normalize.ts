import { MOD_RARITY_COLORS } from './consts'
import type { Fly, Mod } from './types'

export function mods<T extends { mods: Fly['mods'] }>(fly: T) {
  return fly.mods.reduce(
    (acc, mod) => {
      const color = MOD_RARITY_COLORS[mod.mod.rarity]

      if (typeof mod.slot === 'number') {
        acc.equipped.push({ ...mod, color })
      } else {
        acc.inventory.push({ ...mod, color })
      }

      return acc
    },
    { equipped: [], inventory: [] } as unknown as Record<
      'equipped' | 'inventory',
      Mod[]
    >,
  )
}

export function reward<
  T extends { credit: string | null; nectar: number; share: number } | null,
>(data: T) {
  if (!data) {
    return null
  }

  const { nectar, share, ...reward } = data
  const credit = reward?.credit
    ? reward.credit.replace('modpack', 'Mod Pack').split(':')
    : null

  return [
    share ? `${share} MAGIC` : null,
    nectar ? `${nectar} Nectar` : null,
    credit ? `${credit.at(1)} ${credit.at(0)}` : null,
  ]
    .filter(Boolean)
    .join(', ')
}
