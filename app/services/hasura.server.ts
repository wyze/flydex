import {
  format,
  formatDistanceToNow,
  startOfToday,
  startOfYesterday,
} from 'date-fns'
import { GraphQLClient } from 'graphql-request'
import { z } from 'zod'

import {
  type GetCombatHistoryQueryVariables,
  type GetFlydexOwnersQueryVariables,
  type GetFlydexQueryVariables,
  type GetFlydexTokensQueryVariables,
  type GetLeaderboardQueryVariables,
  type GetModListQueryVariables,
  type GetTraitListQueryVariables,
  getSdk,
} from '~/graphql/generated'
import { MOD_RARITY_COLORS } from '~/lib/consts'
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

const trait = z.object({
  description: z.string(),
  id: z.string(),
  name: z.string(),
  tags: z.string().array(),
  value: z.number(),
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
  level: z.number(),
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
  soulbound: z.boolean(),
  win_loss: z
    .object({
      wl_ratio_24h: z.number().transform(formatPercent),
    })
    .nullable(),
  xp: z.number().transform((value) => value % 500),
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
        trait: trait.pick({
          description: true,
          tags: true,
          value: true,
        }),
      })
      .array(),
    updated_at: date,
    win_loss: z
      .object({
        battles_24h: z.number(),
        battles_3d: z.number(),
        battles_7d: z.number(),
        battles_today: z.number(),
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
        losses_today: z.number(),
        wins_24h: z.number(),
        wins_3d: z.number(),
        wins_7d: z.number(),
        wins_today: z.number(),
        wl_ratio_24h: z.number().transform(formatPercent),
        wl_ratio_3d: z.number().transform(formatPercent),
        wl_ratio_7d: z.number().transform(formatPercent),
        wl_ratio_today: z.number().transform(formatPercent),
      })
      .nullable()
      .transform(
        (value) =>
          value ??
          ({
            ...Object.fromEntries(
              ['battles', 'losses', 'wins', 'wl_ratio'].flatMap((stat) =>
                ['24h', '3d', '7d', 'today'].map((time) => [
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
  slot_0_loadouts: loadout,
  slot_1_loadouts: loadout,
  slot_2_loadouts: loadout,
  slot_3_loadouts: loadout,
})

function getModColor<T extends { rarity: z.infer<typeof mod>['rarity'] }>(
  value: T,
) {
  const color = MOD_RARITY_COLORS[value.rarity]

  return { ...value, color }
}

function getTopLoadout<
  T extends Record<`slot_${number}_loadouts`, Array<{ wl_ratio: string }>>,
>(value: T) {
  const loadout = [
    ...value.slot_0_loadouts,
    ...value.slot_1_loadouts,
    ...value.slot_2_loadouts,
    ...value.slot_3_loadouts,
  ].reduce<(typeof value)['slot_0_loadouts'][number] | null>((acc, loadout) => {
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

export async function getCombatHistory(
  variables: GetCombatHistoryQueryVariables,
) {
  const data = await sdk.getCombatHistory(variables)
  const schema = z
    .object({
      created_at: date,
      id: z.string(),
      location: z.string(),
      loser: battlefly.omit({
        win_loss: true,
      }),
      loser_slot_0_mod: mod,
      loser_slot_1_mod: mod,
      loser_slot_2_mod: mod,
      loser_slot_3_mod: mod,
      winner: battlefly.omit({
        win_loss: true,
      }),
      winner_slot_0_mod: mod,
      winner_slot_1_mod: mod,
      winner_slot_2_mod: mod,
      winner_slot_3_mod: mod,
    })
    .array()

  return {
    combat: schema.parse(data.battlefly_combat),
    total: z.number().parse(data.battlefly_combat_aggregate.aggregate?.count),
  }
}

export async function getFlydex(variables: GetFlydexQueryVariables) {
  const [data, filters] = await Promise.all([
    sdk.getFlydex(variables),
    getFlydexFilters(),
  ])

  return {
    filters,
    flies: flydex.parse(data.battlefly_flydex),
    total: z.number().parse(data.battlefly_flydex_aggregate.aggregate?.count),
    updatedAt: date.parse(
      data.battlefly_flydex_aggregate.aggregate?.min?.updated_at,
    ),
  }
}

async function getFlydexFilters() {
  const data = await sdk.getFlydexFilters()
  const schema = z.object({
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

  return schema.parse(data)
}

export async function getFlydexOwners(
  variables: GetFlydexOwnersQueryVariables,
) {
  const data = await sdk.getFlydexOwners(variables)
  const schema = z
    .object({
      owner: z.string(),
    })
    .array()

  return {
    total: z.number().parse(data.battlefly_token_aggregate.aggregate?.count),
    wallets: schema.parse(data.battlefly_token),
  }
}

export async function getFlydexTokens(
  variables: GetFlydexTokensQueryVariables,
) {
  const data = await sdk.getFlydexTokens(variables)
  const schema = z
    .object({
      name: z.string(),
      token_id: z.number().transform(String),
    })
    .array()

  return {
    tokens: schema.parse(data.battlefly_flydex),
    total: z.number().parse(data.battlefly_flydex_aggregate.aggregate?.count),
  }
}

const invitational = {
  league: {},
  token_id: {
    _in: [
      17968, 2916, 9551, 623, 3747, 28686, 8033, 20273, 21147, 29635, 14540,
    ],
  },
}

export async function getLeaderboard(params: GetLeaderboardQueryVariables) {
  const data = await sdk.getLeaderboard(
    params.where?.league?._eq === 'Invitational'
      ? { ...params, where: { ...params.where, ...invitational } }
      : params,
  )

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
    leagues
      .map(([league], index) =>
        sdk.getLeaderboard({
          limit: totals[index],
          offset: 0,
          where: { day: { _eq: day }, league: { _eq: league } },
        }),
      )
      .concat(
        sdk.getLeaderboard({
          limit: 3,
          offset: 0,
          where: {
            day: { _eq: day },
            ...invitational,
          },
        }),
      ),
  )

  return {
    leaderboards: data.map((item) =>
      leaderboard.parse(item.battlefly_leaderboard),
    ),
  }
}

async function getModFilters() {
  const data = await sdk.getModFilters()
  const schema = z.object({
    categories: z
      .object({
        category: z.string(),
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
  })

  return schema.parse(data)
}

export async function getModGroup(group: string) {
  const data = await sdk.getModGroup({ group })
  const schema = z
    .object({
      description: z.string(),
      defense_armor: z.number().nullable(),
      defense_evasion: z.number().nullable(),
      defense_shield: z.number().nullable(),
      group: z.string(),
      name: z.string(),
      season: z.string(),
      weapon_burst: z.number().nullable(),
      weapon_damage_per_fire: z.number().nullable(),
      weapon_damage_per_second: z.number().nullable(),
      weapon_reload: z.number().nullable(),
    })
    .merge(mod)
    .merge(slots)
    .array()
  const order = ['Core', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

  return {
    mods: schema
      .parse(data.battlefly_mod)
      .map(getTopLoadout)
      .map(getModColor)
      .sort(
        (left, right) =>
          order.findIndex((suffix) => left.rarity === suffix) -
          order.findIndex((suffix) => right.rarity === suffix),
      ),
  }
}

export async function getModList(params: GetModListQueryVariables) {
  const [data, filters] = await Promise.all([
    sdk.getModList(params),
    getModFilters(),
  ])
  const schema = mod.merge(slots).merge(
    z.object({
      equipped: z.number(),
      group: z.string(),
      id: z.string(),
      inventory: z.number(),
      leagues: z.string().array(),
      season: z.string(),
    }),
  )

  return {
    filters,
    mods: schema.array().parse(data.battlefly_mod).map(getTopLoadout),
    total: z.number().parse(data.battlefly_mod_aggregate.aggregate?.count),
  }
}

export async function getTraitList(params: GetTraitListQueryVariables) {
  const [data, filters] = await Promise.all([
    sdk.getTraitList(params),
    sdk.getTraitFilters(),
  ])
  const schemas = {
    data: trait.merge(
      z.object({
        equipped: z.number(),
      }),
    ),
    filters: z.object({
      tags: z
        .object({
          tag: z.string(),
        })
        .array(),
    }),
  }

  return {
    filters: schemas.filters.parse(filters),
    total: z.number().parse(data.battlefly_trait_aggregate.aggregate?.count),
    traits: schemas.data.array().parse(data.battlefly_trait),
  }
}

export async function getTreasureTag(name: string) {
  const data = await sdk.getTreasureTag({ name })

  return data.treasure_tag.at(0)?.owner ?? null
}

export async function getTreasureTagOwners(name: string) {
  const data = await sdk.getTreasureTagOwners({ name })
  const schema = z
    .object({
      display_name: z.string(),
      owner: z.string(),
    })
    .array()

  return {
    tags: schema.parse(data.treasure_tag),
    total: z.number().parse(data.treasure_tag_aggregate.aggregate?.count),
  }
}
