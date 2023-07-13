import {
  format,
  formatDistanceToNow,
  startOfToday,
  startOfYesterday,
} from 'date-fns'
import { GraphQLClient } from 'graphql-request'
import { z } from 'zod'

import {
  type GetFlydexQueryVariables,
  type GetLeaderboardQueryVariables,
  type GetModListQueryVariables,
  getSdk,
} from '~/graphql/generated'
import { HASURA_API_KEY, HASURA_ENDPOINT } from '~/lib/env.server'

const client = new GraphQLClient(HASURA_ENDPOINT, {
  headers: { 'x-hasura-admin-secret': HASURA_API_KEY },
})
const sdk = getSdk(client)

function formatPercent(value: number) {
  return Number.isNaN(value)
    ? ''
    : Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
        style: 'percent',
      }).format(value)
}

const date = z
  .string()
  .transform((value) =>
    formatDistanceToNow(new Date(value), { addSuffix: true }),
  )

const mod = z.object({
  category: z.union([
    z.literal('Ammunition'),
    z.literal('Armor'),
    z.literal('BlackProject'),
    z.literal('Cybernetics'),
    z.literal('Electric'),
    z.literal('Energy'),
    z.literal('Fusion'),
    z.literal('Kinetic'),
    z.literal('Missile'),
    z.literal('Shield'),
  ]),
  image: z.string().url(),
  name: z.string(),
  rarity: z.union([
    z.literal('Common'),
    z.literal('Core'),
    z.literal('Epic'),
    z.literal('Legendary'),
    z.literal('Rare'),
    z.literal('Uncommon'),
  ]),
  type: z.union([
    z.literal('Defense'),
    z.literal('Utility'),
    z.literal('Weapon'),
  ]),
})

const battlefly = z.object({
  body_color: z.string(),
  contest_points: z.number(),
  edition: z.string(),
  image: z.string().url(),
  league: z.union([
    z.literal('Apex'),
    z.literal('Larvae'),
    z.literal('Monarch'),
    z.literal('Predator'),
    z.literal('Pupa'),
  ]),
  league_tier: z.number(),
  location: z
    .union([
      z.literal('hyperdome'),
      z.literal('mission_control'),
      z.literal('proving_grounds'),
      z.literal('wallet'),
    ])
    .transform((value) =>
      value
        .split('_')
        .map(([first, ...rest]) => first.toUpperCase().concat(...rest))
        .join(' '),
    ),
  mods: z
    .object({
      mod,
      slot: z.union([z.number(), z.null()]),
    })
    .array(),
  name: z.string(),
  rank: z.number(),
  rarity: z.union([
    z.literal('Artefact'),
    z.literal('Common'),
    z.literal('Epic'),
    z.literal('Legendary'),
    z.literal('Rare'),
    z.literal('Uncommon'),
  ]),
  token_id: z.number(),
  win_loss: z
    .object({
      wl_ratio_24h: z.number().transform(formatPercent),
    })
    .nullable(),
})

const detail = battlefly.merge(
  z.object({
    stat_armor_base: z.number(),
    stat_armor_current: z.number(),
    stat_battery_base: z.number(),
    stat_battery_current: z.number(),
    stat_critical_base: z.number(),
    stat_critical_current: z.number(),
    stat_critical_damage_base: z.number(),
    stat_critical_damage_current: z.number(),
    stat_critical_resists_base: z.number(),
    stat_critical_resists_current: z.number(),
    stat_evasion_base: z.number(),
    stat_evasion_current: z.number(),
    stat_hit_points_base: z.number(),
    stat_hit_points_current: z.number(),
    stat_hit_points_regen_base: z.number(),
    stat_hit_points_regen_current: z.number(),
    stat_loot_base: z.number(),
    stat_loot_current: z.number(),
    stat_scavenge_base: z.number().nullable(),
    stat_scavenge_current: z.number().nullable(),
    stat_shield_base: z.number(),
    stat_shield_current: z.number(),
    stat_shield_regen_base: z.number(),
    stat_shield_regen_current: z.number(),
    token: z.object({
      owner: z.string(),
      price: z.number().nullable(),
      treasure_tag: z
        .object({
          display_name: z.string(),
        })
        .nullable(),
    }),
    traits: z
      .object({
        trait: z.object({
          name: z.string(),
          unit_type: z.union([z.literal('percentage'), z.literal('quantity')]),
          value: z.number(),
        }),
      })
      .array(),
    updated_at: date,
    win_loss: z
      .object({
        battles_24h: z.number(),
        battles_3d: z.number(),
        battles_7d: z.number(),
        loadouts: z
          .object({
            battles: z.number(),
            changed_at: date,
            losses: z.number(),
            slot_0: mod,
            slot_1: mod,
            slot_2: mod,
            slot_3: mod,
            wins: z.number(),
            wl_ratio: z.number().transform(formatPercent),
          })
          .array()
          .default([]),
        losses_24h: z.number(),
        losses_3d: z.number(),
        losses_7d: z.number(),
        wins_24h: z.number(),
        wins_3d: z.number(),
        wins_7d: z.number(),
        wl_ratio_24h: z.number().transform(formatPercent),
        wl_ratio_3d: z.number().transform(formatPercent),
        wl_ratio_7d: z.number().transform(formatPercent),
      })
      .nullable()
      .transform(
        (value) =>
          value ??
          ({
            ...Object.fromEntries(
              ['battles', 'losses', 'wins', 'wl_ratio'].flatMap((stat) =>
                ['24h', '3d', '7d'].map((time) => [
                  `${stat}_${time}`,
                  stat === 'wl_ratio' ? '0%' : 0,
                ]),
              ),
            ),
            loadouts: [],
          } as NonNullable<typeof value>),
      ),
  }),
)

const flydex = battlefly.array()

const leaderboard = z
  .object({
    day: z.string(),
    flydex: z
      .object({
        body_color: z.string(),
        image: z.string().url(),
        name: z.string(),
        token: z.object({
          owner: z.string(),
          treasure_tag: z
            .object({
              display_name: z.string(),
            })
            .nullable(),
        }),
      })
      .merge(battlefly.pick({ mods: true })),
    league: z.union([
      z.literal('Apex 1'),
      z.literal('Apex 2'),
      z.literal('Apex 3'),
      z.literal('Larvae 3'),
      z.literal('Monarch 1'),
      z.literal('Monarch 2'),
      z.literal('Monarch 3'),
      z.literal('Predator 1'),
      z.literal('Predator 2'),
      z.literal('Predator 3'),
      z.literal('Pupa 1'),
      z.literal('Pupa 2'),
      z.literal('Pupa 3'),
    ]),
    token_id: z.number(),
    wins: z.number(),
  })
  .array()

export async function getBattlefly(id: number) {
  const data = await sdk.getBattlefly({ id })
  const fly = detail.parse(data.battlefly_flydex.at(0))

  return {
    fly,
    maxRank: z
      .number()
      .parse(data.battlefly_flydex_aggregate.aggregate?.max?.rank),
    updatedAt: fly.updated_at,
  }
}

export async function getFlydex(variables: GetFlydexQueryVariables) {
  const data = await sdk.getFlydex(variables)

  return {
    flies: flydex.parse(data.battlefly_flydex),
    total: z.number().parse(data.battlefly_flydex_aggregate.aggregate?.count),
    updatedAt: date.parse(
      data.battlefly_flydex_aggregate.aggregate?.min?.updated_at,
    ),
  }
}

export async function getLeaderboard(params: GetLeaderboardQueryVariables) {
  const data = await sdk.getLeaderboard(params)

  return {
    leaderboard: leaderboard.parse(data.battlefly_leaderboard),
    today: format(startOfToday(), 'yyyy-MM-dd'),
    total: z
      .number()
      .parse(data.battlefly_leaderboard_aggregate.aggregate?.count),
    yesterday: format(startOfYesterday(), 'yyyy-MM-dd'),
  }
}

export async function getLeaderboardOverview(day: string) {
  const leagues = (
    [
      ['Apex', 5],
      ['Predator', 5],
      ['Monarch', 10],
      ['Pupa', 10],
    ] as const
  ).flatMap(([league, percent]) =>
    [1, 2, 3].map((tier) => [`${league} ${tier}`, percent] as const),
  )
  const totals = await Promise.all(
    leagues.map(async ([league, percent]) => {
      const data = await sdk.getLeaderboardOverview({
        where: { day: { _eq: day }, league: { _eq: league } },
      })
      const amount = z
        .number()
        .parse(data.battlefly_leaderboard_aggregate.aggregate?.count)

      return Math.floor(amount * (percent / 100))
    }),
  )

  const data = await Promise.all(
    leagues.map(([league], index) =>
      sdk.getLeaderboard({
        limit: totals[index],
        offset: 0,
        where: { day: { _eq: day }, league: { _eq: league } },
      }),
    ),
  )

  return {
    leaderboards: data.map((item) =>
      leaderboard.parse(item.battlefly_leaderboard),
    ),
  }
}

export async function getModFilters() {
  const data = await sdk.getModFilters()
  const schema = z.object({
    categories: z
      .object({
        category: z.string(),
      })
      .array(),
    types: z
      .object({
        type: z.string(),
      })
      .array(),
  })

  return schema.parse(data)
}

export async function getModList(params: GetModListQueryVariables) {
  const data = await sdk.getModList(params)
  const aggregate = z.object({
    aggregate: z.object({
      count: z.number(),
    }),
  })
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
  const schema = mod.merge(
    z.object({
      description: z.string(),
      defense_armor: z.number().nullable(),
      defense_evasion: z.number().nullable(),
      defense_shield: z.number().nullable(),
      equipped: aggregate,
      group: z.string(),
      id: z.string(),
      inventory: aggregate,
      slot_0_loadouts: loadout,
      slot_1_loadouts: loadout,
      slot_2_loadouts: loadout,
      slot_3_loadouts: loadout,
      weapon_burst: z.number().nullable(),
      weapon_damage_per_fire: z.number().nullable(),
      weapon_damage_per_second: z.number().nullable(),
      weapon_reload: z.number().nullable(),
    }),
  )

  return {
    mods: schema.array().parse(data.battlefly_mod),
    total: z.number().parse(data.battlefly_mod_aggregate.aggregate?.count),
  }
}

export async function getTreasureTag(name: string) {
  const data = await sdk.getTreasureTag({ name })

  return data.treasure_tag.at(0)?.owner ?? null
}
