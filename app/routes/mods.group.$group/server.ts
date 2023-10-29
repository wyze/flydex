import { type DataFunctionArgs, defer } from '@remix-run/node'
import { z } from 'zod'
import { zx } from 'zodix'

import { client } from '~/lib/client.server'
import { MOD_RARITY_COLORS } from '~/lib/constants'
import { mod } from '~/lib/schemas.server'

import { getModsLoadout } from '../mods._index/server'
import { getSdk } from './queries.generated.server'

const sdk = getSdk(client)

const order = ['Core', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
const schema = z
  .object({
    class: z.string(),
    description: z.string(),
    defense_armor: z.number().nullable(),
    defense_deploy: z.number().nullable(),
    defense_evasion: z.number().nullable(),
    defense_hp: z.number().nullable(),
    defense_shield: z.number().nullable(),
    defense_taunt: z.number().nullable(),
    group: z.string(),
    id: z.string(),
    name: z.string(),
    season: z.string(),
    weapon_burst: z.number().nullable(),
    weapon_damage_per_fire: z.number().nullable(),
    weapon_damage_per_second: z.number().nullable(),
    weapon_deploy: z.number().nullable(),
    weapon_hp: z.number().nullable(),
    weapon_reload: z.number().nullable(),
  })
  .merge(mod)
  .array()

function getModColor<T extends { rarity: z.infer<typeof mod>['rarity'] }>(
  value: T,
) {
  const color = MOD_RARITY_COLORS[value.rarity]

  return { ...value, color }
}

async function getModGroup(group: string) {
  const data = await sdk.GetModGroup({ group })
  const loadouts = getModsLoadout(data.battlefly_mod)

  return {
    loadouts,
    mods: schema
      .parse(data.battlefly_mod)
      .map(getModColor)
      .sort(
        (left, right) =>
          order.findIndex((suffix) => left.rarity === suffix) -
          order.findIndex((suffix) => right.rarity === suffix),
      ),
  }
}

export async function loader({ params }: DataFunctionArgs) {
  const { group } = zx.parseParams(params, {
    group: z
      .string()
      .min(1)
      .transform((value) => value.replace(/-/g, '(-| )')),
  })

  const data = await getModGroup(group)

  return defer(data)
}
