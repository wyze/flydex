import type { DataFunctionArgs, SerializeFrom } from '@remix-run/node'
import { useLoaderData, useLocation } from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { zx } from 'zodix'

import { DataTable, DataTableColumnHeader } from '~/components/data-table'
import { json } from '~/lib/responses.server'
import { getTraitList } from '~/services/hasura.server'

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
      .refine((value) => value <= 20),
    order_by: z
      .string()
      .default(JSON.stringify({ name: 'asc' }))
      .transform((value) => JSON.parse(value)),
    where: z
      .string()
      .default('{}')
      .transform((value) => JSON.parse(value)),
  })

  return json(`traits:${JSON.stringify(params)}`, () => getTraitList(params))
}

export default function TraitsPage() {
  const { filters, total, traits } = useLoaderData<typeof loader>()
  const { search } = useLocation()

  return (
    <div className="flex-1 p-12">
      <div className="sm:flex-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
          Traits
        </h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
          A list of all traits currently in the game and some stats around them.
        </p>
      </div>
      <div className="flex flex-col">
        <DataTable
          key={search}
          columns={columns}
          data={traits}
          filterableColumns={[
            {
              id: 'damage_type',
              title: 'Damage Type',
              options: filters.damage_types.map(({ damage_type }) => ({
                label: damage_type ?? '',
                value: damage_type ?? '',
              })),
            },
            {
              id: 'stat_name',
              title: 'Stat',
              options: filters.stats.map(({ stat_name }) => ({
                label: stat_name,
                value: stat_name,
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

type Data = SerializeFrom<typeof loader>['traits'][number]

const columns: Array<ColumnDef<Data>> = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell({ getValue }) {
      return <span className="font-semibold">{getValue() as string}</span>
    },
  },
  { accessorKey: 'damage_type', header: 'Damage Type' },
  { accessorKey: 'stat_name', header: 'Stat' },
  {
    accessorKey: 'equipped',
    header({ column }) {
      return <DataTableColumnHeader column={column} title="Equipped" />
    },
    cell({ getValue }) {
      const count = getValue<Data['equipped']>()

      return count.toLocaleString()
    },
  },
  {
    id: 'effect',
    header: 'Effect',
    cell({ row }) {
      const { unit_type, stat_name, value } = row.original

      return (
        <>
          {`+${value}`.replace('+-', '-')}
          {unit_type === 'percentage' ? '%' : ''} {stat_name}
        </>
      )
    },
  },
]
