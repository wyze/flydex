import type { SerializeFrom } from '@remix-run/node'
import { Await, useLoaderData } from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { Suspense } from 'react'

import { DataTableColumnHeader } from '~/components/data-table'
import { Mods } from '~/components/mods'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { UnderlineLink } from '~/components/underline-link'
import * as compare from '~/lib/compare'
import { getTopLoadout } from '~/lib/helpers'
import * as normalize from '~/lib/normalize'

import type { loader } from './server'

type Data = SerializeFrom<typeof loader>['mods'][number]

export const columns: Array<ColumnDef<Data>> = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell({ row }) {
      const {
        inventory: [{ color }],
      } = normalize.mods({
        mods: [{ mod: row.original, slot: null }],
      })

      return (
        <div className="">
          <div className="flex items-center">
            <div className="mr-4 h-10 w-10 flex-shrink-0 select-none">
              <img
                alt=""
                className="h-10 w-10 rounded p-1"
                style={{
                  background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                }}
                src={row.original.image}
              />
            </div>
            <div className="font-medium">
              <UnderlineLink
                href={`/mods/group/${row.original.group
                  .toLowerCase()
                  .replace(/ /g, '-')}`}
              >
                {row.original.name}
              </UnderlineLink>
            </div>
          </div>
        </div>
      )
    },
  },
  { accessorKey: 'rarity', header: 'Rarity' },
  { accessorKey: 'category', header: 'Category' },
  { accessorKey: 'class', header: 'Class' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'season',
    header: 'Season',
    cell({ getValue }) {
      return (
        <span className="whitespace-nowrap">
          {(getValue() as string)
            .at(0)
            ?.toUpperCase()
            .concat((getValue() as string).slice(1).replace('-', ' ')) ?? ''}
        </span>
      )
    },
  },
  {
    accessorKey: 'equipped',
    header({ column }) {
      return <DataTableColumnHeader column={column} title="Equipped" />
    },
    cell({ getValue }) {
      const count = getValue<Data['equipped']>()

      return count?.toLocaleString()
    },
    sortingFn: 'basic',
  },
  {
    accessorKey: 'inventory',
    header({ column }) {
      return <DataTableColumnHeader column={column} title="Inventory" />
    },
    cell({ getValue }) {
      const count = getValue<Data['inventory']>()

      return count.toLocaleString()
    },
    sortingFn: 'basic',
  },
  {
    accessorKey: 'leagues',
    header: 'Leagues',
    cell({ getValue }) {
      return (
        <div className="l_g:grid-cols-[repeat(3,max-content)] grid grid-cols-[repeat(2,max-content)] gap-2">
          {getValue<string[]>()
            .reduce<string[]>((acc, item) => {
              const [league, tier] = item.split(' ')
              const index = acc.findIndex((value) => value.startsWith(league))

              switch (index) {
                case -1:
                  acc.push(`${league} ${tier}`)

                  break
                default:
                  acc[index] = acc[index].concat(`, ${tier}`)

                  break
              }

              return acc
            }, [])
            .sort(compare.league)
            .map((league) => (
              <Badge key={league} className="w-max" variant="secondary">
                {league}
              </Badge>
            ))}
        </div>
      )
    },
  },
  {
    accessorKey: 'loadout',
    header: 'Top Loadout',
    minSize: 150,
    cell: TopLoadoutCell,
  },
]

function TopLoadoutCell({ row: { index } }: { row: { index: number } }) {
  const { loadouts } = useLoaderData<typeof loader>()

  return (
    <Suspense
      fallback={
        <div className="w-28">
          <Skeleton className="mb-0.5 h-3 w-2/3" />
          <div className="flex items-center gap-px">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-3" />
          </div>
        </div>
      }
    >
      <Await resolve={loadouts}>
        {(loadouts) => {
          const value = getTopLoadout(loadouts[index])?.loadout

          return value ? (
            <div className="w-28">
              <Mods
                items={
                  normalize.mods({
                    mods: Object.entries(value)
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
                title={`W/L Ratio: ${value.wl_ratio}`}
              />
            </div>
          ) : (
            'Unused'
          )
        }}
      </Await>
    </Suspense>
  )
}
