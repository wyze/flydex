import { type DataFunctionArgs, json } from '@remix-run/node'
import ms from 'ms'
import { z } from 'zod'
import { zx } from 'zodix'

import { cacheable } from '~/lib/cache.server'
import { client } from '~/lib/client.server'
import { mod } from '~/lib/schemas.server'

import {
  type GetModDetailsQueryVariables,
  getSdk,
} from './queries.generated.server'

const sdk = getSdk(client)

const schema = mod.pick({ category: true, class: true, name: true }).merge(
  z.object({
    description: z.string(),
    defense_armor: z.number().nullable(),
    defense_deploy: z.number().nullable(),
    defense_evasion: z.number().nullable(),
    defense_hp: z.number().nullable(),
    defense_shield: z.number().nullable(),
    defense_taunt: z.number().nullable(),
    season: z.string(),
    weapon_burst: z.number().nullable(),
    weapon_damage_per_fire: z.number().nullable(),
    weapon_damage_per_second: z.number().nullable(),
    weapon_deploy: z.number().nullable(),
    weapon_hp: z.number().nullable(),
    weapon_reload: z.number().nullable(),
  }),
)

async function getModDetails(variables: GetModDetailsQueryVariables) {
  const data = await cacheable(
    sdk.GetModDetails.bind(null, variables),
    ['mod', variables],
    ms('1hr'),
  )

  return schema.parse(data.battlefly_mod_by_pk)
}

export async function loader({ params }: DataFunctionArgs) {
  const details = await getModDetails(
    zx.parseParams(params, { id: z.string() }),
  )

  return json(details)
}
