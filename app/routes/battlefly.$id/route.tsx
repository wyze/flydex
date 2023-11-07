import { useLoaderData, useSearchParams } from '@remix-run/react'

import { DescriptionListCard } from '~/components/description-list-card'
import { Owner } from '~/components/owner'
import { ScrollArea } from '~/components/scroll-area'
import { Separator } from '~/components/separator'
import { Tabs } from '~/components/tabs'
import { Tooltip } from '~/components/tooltip'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { UnderlineLink } from '~/components/underline-link'
import * as normalize from '~/lib/normalize'
import type { ModWithColor } from '~/lib/types'
import { CombatHistory } from '~/routes/battlefly.$id/combat-history'
import { ModPreview } from '~/routes/resources.mod.$id/route'

import { EarningsTable } from './earnings-table'
import { LoadoutPerformance } from './loadout-performance'
import { loader } from './server'

export { loader }

export default function BattleflyDetail() {
  const { fly, maxRank } = useLoaderData<typeof loader>()
  const bodyColor = fly.body_color
  const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
  const { equipped, inventory } = normalize.mods(fly)
  const [params, setParams] = useSearchParams()
  const performance = (params.get('performance') ?? 'today') as
    | '24h'
    | '3d'
    | '7d'
    | 'today'

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

  const performanceOptions = [
    { label: 'Today', value: 'today' },
    { label: '24 Hours', value: '24h' },
    { label: '3 Days', value: '3d' },
    { label: '7 Days', value: '7d' },
  ]

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
                <Badge key={index}>{trait.description}</Badge>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="xs">
                    {
                      performanceOptions.find(
                        (item) => item.value === performance,
                      )?.label
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuRadioGroup
                    value={performance}
                    onValueChange={(value) => {
                      setParams(
                        (params) => {
                          params.set('performance', value)

                          return params
                        },
                        { preventScrollReset: true },
                      )
                    }}
                  >
                    {performanceOptions.map(({ label, value }) => (
                      <DropdownMenuRadioItem
                        key={value}
                        aria-label={`Performance for ${label}`}
                        value={value}
                      >
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <EarningsTable />
        <LoadoutPerformance />
        <CombatHistory />
      </div>
    </>
  )
}

function Mods({ items }: { items: ModWithColor[] }) {
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
              <div className="text-center text-sm">
                <ModPreview id={mod.id}>{mod.name}</ModPreview>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
