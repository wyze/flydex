import { Await, useLoaderData, useSearchParams } from '@remix-run/react'
import { Suspense } from 'react'

import { Pagination } from '~/components/pagination'
import { ScrollArea } from '~/components/scroll-area'
import { Skeleton } from '~/components/ui/skeleton'
import { usePagination } from '~/hooks/use-pagination'
import * as normalize from '~/lib/normalize'

import { ModPreview } from '../resources.mod.$id/route'
import { PAGE_SIZE_5 } from './constants'
import { ParamsLink } from './params-link'
import type { loader } from './server'

const OFFSET_PARAM = 'loadout_offset'

export function LoadoutPerformance() {
  const { loadouts, totals } = useLoaderData<typeof loader>()
  const [params] = useSearchParams()

  const page = Number(params.get(OFFSET_PARAM) ?? '0') / PAGE_SIZE_5 + 1
  const pagination = usePagination(totals.loadout, { page, size: PAGE_SIZE_5 })

  return (
    <section className="md:col-span-2" aria-labelledby="loadout-performance">
      <div className="overflow-hidden bg-white shadow dark:bg-gray-700 sm:rounded-lg">
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
                    <Suspense
                      fallback={Array(PAGE_SIZE_5)
                        .fill(0)
                        .map((_, index) => (
                          <div key={index} className="px-6 py-4">
                            <Skeleton className="h-2 w-full py-3" />
                          </div>
                        ))}
                    >
                      <Await resolve={loadouts}>
                        {(loadouts) => (
                          <>
                            {loadouts.battlefly_win_loss_loadout.length ===
                            0 ? (
                              <tr>
                                <td colSpan={6}>
                                  <div className="py-2 text-center italic text-muted-foreground">
                                    No results found.
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                            {loadouts.battlefly_win_loss_loadout.map(
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
                                        : 'bg-gray-50 dark:bg-gray-600'
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
                                              <ModPreview
                                                key={index}
                                                id={mod.id}
                                              >
                                                <img
                                                  alt={mod.name}
                                                  className="w-8 rounded"
                                                  src={mod.image}
                                                  style={{
                                                    background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                                                  }}
                                                />
                                              </ModPreview>
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
                          </>
                        )}
                      </Await>
                    </Suspense>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {pagination.count > 1 ? (
            <div className="p-2">
              <Pagination
                button={LoadoutPerformancePagination}
                {...pagination}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function LoadoutPerformancePagination(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode
    offset?: number
  },
) {
  return <ParamsLink {...props} param={OFFSET_PARAM} />
}
