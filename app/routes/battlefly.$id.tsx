import type { LoaderArgs } from '@remix-run/node'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import queryString from 'query-string'
import { Fragment } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { DescriptionListCard } from '~/components/description-list-card'
import { Owner } from '~/components/owner'
import { Pagination } from '~/components/pagination'
import { Popover } from '~/components/popover'
import { ScrollArea } from '~/components/scroll-area'
import { Separator } from '~/components/separator'
import { Tabs } from '~/components/tabs'
import { ToggleGroup } from '~/components/toggle-group'
import { Tooltip } from '~/components/tooltip'
import { Badge } from '~/components/ui/badge'
import { UnderlineLink } from '~/components/underline-link'
import { usePagination } from '~/hooks/use-pagination'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import type { Mod } from '~/lib/types'
import { CombatHistory } from '~/routes/resources.combat-history'
import { getBattlefly } from '~/services/hasura.server'

export function loader({ params }: LoaderArgs) {
  const parsed = zx.parseParams(params, { id: z.string().transform(Number) })

  return json(`fly:${parsed.id}`, () => getBattlefly(parsed.id))
}

const PAGE_SIZE = 5

export default function BattleflyDetail() {
  const { fly, maxRank } = useLoaderData<typeof loader>()
  const bodyColor = fly.body_color
  const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
  const { equipped, inventory } = normalize.mods(fly)
  const [params, setParams] = useSearchParams()
  const performance = (params.get('performance') ?? '24h') as
    | '24h'
    | '3d'
    | '7d'
  const page = Number(params.get('loadout_page') ?? '1')

  const stats = Object.entries(fly)
    .filter((item): item is [string, number | null] =>
      item[0].startsWith('stat_'),
    )
    .reduce(
      (acc, [key, value]) => {
        const [stat, ...rest] = key.replace('stat_', '').split('_').reverse()
        const name = rest
          .reverse()
          .map(([letter, ...rest]) => letter.toUpperCase().concat(...rest))
          .join(' ')

        acc[name] ??= {}
        acc[name][stat] = value

        return acc
      },
      {} as Record<string, Record<string, number | null>>,
    )

  const pagination = usePagination(fly.win_loss.loadouts.length, {
    page,
    size: PAGE_SIZE,
  })

  const traits =
    fly.traits.length === 4
      ? [fly.traits.slice(0, 2), fly.traits.slice(2)]
      : [fly.traits.slice(0, 3), fly.traits.slice(3)].filter(
          (item) => item.length > 0,
        )

  return (
    <>
      <div
        className="h-36 w-full flex-shrink-0"
        style={{
          background: `linear-gradient(to bottom right, ${startColor}, ${bodyColor})`,
        }}
      />
      <img
        alt={fly.name}
        className="pointer-events-none mx-auto -mt-24 h-48 w-48 flex-shrink-0 select-none rounded-full border-4 border-white p-4 dark:border-gray-900"
        style={{
          background: `linear-gradient(to bottom, ${bodyColor}, ${startColor})`,
        }}
        src={fly.image}
      />
      <div className="px-12 py-6">
        <h1 className="text-center text-4xl font-bold dark:text-gray-200">
          {fly.name}
        </h1>
      </div>
      {fly.traits.length > 0 ? (
        <div className="mx-6 mb-8 space-y-2 md:mx-auto">
          {traits.map((trait, index) => (
            <div key={index} className="flex justify-center gap-2">
              {trait.map(({ trait }, index) => (
                <Badge key={index}>
                  {`+${trait.value}`.replace('+-', '-')}
                  {trait.tags.includes('percentage') ? '%' : ''}{' '}
                  {trait.description}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      <div className="mx-6 grid flex-1 grid-cols-1 gap-12 pb-12 md:grid-cols-2 lg:mx-auto">
        <DescriptionListCard
          data={{
            'Token ID': `#${fly.token_id}`,
            Rarity: fly.rarity,
            Edition: fly.edition,
            'XP (Level)': (
              <div className="flex gap-1">
                {fly.xp}/500<Badge>{fly.level}</Badge>
              </div>
            ),
            Owner: <Owner {...fly.token} />,
            Location: fly.location,
            Price:
              fly.token.price && fly.location === 'Wallet'
                ? `${fly.token.price.toLocaleString()} MAGIC`
                : null,
            Links: (
              <div className="flex h-full">
                <UnderlineLink
                  href={`https://play.battlefly.game/battleflies/view/${fly.token_id}`}
                >
                  BattleFly
                </UnderlineLink>{' '}
                <Separator orientation="vertical" />{' '}
                <UnderlineLink
                  href={`https://trove.treasure.lol/collection/battlefly/${fly.token_id}`}
                >
                  Trove
                </UnderlineLink>
              </div>
            ),
          }}
          description="More detailed information about the BattleFly."
          label="details"
          title="Details"
        />
        <DescriptionListCard
          data={{
            'W/L Ratio':
              fly.win_loss[`wl_ratio_${performance}`].replace(/^0%$/, '') ||
              null,
            Wins: fly.win_loss[`wins_${performance}`] || null,
            Losses: fly.win_loss[`losses_${performance}`] || null,
            Battles: fly.win_loss[`battles_${performance}`],
            'Contest Points': fly.contest_points.toLocaleString(),
            Rank: fly.rank > 0 ? `${fly.rank}/${maxRank}` : 'Unranked',
            League: `${fly.league} ${Array(fly.league_tier)
              .fill('I')
              .join('')}`,
          }}
          description="Information on how the BattleFly has performed in battle."
          label="performance"
          title={
            <div className="flex justify-between">
              Performance
              <ToggleGroup
                className="w-max"
                label="Change performance data"
                onValueChange={(performance) => {
                  const loadoutPage = params.get('loadout_page')

                  if (!performance) {
                    return
                  }

                  setParams(
                    loadoutPage
                      ? { loadout_page: loadoutPage, performance }
                      : { performance },
                    { preventScrollReset: true },
                  )
                }}
                type="single"
                value={performance}
              >
                <ToggleGroup.Item
                  className="w-max px-2 py-3"
                  label="24 hours"
                  value="24h"
                >
                  24 Hours
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  className="w-max px-2 py-3"
                  label="3 days"
                  value="3d"
                >
                  3 Days
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  className="w-max px-2 py-3"
                  label="7 days"
                  value="7d"
                >
                  7 Days
                </ToggleGroup.Item>
              </ToggleGroup>
            </div>
          }
        />
        <section className="md:col-span-2" aria-labelledby="stats">
          <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2
                id="stats"
                className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200"
              >
                Stats
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The current stats of the BattleFly. Highlighted stat is above
                its base value, hover over to see the base value.
              </p>
            </div>
            <dl className="relative grid grid-cols-2 border-gray-200 dark:border-gray-700 max-sm:grid-cols-1 md:grid-cols-4">
              <div className="absolute bottom-0 left-0 right-0 h-px bg-white dark:bg-gray-700" />
              {Object.entries(stats)
                .filter(([, { current }]) => current !== null)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="-mt-px flex justify-between border-y border-gray-200 px-4 py-3 text-sm font-medium dark:border-gray-700 sm:px-6"
                  >
                    <dt className="text-gray-500 dark:text-gray-400">{key}</dt>
                    {value.current !== value.base ? (
                      <Tooltip>
                        <Tooltip.Trigger>
                          <dd className="whitespace-nowrap text-pink-600">
                            {value.current}
                          </dd>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          Base Value: {value.base}
                        </Tooltip.Content>
                      </Tooltip>
                    ) : (
                      <dd className="whitespace-nowrap text-gray-900 dark:text-gray-200">
                        {value.current}
                      </dd>
                    )}
                  </div>
                ))}
            </dl>
          </div>
        </section>
        <section className="md:col-span-2" aria-labelledby="mods">
          <div className="bg-white shadow dark:bg-gray-800 sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2
                id="mods"
                className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                Mods
              </h2>
            </div>
            <Tabs defaultValue="equipped">
              <Tabs.List label="View battlefly's mods">
                <Tabs.Trigger value="equipped">Equipped</Tabs.Trigger>
                <Tabs.Trigger
                  disabled={inventory.length === 0}
                  value="inventory"
                >
                  Inventory
                  <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                    {inventory.length}
                  </span>
                </Tabs.Trigger>
                <Tabs.Trigger className="hidden md:flex" disabled value="null">
                  &nbsp;
                </Tabs.Trigger>
                <Tabs.Trigger className="hidden md:flex" disabled value="null">
                  &nbsp;
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="equipped">
                <Mods items={equipped} />
              </Tabs.Content>
              <Tabs.Content value="inventory">
                <Mods items={inventory} />
              </Tabs.Content>
            </Tabs>
          </div>
        </section>
        {fly.win_loss.loadouts.length > 0 ? (
          <section
            className="md:col-span-2"
            aria-labelledby="loadout-performance"
          >
            <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2
                  id="loadout-performance"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200"
                >
                  Loadout Performance
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Performance data broken down by each loadout.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5">
                      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th
                              scope="col"
                              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-50 sm:pl-6"
                            >
                              Loadout
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                            >
                              W/L Ratio
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                            >
                              Wins
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                            >
                              Losses
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                            >
                              Battles
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                            >
                              Created
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-700">
                          {fly.win_loss.loadouts
                            .slice(...pagination.range)
                            .map(
                              (
                                {
                                  battles,
                                  changed_at,
                                  losses,
                                  wins,
                                  wl_ratio,
                                  ...slots
                                },
                                index,
                              ) => {
                                const { equipped } = normalize.mods({
                                  mods: Object.entries(slots).map(
                                    ([slot, mod]) => ({
                                      slot: Number(slot.replace('slot_', '')),
                                      mod,
                                    }),
                                  ),
                                })

                                return (
                                  <tr
                                    key={index}
                                    className={
                                      index % 2
                                        ? undefined
                                        : 'bg-gray-50 dark:bg-gray-800'
                                    }
                                  >
                                    <td className="pl-2 sm:pl-4">
                                      <ScrollArea
                                        className="w-24 pb-1 md:w-40 md:pb-0"
                                        orientation="horizontal"
                                      >
                                        <div className="flex max-w-max gap-2 p-2">
                                          {equipped.map(
                                            ({ color, mod }, index) => (
                                              <Fragment key={index}>
                                                <Tooltip>
                                                  <Tooltip.Trigger className="hidden md:block">
                                                    <img
                                                      alt={mod.name}
                                                      className="w-8 rounded"
                                                      src={mod.image}
                                                      style={{
                                                        background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                                                      }}
                                                    />
                                                  </Tooltip.Trigger>
                                                  <Tooltip.Content>
                                                    {mod.name}
                                                  </Tooltip.Content>
                                                </Tooltip>
                                                <Popover>
                                                  <Popover.Trigger className="md:hidden">
                                                    <img
                                                      alt={mod.name}
                                                      className="w-8 rounded"
                                                      src={mod.image}
                                                      style={{
                                                        background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                                                      }}
                                                    />
                                                  </Popover.Trigger>
                                                  <Popover.Content>
                                                    {mod.name}
                                                  </Popover.Content>
                                                </Popover>
                                              </Fragment>
                                            ),
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </td>
                                    <td className="whitespace-nowrap px-3 text-sm dark:text-gray-50">
                                      {wl_ratio}
                                    </td>
                                    <td className="whitespace-nowrap px-3 text-sm">
                                      <div className="text-gray-900 dark:text-gray-200">
                                        {wins.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 text-sm">
                                      <div className="text-gray-900 dark:text-gray-200">
                                        {losses.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 text-sm">
                                      <div className="text-gray-900 dark:text-gray-200">
                                        {battles.toLocaleString()}
                                      </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 text-sm dark:text-gray-50">
                                      {changed_at}
                                    </td>
                                  </tr>
                                )
                              },
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {pagination.count > 1 ? (
                  <div className="p-2">
                    <Pagination button={ParamsLink} {...pagination} />
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
        <CombatHistory />
      </div>
    </>
  )
}

function Mods({ items }: { items: Mod[] }) {
  return (
    <ScrollArea
      className="max-w-[53.5rem] dark:bg-gray-700"
      orientation="horizontal"
    >
      <div className="flex gap-4 pb-4">
        {items.map(({ color, mod }, index) => {
          return (
            <div
              className="flex w-40 flex-col items-center gap-1 rounded p-4 shadow-[0_2px_3px] shadow-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:shadow-gray-900"
              key={index}
            >
              <img
                alt={mod.name}
                className="w-32 rounded"
                src={mod.image}
                style={{
                  background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                }}
              />
              <div className="text-center text-sm">{mod.name}</div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function ParamsLink({
  children,
  offset = 0,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode
  offset?: number
}) {
  const [params] = useSearchParams()
  const performance = params.get('performance') ?? ''
  const search = queryString.stringify(
    { loadout_page: `${offset / PAGE_SIZE + 1}`, performance },
    { skipEmptyString: true },
  )

  return (
    <Link preventScrollReset to={{ search }} {...props}>
      {children}
    </Link>
  )
}
