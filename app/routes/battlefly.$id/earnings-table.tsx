import { useLoaderData, useSearchParams } from '@remix-run/react'
import { format, formatDistanceToNow } from 'date-fns'
import queryString from 'query-string'

import { Icon } from '~/components/icon'
import { Owner } from '~/components/owner'
import { Pagination } from '~/components/pagination'
import { Toggle } from '~/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { usePagination } from '~/hooks/use-pagination'

import { PAGE_SIZE_5 } from './constants'
import { ParamsLink } from './params-link'
import type { loader } from './server'

const OFFSET_PARAM = 'earnings_offset'
const ZEROS_PARAM = 'earnings_include_zeros'

export function EarningsTable() {
  const { earnings, totals } = useLoaderData<typeof loader>()
  const [params, setParams] = useSearchParams()

  const page = Number(params.get(OFFSET_PARAM) ?? '0') / PAGE_SIZE_5 + 1
  const pagination = usePagination(totals.earnings, { page, size: PAGE_SIZE_5 })

  return (
    <section className="md:col-span-2" aria-labelledby="earnings">
      <div className="overflow-hidden bg-white shadow dark:bg-gray-700 sm:rounded-lg">
        <div className="flex items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <h2
              id="earnings"
              className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200"
            >
              Earnings
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Breakdown of earnings by owner. Nectar and credits are rewards
              from leaderboards.
            </p>
          </div>
          <Toggle
            defaultPressed={Boolean(params.get(ZEROS_PARAM))}
            onPressedChange={(pressed) => {
              setParams(
                queryString.stringify(
                  Array.from(params.entries()).reduce<Record<string, unknown>>(
                    (acc, [key, value]) => {
                      if (key !== ZEROS_PARAM) {
                        acc[key] = value
                      }

                      return acc
                    },
                    { [ZEROS_PARAM]: pressed ? true : undefined },
                  ),
                  { skipEmptyString: true },
                ),
                { preventScrollReset: true },
              )
            }}
            variant="outline"
          >
            Include Zeros
          </Toggle>
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
                        Owner
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                      >
                        Credits
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                      >
                        Nectar
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                      >
                        Earnings
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                      >
                        Since
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-700">
                    {earnings.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <div className="py-2 text-center italic text-muted-foreground">
                            No results found.
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {earnings.map(
                      (
                        { acquired, credits, nectar, winnings, ...props },
                        index,
                      ) => {
                        return (
                          <tr
                            key={index}
                            className={
                              index % 2
                                ? undefined
                                : 'bg-gray-50 dark:bg-gray-600'
                            }
                          >
                            <td className="py-2 pl-4 sm:pl-6">
                              <Owner {...props} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm dark:text-gray-50">
                              <Tooltip>
                                <TooltipTrigger className="inline-flex items-center gap-2">
                                  {credits?.toLocaleString() ?? 0}
                                  <Icon name="mod-pack" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {credits?.toLocaleString() ?? 0} Mod Pack
                                  {credits === 1 ? '' : 's'}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm dark:text-gray-50">
                              <div className="inline-flex items-center gap-2">
                                {nectar.toLocaleString()}
                                <Icon name="nectar" />
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-sm dark:text-gray-50">
                              <div className="inline-flex items-center gap-2">
                                {winnings.toLocaleString()}
                                <Icon
                                  className="dark:hidden"
                                  name="magic-light"
                                />
                                <Icon
                                  className="hidden dark:inline"
                                  name="magic-dark"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm dark:text-gray-50">
                              <Tooltip>
                                <TooltipTrigger className="rounded-sm bg-input px-1 py-0.5">
                                  <time dateTime={new Date(acquired).toJSON()}>
                                    {format(acquired, 'PPpp')}
                                  </time>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {formatDistanceToNow(acquired, {
                                    addSuffix: true,
                                  })}
                                </TooltipContent>
                              </Tooltip>
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
              <Pagination button={EarningsPagination} {...pagination} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function EarningsPagination(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode
    offset?: number
  },
) {
  return <ParamsLink {...props} param={OFFSET_PARAM} />
}
