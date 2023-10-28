import {
  Await,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@remix-run/react'
import queryString from 'query-string'
import { Suspense, useEffect, useState } from 'react'

import { DataTableFacetedFilter, MobileFilters } from '~/components/data-table'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import * as compare from '~/lib/compare'

import type { loader } from './server'

export function TableFilters() {
  const location = useLocation()
  const navigate = useNavigate()
  const { filters } = useLoaderData<typeof loader>()

  const [columnFilters, setColumnFilters] = useState(() => {
    const parsed = queryString.parse(location.search)
    const where = JSON.parse(
      typeof parsed?.where === 'string' ? parsed.where : '{}',
    ) as Record<string, Partial<{ _in: string[] }>>

    return Object.entries(where).map(([id, { _in }]) => ({
      id,
      value: _in,
    }))
  })

  useEffect(() => {
    setColumnFilters(() => {
      const parsed = queryString.parse(location.search)
      const where = JSON.parse(
        typeof parsed?.where === 'string' ? parsed.where : '{}',
      ) as Record<string, Partial<{ _in: string[] }>>

      return Object.entries(where).map(([id, { _in }]) => ({
        id,
        value: _in,
      }))
    })
  }, [location.search])

  return (
    <>
      <Suspense
        fallback={<Skeleton className="h-8 w-[125.49px] md:w-[404.27px]" />}
      >
        <Await resolve={filters}>
          {(filters) => {
            const filterableColumns = [
              {
                id: 'league_full',
                options: filters.leagues
                  .sort(compare.league)
                  .map(({ league_full }) => ({
                    label: league_full,
                    value: league_full,
                  })),
                title: 'League',
              },
              {
                id: 'location',
                options: filters.locations.map(({ location }) => ({
                  label: location
                    .replace('_', ' ')
                    .split(' ')
                    .map(([first, ...rest]) =>
                      first.toUpperCase().concat(...rest),
                    )
                    .join(' '),
                  value: location,
                })),
                title: 'Location',
              },
              {
                id: 'mods',
                options: filters.mods.map(({ id, name }) => ({
                  label: name,
                  value: id,
                })),
                title: 'Mods',
              },
              {
                id: 'rarity',
                options: filters.rarities
                  .sort(compare.rarity)
                  .map(({ rarity }) => ({
                    label: rarity,
                    value: rarity,
                  })),
                title: 'Rarity',
              },
            ]

            return (
              <>
                <div className="hidden space-x-2 md:block">
                  {filterableColumns.map(({ id, ...props }) => (
                    <DataTableFacetedFilter
                      key={id}
                      // @ts-ignore
                      column={{
                        id,
                        getFilterValue() {
                          return (
                            columnFilters.find((filter) => filter.id === id)
                              ?.value ?? []
                          )
                        },
                        setFilterValue(value) {
                          setColumnFilters((state) =>
                            state.some((filter) => filter.id === id)
                              ? state.map((filter) =>
                                  filter.id === id ? { id, value } : filter,
                                )
                              : state.concat({ id, value }),
                          )
                        },
                      }}
                      {...props}
                    />
                  ))}
                </div>
                <MobileFilters
                  filterableColumns={filterableColumns}
                  table={{
                    // @ts-ignore
                    getColumn(id) {
                      return {
                        id,
                        getFilterValue() {
                          return (
                            columnFilters.find((filter) => filter.id === id)
                              ?.value ?? []
                          )
                        },
                        setFilterValue(value) {
                          setColumnFilters((state) =>
                            state.some((filter) => filter.id === id)
                              ? state.map((filter) =>
                                  filter.id === id ? { id, value } : filter,
                                )
                              : state.concat({ id, value }),
                          )
                        },
                      }
                    },
                    // @ts-ignore
                    getState() {
                      return { columnFilters }
                    },
                  }}
                />
              </>
            )
          }}
        </Await>
      </Suspense>
      {Object.keys(columnFilters).length > 0 ? (
        <Button
          variant="ghost"
          onClick={() => {
            // setColumnFilters([])

            navigate({ pathname: '/', search: '' })
          }}
          className="ml-2 h-8 px-2 lg:px-3"
        >
          Reset
          <Icon className="ml-2" name="x" />
        </Button>
      ) : null}
    </>
  )
}
