import { type DataFunctionArgs, defer } from '@remix-run/node'
import ms from 'ms'
import { z } from 'zod'
import { zx } from 'zodix'

import { cacheable } from '~/lib/cache.server'
import { client } from '~/lib/client.server'
import { PAGE_SIZE } from '~/lib/constants'
import { formatPercent } from '~/lib/helpers'
import { mod } from '~/lib/schemas.server'

import {
  type GetModListQueryVariables,
  getSdk,
} from './queries.generated.server'

const sdk = getSdk(client)

const loadout = z
  .object({
    slot_0: mod,
    slot_1: mod,
    slot_2: mod,
    slot_3: mod,
    wl_ratio: z.number().transform(formatPercent),
  })
  .array()
  .max(1)

const slots = z.object({
  slot_0: loadout,
  slot_1: loadout,
  slot_2: loadout,
  slot_3: loadout,
})

const schema = {
  filters: z.object({
    categories: z
      .object({
        category: z.string(),
      })
      .array(),
    classes: z
      .object({
        class: z.string(),
      })
      .array(),
    leagues: z
      .object({
        league: z.string(),
      })
      .array(),
    rarities: z
      .object({
        rarity: z.string(),
      })
      .array(),
    types: z
      .object({
        type: z.string(),
      })
      .array(),
    seasons: z.object({ season: z.string() }).array(),
  }),
  mods: mod.merge(
    z.object({
      equipped: z.number(),
      group: z.string(),
      id: z.string(),
      inventory: z.number(),
      leagues: z.string().array(),
      season: z.string(),
    }),
  ),
}

async function getModFilters() {
  const data = await cacheable(sdk.GetModFilters, ['mods', 'filters'])

  return schema.filters.parse(data)
}

async function getModList(variables: GetModListQueryVariables) {
  const data = await cacheable(sdk.GetModList.bind(null, variables), [
    'mods',
    variables,
  ])
  const loadouts = cacheable(
    function query() {
      return Promise.all(
        data.battlefly_mod.map(({ id }) => sdk.GetModLoadout({ id })),
      )
    },
    ['mods', 'loadouts', variables],
    ms('1h'),
  )

  return {
    loadouts: slots.array().promise().parse(loadouts),
    mods: schema.mods.array().parse(data.battlefly_mod),
    total: z.number().parse(data.battlefly_mod_aggregate.aggregate?.count),
  }
}

function parse(value: string) {
  return JSON.parse(value)
}

export async function loader({ request }: DataFunctionArgs) {
  const params = zx.parseQuery(request, {
    limit: z
      .number()
      .refine((value) => value <= PAGE_SIZE)
      .default(PAGE_SIZE),
    offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 500),
    order_by: z
      .string()
      .default(JSON.stringify([{ group: 'asc' }, { name: 'asc' }]))
      .transform(parse),
    where: z.string().default('{}').transform(parse),
  })

  const [filters, data] = await Promise.all([
    getModFilters(),
    getModList(params),
  ])

  return defer({ filters, ...data })
}
