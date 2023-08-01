import type { DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { zx } from 'zodix'

import { DescriptionListCard } from '~/components/description-list-card'
import { Mods } from '~/components/mods'
import { Badge } from '~/components/ui/badge'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getModGroup } from '~/services/hasura.server'

export function loader({ params }: DataFunctionArgs) {
  const { group } = zx.parseParams(params, {
    group: z.string().min(1),
  })

  return json(`mod:group:${group}`, () => getModGroup(group.replace(/-/g, ' ')))
}

export default function ModGroup() {
  const { mods } = useLoaderData<typeof loader>()
  const [mod] = mods
  const startColor = 'rgba(0, 0, 0, 1)'
  const endColor = 'rgba(255, 255, 255, 1)'

  return (
    <div className="flex-1">
      <div
        className="h-36 w-full flex-shrink-0"
        style={{
          background: `linear-gradient(to bottom right, ${startColor}, ${endColor})`,
        }}
      />
      <div
        className="pointer-events-none mx-auto -mt-24 h-48 w-48 flex-shrink-0 select-none rounded-full border-4 border-white p-4 dark:border-gray-900"
        style={{
          background: `linear-gradient(to bottom, ${endColor}, ${startColor})`,
        }}
      >
        <img alt={mod.group} src={mod.image} />
      </div>
      <div className="px-12 py-6">
        <h1 className="text-center text-4xl font-bold dark:text-gray-200">
          {mod.group}
        </h1>
      </div>
      <div className="mx-6 mb-8 space-x-2 space-y-2 text-center md:mx-auto">
        <Badge variant="highlight">
          {mod.season
            .at(0)
            ?.toUpperCase()
            .concat(mod.season.slice(1).replace('-', ' '))}
        </Badge>
        {[mod.category, mod.type].map((value) => (
          <Badge key={value}>{value}</Badge>
        ))}
      </div>
      <div className="mx-12 mt-8 grid gap-12 p-12 md:grid-cols-2">
        {mods.map((mod) => {
          return (
            <DescriptionListCard
              key={mod.name}
              data={{
                Rarity: (
                  <div
                    className={`${
                      ['Core', 'Epic'].includes(mod.rarity)
                        ? 'text-gray-100'
                        : 'text-gray-800'
                    } rounded-md border px-1 text-xs dark:border-gray-900`}
                    style={{
                      background: `rgb(${mod.color})`,
                    }}
                  >
                    {mod.rarity}
                  </div>
                ),
                Armor: mod.defense_armor,
                Evasion: mod.defense_evasion,
                Sheild: mod.defense_shield,
                Burst: mod.weapon_burst,
                Damage: mod.weapon_damage_per_fire,
                DPS: mod.weapon_damage_per_second,
                Reload: mod.weapon_reload ? `${mod.weapon_reload}s` : null,
                'Top Loadout': mod.loadout ? (
                  <div className="flex items-center gap-2">
                    <Mods
                      items={
                        normalize.mods({
                          mods: Object.entries(mod.loadout)
                            .filter(([key]) => key.startsWith('slot_'))
                            .map(
                              ([key, mod]) =>
                                ({
                                  mod,
                                  slot: Number(key.slice(-1)),
                                }) as {
                                  mod: Exclude<string, typeof mod>
                                  slot: number
                                },
                            ),
                        }).equipped
                      }
                      title=""
                    />
                    W/L Ratio: {mod.loadout.wl_ratio}
                  </div>
                ) : (
                  'Unused'
                ),
              }}
              description={mod.description}
              label={mod.name.toLowerCase().replace(/ /g, '-')}
              title={mod.name}
            />
          )
        })}
      </div>
    </div>
  )
}
