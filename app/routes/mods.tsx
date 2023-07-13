import type { DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import queryString from 'query-string'
import { z } from 'zod'
import { zx } from 'zodix'

import Mods from '~/components/Mods'
import Pagination from '~/components/Pagination'
import usePagination from '~/hooks/usePagination'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getModList } from '~/services/hasura.server'

const PAGE_SIZE = 30

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
  const { mods, total } = useLoaderData<typeof loader>()
  const [params] = useSearchParams()
  const page = Number(params.get('offset') ?? '0') / PAGE_SIZE + 1
  const pagination = usePagination(total, { page, size: PAGE_SIZE })

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
        <div className="flex items-center justify-end">
          <Pagination button={ParamsLink} showing={false} {...pagination} />
        </div>
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-50 sm:pl-6"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Rarity
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Equipped
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Inventory
                    </th>
                    <th
                      scope="col"
                      className="py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Top Loadout
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-700">
                  {mods.map((mod, index) => {
                    const {
                      category,
                      equipped,
                      id,
                      inventory,
                      image,
                      name,
                      rarity,
                      type,
                    } = mod
                    const {
                      inventory: [{ color }],
                    } = normalize.mods({
                      mods: [{ mod, slot: null }],
                    })
                    const loadout = [
                      ...mod.slot_0_loadouts,
                      ...mod.slot_1_loadouts,
                      ...mod.slot_2_loadouts,
                      ...mod.slot_3_loadouts,
                    ].reduce<(typeof mod)['slot_0_loadouts'][number] | null>(
                      (acc, loadout) => {
                        if (!acc) {
                          return loadout
                        }

                        return Number(loadout.wl_ratio.slice(0, -1)) >
                          Number(acc.wl_ratio.slice(0, -1))
                          ? loadout
                          : acc
                      },
                      null,
                    )

                    return (
                      <tr
                        key={id}
                        className={
                          index % 2 ? undefined : 'bg-gray-50 dark:bg-gray-800'
                        }
                      >
                        <td className="whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          <div className="py-4 pl-4 pr-3 sm:pl-6">
                            <div className="flex items-center">
                              <div className="mr-4 h-10 w-10 flex-shrink-0 select-none">
                                <img
                                  alt=""
                                  className="h-10 w-10 rounded p-1"
                                  style={{
                                    background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                                  }}
                                  src={image}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <div className="font-medium">{name}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-sm text-gray-900 dark:text-gray-200">
                          {rarity}
                        </td>
                        <td className="text-sm text-gray-900 dark:text-gray-200">
                          {category}
                        </td>
                        <td className="text-sm text-gray-900 dark:text-gray-200">
                          {type}
                        </td>
                        <td className="text-sm text-gray-500 dark:text-gray-400">
                          {equipped.aggregate.count.toLocaleString()}
                        </td>
                        <td className="text-sm text-gray-500 dark:text-gray-400">
                          {inventory.aggregate.count.toLocaleString()}
                        </td>
                        <td className="text-sm">
                          {loadout ? (
                            <div>
                              <Mods
                                items={
                                  normalize.mods({
                                    mods: Object.entries(loadout)
                                      .filter(([key]) =>
                                        key.startsWith('slot_'),
                                      )
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
                                title={`W/L Ratio: ${loadout.wl_ratio}`}
                              />
                            </div>
                          ) : (
                            'Unused'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Pagination button={ParamsLink} {...pagination} />
      </div>
    </div>
  )
}

function ParamsLink({
  children,
  offset = 0,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode
  offset?: number
}) {
  const [params] = useSearchParams()
  const where = params.get('where') ?? ''
  const search = queryString.stringify(
    { offset: offset ? offset : undefined, where },
    { skipEmptyString: true },
  )

  return (
    <Link preventScrollReset to={{ search }} {...props}>
      {children}
    </Link>
  )
}
