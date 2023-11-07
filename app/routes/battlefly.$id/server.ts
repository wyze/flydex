import { type DataFunctionArgs, defer } from '@remix-run/node'
import { formatDistanceToNow } from 'date-fns'
import { z } from 'zod'
import { zx } from 'zodix'

import { cacheable } from '~/lib/cache.server'
import { client } from '~/lib/client.server'
import { formatPercent, traitDescription } from '~/lib/helpers'
import { mod, trait } from '~/lib/schemas.server'

import { PAGE_SIZE_5, PAGE_SIZE_10 } from './constants'
import {
  type GetBattleflyEarningsQueryVariables,
  type GetBattleflyQueryVariables,
  type GetCombatHistoryQueryVariables,
  type GetCombatHistoryTotalQueryVariables,
  type GetLoadoutPerformanceQueryVariables,
  type GetLoadoutPerformanceTotalQueryVariables,
  getSdk,
} from './queries.generated.server'

const date = z
  .string()
  .transform((value) =>
    formatDistanceToNow(new Date(value), { addSuffix: true }),
  )
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
        trait: trait
          .pick({
            description: true,
            tags: true,
            value: true,
          })
          .transform(traitDescription),
      })
      .array(),
    updated_at: date,
    win_loss: z
      .object({
        battles_24h: z.number(),
        battles_3d: z.number(),
        battles_7d: z.number(),
        battles_today: z.number(),
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

const schema = {
  combat: z
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
    .array(),
  detail,
  loadout: z
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
    .array(),
}

const sdk = getSdk(client)

async function getBattlefly(variables: GetBattleflyQueryVariables) {
  const data = await cacheable(sdk.GetBattlefly.bind(null, variables), [
    'battlefly',
    variables,
  ])

  return schema.detail.parse(data.battlefly_flydex.at(0))
}

async function getCombatHistory(variables: GetCombatHistoryQueryVariables) {
  const data = cacheable(sdk.GetCombatHistory.bind(null, variables), [
    'combat-history',
    variables,
  ])

  return z.object({ battlefly_combat: schema.combat }).promise().parse(data)
}

async function getCombatHistoryTotal(
  variables: GetCombatHistoryTotalQueryVariables,
) {
  const data = await cacheable(
    sdk.GetCombatHistoryTotal.bind(null, variables),
    ['combat-history', 'total', variables],
  )

  return z.number().parse(data.battlefly_combat_aggregate.aggregate?.count)
}

async function getLoadoutPerformance(
  variables: GetLoadoutPerformanceQueryVariables,
) {
  const data = cacheable(sdk.GetLoadoutPerformance.bind(null, variables), [
    'loadout-performance',
    variables,
  ])

  return z
    .object({ battlefly_win_loss_loadout: schema.loadout })
    .promise()
    .parse(data)
}

async function getLoadoutPerformanceTotal(
  variables: GetLoadoutPerformanceTotalQueryVariables,
) {
  const data = await cacheable(
    sdk.GetLoadoutPerformanceTotal.bind(null, variables),
    ['loadout-performance', 'total', variables],
  )

  return z
    .number()
    .parse(data.battlefly_win_loss_loadout_aggregate.aggregate?.count)
}

async function getMaxRank() {
  const data = await cacheable(sdk.GetMaxRank, ['max-rank'])

  return z.number().parse(data.battlefly_flydex_aggregate.aggregate?.max?.rank)
}

export async function loader({ params, request }: DataFunctionArgs) {
  const parsed = zx.parseParams(params, { id: z.string().transform(Number) })
  const query = zx.parseQuery(request, {
    combat_offset: z.string().default('0').transform(Number),
    loadout_offset: z.string().default('0').transform(Number),
  })

  const combat = getCombatHistory({
    id: parsed.id,
    limit: PAGE_SIZE_10,
    offset: query.combat_offset,
  })

  const loadouts = getLoadoutPerformance({
    id: parsed.id,
    limit: PAGE_SIZE_5,
    offset: query.loadout_offset,
  })

  const [combatTotal, loadoutTotal, fly, maxRank] = await Promise.all(
    [
      getLoadoutPerformanceTotal(parsed),
      getCombatHistoryTotal(parsed),
      getBattlefly(parsed),
      getMaxRank(),
    ],
  )

  return defer({
    combat,
    earnings,
    fly,
    loadouts,
    maxRank,
    totals: { combat: combatTotal, loadout: loadoutTotal },
  })
}
