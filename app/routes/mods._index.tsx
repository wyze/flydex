import type { DataFunctionArgs, SerializeFrom } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { zx } from 'zodix'

import DataTable from '~/components/DataTable'
import Mods from '~/components/Mods'
import UnderlineLink from '~/components/UnderlineLink'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getModList } from '~/services/hasura.server'

export function loader({ request }: DataFunctionArgs) {
  const params = zx.parseQuery(request, {
    limit: z
      .number()
      .refine((value) => value <= 30)
      .default(30),
    offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 306),
    where: z
      .string()
      .default('{}')
      .transform((value) => {
        return JSON.parse(value)
      }),
  })

  return json(`mods:${JSON.stringify(params)}`, () => getModList(params))
}

export default function ModsPage() {
  const { filters, mods, total } = useLoaderData<typeof loader>()

  return (
    <div className="flex-1 p-12">
      <div className="sm:flex-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Mods
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
          A list of all mods currently in the game and some stats around them.
        </p>
      </div>
      <div className="flex flex-col">
        <DataTable
          columns={columns}
          data={mods}
          filterableColumns={[
            {
              id: 'category',
              title: 'Category',
              options: filters.categories.map(({ category }) => ({
                label: category,
                value: category,
              })),
            },
            {
              id: 'rarity',
              title: 'Rarity',
              options: filters.rarities.map(({ rarity }) => ({
                label: rarity,
                value: rarity,
              })),
            },
            {
              id: 'type',
              title: 'Types',
              options: filters.types.map(({ type }) => ({
                label: type,
                value: type,
              })),
            },
          ]}
          searchableColumns={[
            {
              id: 'name',
              title: 'Name',
            },
          ]}
          total={total}
        />
      </div>
    </div>
  )
}

type Data = SerializeFrom<typeof loader>['mods'][number]

const columns: Array<ColumnDef<Data>> = [
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
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'equipped',
    header: 'Equipped',
    cell({ getValue }) {
      const {
        aggregate: { count },
      } = getValue<Data['equipped']>()

      return count.toLocaleString()
    },
  },
  {
    accessorKey: 'inventory',
    header: 'Inventory',
    cell({ getValue }) {
      const {
        aggregate: { count },
      } = getValue<Data['inventory']>()

      return count.toLocaleString()
    },
  },
  {
    accessorKey: 'loadout',
    header: 'Top Loadout',
    cell({ getValue }) {
      const value = getValue<Data['loadout']>()

      return value ? (
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
      ) : (
        'Unused'
      )
    },
  },
]
