import { useLoaderData } from '@remix-run/react'

import { DescriptionListCard } from '~/components/description-list-card'
import { Icon } from '~/components/icon'
import { MobileTooltip } from '~/components/mobile-tooltip'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'

import { TopLoadout } from '../mods._index/top-loadout'
import { loader } from './server'

export { loader }

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
        <Badge variant="secondary">{mod.class}</Badge>
        {[mod.category, mod.type].map((value) => (
          <Badge key={value}>{value}</Badge>
        ))}
      </div>
      <div className="mx-2 mt-8 grid gap-12 p-2 pb-4 md:grid-cols-2 md:p-12 lg:mx-12">
        {mods.map((mod) => {
          const deploy = mod.defense_deploy ?? mod.weapon_deploy

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
                Deploy: deploy ? (
                  <div className="flex gap-1">
                    <span>{deploy}s</span>
                    <MobileTooltip
                      content="Time in battle before deploy."
                      trigger={<Icon className="-mt-0.5" name="info" />}
                    />
                  </div>
                ) : null,
                Evasion: mod.defense_evasion,
                HP: mod.defense_hp ?? mod.weapon_hp,
                Sheild: mod.defense_shield,
                Taunt: mod.defense_taunt,
                Burst: mod.weapon_burst,
                Damage: mod.weapon_damage_per_fire,
                DPS: mod.weapon_damage_per_second,
                Reload: mod.weapon_reload ? `${mod.weapon_reload}s` : null,
                'Top Loadout': (
                  <TopLoadout
                    className="flex items-center gap-2"
                    display="children"
                    fallback={
                      <div className="flex w-44 gap-2">
                        <div className="flex items-center gap-px">
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-3" />
                        </div>
                        <Skeleton className="mb-0.5 h-3 w-2/3" />
                      </div>
                    }
                    id={mod.id}
                  />
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
