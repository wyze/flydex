import { type DataFunctionArgs, defer, redirect } from '@remix-run/node'
import ms from 'ms'
import queryString from 'query-string'
import { z } from 'zod'
import { zx } from 'zodix'

import { cacheable } from '~/lib/cache.server'
import { client } from '~/lib/client.server'
import { PAGE_SIZE } from '~/lib/constants'
import { formatPercent } from '~/lib/helpers'
import { battlefly } from '~/lib/schemas.server'

import {
  type GetBattlefliesQueryVariables,
  getSdk,
} from './queries.generated.server'

const schema = {
  battlefly: z
    .object({
      wl_ratio_24h: z.number().transform(formatPercent).nullable(),
    })
    .merge(
      battlefly.pick({
        contest_points: true,
        image: true,
        league: true,
        level: true,
        location: true,
        name: true,
        rank: true,
        rarity: true,
        soulbound: true,
        token_id: true,
        xp: true,
      }),
    )
    .array(),
  filters: z
    .object({
      leagues: z
        .object({
          league_full: z.string(),
        })
        .array(),
      locations: z
        .object({
          location: z.string(),
        })
        .array(),
      mods: z.object({ id: z.string(), name: z.string() }).array(),
      rarities: z
        .object({
          rarity: z.string(),
        })
        .array(),
    })
    .promise(),
  trending: z
    .object({
      change: z.number().transform((value) => {
        const symbol = value === 0 ? '' : value > 0 ? '+' : '-'

        return `${symbol}${formatPercent(Math.abs(value))}`
      }),
      flydex: z.object({
        name: z.string(),
        token_id: z.number(),
      }),
      league_full: z.string(),
      wl_ratio: z.number().transform(formatPercent),
    })
    .array(),
}

const sdk = getSdk(client)

async function getBattleflies(variables: GetBattlefliesQueryVariables) {
  const data = await cacheable(sdk.GetBattleflies.bind(null, variables), [
    'battleflies',
    variables,
  ])
  const filters = cacheable(
    sdk.GetBattleflyFilters,
    ['battleflies', 'filters'],
    ms('1h'),
  )

  return {
    filters: schema.filters.parse(filters),
    flies: schema.battlefly.parse(data.battlefly_flydex),
    total: z.number().parse(data.battlefly_flydex_aggregate.aggregate?.count),
  }
}

async function getTreasureTag(name: string) {
  const data = await cacheable(
    sdk.GetTreasureTag.bind(null, { name }),
    ['treasure-tag', name],
    ms('1h'),
  )

  return data.treasure_tag.at(0)?.owner ?? null
}

async function getTrendingTop() {
  const data = await cacheable(sdk.GetTrendingTop, ['top-trending'])

  return schema.trending.parse(data.battlefly_win_loss_trending)
}

export async function action({ request }: DataFunctionArgs) {
  const parsed = await zx.parseFormSafe(request, {
    query: z.union([
      z
        .string()
        .regex(/^\d{1,5}$/)
        .transform((value) => ({
          type: 'tokenid' as const,
          value,
        })), // Token Id
      z
        .string()
        .regex(/^\w+#\d{4}$/)
        .transform((value) => ({ type: 'treasure-tag' as const, value })), // Treasure Tag
      z
        .string()
        .regex(/^0x\w{40}$/)
        .transform((value) => ({
          type: 'wallet' as const,
          value: { token: { owner: { _eq: value.toLowerCase() } } },
        })), // Wallet
    ]),
  })

  if (!parsed.success) {
    throw new Response('Invalid search term', { status: 400 })
  }

  if (parsed.data.query.type === 'treasure-tag') {
    const owner = await getTreasureTag(parsed.data.query.value)

    if (!owner) {
      throw new Response('Treasure tag owner not found', { status: 404 })
    }

    return redirect(
      '/?'.concat(
        queryString.stringify({
          where: JSON.stringify({ token: { owner: { _eq: owner } } }),
        }),
      ),
    )
  }

  if (parsed.data.query.type === 'tokenid') {
    return redirect(`/battlefly/${parsed.data.query.value}`)
  }

  return redirect(
    '/?'.concat(
      queryString.stringify({
        where: JSON.stringify(parsed.data.query.value),
      }),
    ),
  )
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
      .refine((value) => value <= 40000),
    order_by: z
      .string()
      .default(JSON.stringify({ token_id: 'asc' }))
      .transform((value) => {
        const data = JSON.parse(value)

        if (data.level) {
          return [data, { xp: data.level }]
        }

        return data
      }),
    where: z
      .string()
      .default('{}')
      .transform((value) => {
        const data = JSON.parse(value)

        if ('location' in data) {
          data.token = { ...data.token, staked: { _eq: true } }
        }

        if ('mods' in data) {
          data.mods = { mod_id: data.mods }
        }

        return data
      }),
  })

  const flydex = await getBattleflies(params)
  const trending = await getTrendingTop()

  return defer({ ...flydex, trending })
}
