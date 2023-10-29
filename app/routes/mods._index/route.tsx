import { useLoaderData, useLocation } from '@remix-run/react'

import { DataTable } from '~/components/data-table'
import * as compare from '~/lib/compare'

import { columns } from './columns'
import { loader } from './server'

export { loader }

export default function ModsPage() {
  const { filters, mods, total } = useLoaderData<typeof loader>()
  const { search } = useLocation()

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
          key={search}
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
              id: 'class',
              title: 'Class',
              options: filters.classes.map(({ class: value }) => ({
                label: value,
                value,
              })),
            },
            {
              id: 'leagues',
              title: 'League',
              options: filters.leagues
                .sort(compare.league)
                .map(({ league }) => ({
                  label: league,
                  value: league,
                })),
            },
            {
              id: 'rarity',
              title: 'Rarity',
              options: filters.rarities
                .sort(compare.rarity)
                .map(({ rarity }) => ({
                  label: rarity,
                  value: rarity,
                })),
            },
            {
              id: 'type',
              title: 'Type',
              options: filters.types.map(({ type }) => ({
                label: type,
                value: type,
              })),
            },
            {
              id: 'season',
              title: 'Season',
              options: filters.seasons.map(({ season }) => ({
                label:
                  season
                    .at(0)
                    ?.toUpperCase()
                    .concat(season.slice(1).replace('-', ' ')) ?? '',
                value: season,
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
