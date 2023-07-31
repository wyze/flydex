import { type ActionArgs, type LoaderArgs, redirect } from '@remix-run/node'
import {
  Form,
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useNavigate,
  useRouteError,
  useSearchParams,
} from '@remix-run/react'
import { motion } from 'framer-motion'
import { TrophyIcon, X } from 'lucide-react'
import queryString from 'query-string'
import { useState } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { DataTableFacetedFilter, MobileFilters } from '~/components/DataTable'
import Pagination from '~/components/Pagination'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import usePagination from '~/hooks/usePagination'
import { FLY_RARITY_COLORS } from '~/lib/consts'
import { json } from '~/lib/responses.server'
import { getFlydex, getTreasureTag } from '~/services/hasura.server'

const PAGE_SIZE = 30

export async function action({ request }: ActionArgs) {
  const parsed = await zx.parseFormSafe(request, {
    query: z.union([
      z
        .string()
        .regex(/^\d{1,5}$/)
        .transform((value) => ({
          type: 'tokenid' as const,
          value,
        })), // Token Id
      z
        .string()
        .regex(/^\w+#\d{4}$/)
        .transform((value) => ({ type: 'treasure-tag' as const, value })), // Treasure Tag
      z
        .string()
        .regex(/^0x\w{40}$/)
        .transform((value) => ({
          type: 'wallet' as const,
          value: { token: { owner: { _eq: value.toLowerCase() } } },
        })), // Wallet
    ]),
  })

  if (!parsed.success) {
    throw new Response('Invalid search term', { status: 400 })
  }

  if (parsed.data.query.type === 'treasure-tag') {
    const owner = await getTreasureTag(parsed.data.query.value)

    if (!owner) {
      throw new Response('Treasure tag owner not found', { status: 404 })
    }

    return redirect(
      '/?'.concat(
        queryString.stringify({
          where: JSON.stringify({ token: { owner: { _eq: owner } } }),
        }),
      ),
    )
  }

  if (parsed.data.query.type === 'tokenid') {
    return redirect(`/battlefly/${parsed.data.query.value}`)
  }

  return redirect(
    '/?'.concat(
      queryString.stringify({
        where: JSON.stringify(parsed.data.query.value),
      }),
    ),
  )
}

export async function loader({ request }: LoaderArgs) {
  const params = zx.parseQuery(request, {
    limit: z
      .number()
      .refine((value) => value <= PAGE_SIZE)
      .default(PAGE_SIZE),
    offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 40000),
    order_by: z
      .string()
      .default(JSON.stringify({ token_id: 'asc' }))
      .transform((value) => JSON.parse(value)),
    where: z
      .string()
      .default('{}')
      .transform((value) => {
        const data = JSON.parse(value)

        if ('location' in data) {
          data.token = { ...data.token, staked: { _eq: true } }
        }

        return data
      }),
  })

  return json(`flies:${JSON.stringify(params)}`, () =>
    getFlydex(params).then((data) => {
      if (data.total === 0) {
        throw new Response('No battleflies found', { status: 404 })
      }

      return data
    }),
  )
}

export default function Index() {
  const { filters, flies, total } = useLoaderData<typeof loader>()
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const page = Number(params.get('offset') ?? '0') / PAGE_SIZE + 1
  const pagination = usePagination(total, { page, size: PAGE_SIZE })

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

  const filterableColumns = [
    {
      id: 'league_full',
      options: filters.leagues.map(({ league_full }) => ({
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
          .map(([first, ...rest]) => first.toUpperCase().concat(...rest))
          .join(' '),
        value: location,
      })),
      title: 'Location',
    },
    {
      id: 'rarity',
      options: filters.rarities.map(({ rarity }) => ({
        label: rarity,
        value: rarity,
      })),
      title: 'Rarity',
    },
  ]

  return (
    <div className="flex-1 space-y-5 p-4 md:p-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center">
          <div className="hidden space-x-2 md:block">
            {filterableColumns.map(({ id, ...props }) => (
              <DataTableFacetedFilter
                key={id}
                // @ts-ignore
                column={{
                  id,
                  getFilterValue() {
                    return (
                      columnFilters.find((filter) => filter.id === id)?.value ??
                      []
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
                      columnFilters.find((filter) => filter.id === id)?.value ??
                      []
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
          {Object.keys(columnFilters).length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setColumnFilters([])

                navigate({ pathname: '/', search: '' })
              }}
              className="ml-2 h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2" size={16} strokeWidth={1.5} />
            </Button>
          ) : null}
        </div>
        <div className="hidden lg:flex">
          <Pagination button={ParamsLink} showing={false} {...pagination} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flies.map((fly) => {
          return (
            <div
              className="relative flex rounded-lg p-2 shadow-md shadow-gray-400 dark:shadow-gray-700"
              key={fly.token_id}
              style={{
                background: `linear-gradient(to right, rgb(${
                  FLY_RARITY_COLORS[fly.rarity]
                }), transparent)`,
              }}
            >
              <div className="absolute -ml-2 w-44 flex-1 overflow-x-clip">
                <Link
                  className="flex-1"
                  prefetch="intent"
                  to={`battlefly/${fly.token_id}`}
                >
                  <motion.div
                    className="bg-red-3_00 -mt-6 h-28 w-44 select-none bg-no-repeat"
                    style={{
                      backgroundImage: `url(${fly.image})`,
                      backgroundSize: '200px 200px',
                      backgroundPosition: '-40px -40px',
                    }}
                    whileHover={{ scale: 1.1 }}
                  />
                </Link>
              </div>
              <div className="flex flex-1 flex-col items-end">
                <div className="mt-1 flex items-center gap-1 text-sm">
                  <TrophyIcon size={16} />
                  {String(fly.rank).replace(/^0$/, '-')}
                </div>
                <Link prefetch="intent" to={`battlefly/${fly.token_id}`}>
                  <motion.div
                    className="flex items-center gap-1 text-lg font-medium dark:text-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {fly.name}
                    <span className="text-sm text-muted-foreground">
                      #{fly.token_id}
                    </span>
                  </motion.div>
                </Link>
                <div className="flex gap-6 pt-1">
                  {fly.win_loss ? (
                    <div className="flex flex-col">
                      <p className="text-sm font-light">24h W/L</p>
                      <p className="font-semibold">
                        {fly.win_loss.wl_ratio_24h}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex flex-col">
                    <p className="text-sm font-light">CP</p>
                    <p className="font-semibold">
                      {fly.contest_points.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-light">Lv.</p>
                    <p className="font-semibold">{fly.level}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-light">XP</p>
                    <p className="font-semibold">{fly.xp}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  {[
                    {
                      children: fly.soulbound ? 'Soulbound' : null,
                    },
                    {
                      children: fly.location,
                      filter: 'location',
                      value: [fly.location.toLowerCase().replace(' ', '_')],
                    },
                    {
                      children: fly.rarity,
                      filter: 'rarity',
                      value: [fly.rarity],
                    },
                    {
                      children: fly.league,
                      filter: 'league_full',
                      value: [1, 2, 3].map((tier) => `${fly.league} ${tier}`),
                    },
                  ]
                    .filter((item) => Boolean(item.children))
                    .map((item) => {
                      if (!item.filter) {
                        return (
                          <Badge
                            key={item.children}
                            className="text-[0.625rem]"
                          >
                            {item.children}
                          </Badge>
                        )
                      }

                      const parsed = queryString.parse(location.search)
                      const where = JSON.parse(
                        typeof parsed?.where === 'string' ? parsed.where : '{}',
                      ) as Record<string, { _in: string[] }>
                      const search = queryString.stringify(
                        {
                          where: JSON.stringify({
                            ...where,
                            [item.filter]: {
                              _in: [
                                ...(where[item.filter]?._in ?? []),
                                ...item.value,
                              ].filter(
                                (value, index, all) =>
                                  all.indexOf(value) === index,
                              ),
                            },
                          }).replace('{}', ''),
                        },
                        { skipEmptyString: true },
                      )

                      return (
                        <Link
                          key={item.filter}
                          onClick={() => {
                            setColumnFilters((state) =>
                              state
                                .map((existing) =>
                                  existing.id === item.filter
                                    ? {
                                        id: existing.id,
                                        value: existing.value
                                          ?.concat(item.value)
                                          .filter(
                                            (value, index, all) =>
                                              all.indexOf(value) === index,
                                          ),
                                      }
                                    : existing,
                                )
                                .concat({
                                  id: item.filter,
                                  value: item.value,
                                })
                                .filter(
                                  (filter, index, filters) =>
                                    filters.findIndex(
                                      ({ id }) => id === filter.id,
                                    ) === index,
                                ),
                            )
                          }}
                          to={{ pathname: '/', search }}
                        >
                          <Badge className="text-[0.625rem]">
                            {item.children}
                          </Badge>
                        </Link>
                      )
                    })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Pagination {...pagination} />
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.data
    : error instanceof Error
    ? error.message
    : 'Unknown Error'

  return (
    <div className="mx-auto w-1/3 flex-1 pt-24">
      <h2 className="text-xl font-semibold text-red-500">{message}</h2>
      <div className="mt-2 text-sm text-gray-500">
        Try one of the following searches.
      </div>
      <ul className="mt-6 dark:text-gray-200">
        {[
          ['Token ID', '12345'],
          ['Treasure Tag', 'wyze#0000'],
          ['Wallet', '0x032F84aEfF59ddEBC55797F321624826d873bF65'],
        ].map(([label, value]) => (
          <li key={label}>
            <Form method="post">
              {label}: <input type="hidden" name="query" value={value} />
              <button
                type="submit"
                className="text-pink-500 transition duration-200 hover:text-pink-400"
              >
                {value}
              </button>
            </Form>
          </li>
        ))}
      </ul>
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
