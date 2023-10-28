import {
  Form,
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useRouteError,
  useSearchParams,
} from '@remix-run/react'
import { motion } from 'framer-motion'
import queryString from 'query-string'

import { Icon } from '~/components/icon'
import { Pagination } from '~/components/pagination'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { UnderlineLink } from '~/components/underline-link'
import { usePagination } from '~/hooks/use-pagination'
import { FLY_RARITY_COLORS, PAGE_SIZE } from '~/lib/constants'

import { action, loader } from './server'
import { SortDropdown } from './sort-dropdown'
import { TableFilters } from './table-filters'

export { action, loader }

export default function Index() {
  const { flies, total, trending } = useLoaderData<typeof loader>()
  const [params] = useSearchParams()
  const location = useLocation()
  const page = Number(params.get('offset') ?? '0') / PAGE_SIZE + 1
  const pagination = usePagination(total, { page, size: PAGE_SIZE })

  return (
    <div className="flex-1 space-y-5 p-4 md:p-12">
      <div>
        <h3 className="flex items-center gap-4 text-lg font-semibold">
          Top Trending
          <Link
            className="inline-flex items-center gap-1 text-sm text-pink-600 hover:underline dark:text-pink-300"
            to="/trending"
            prefetch="intent"
          >
            View All
            <Icon name="move-right" />
          </Link>
        </h3>
        <p className="pb-2 text-xs text-muted-foreground">
          Based on win/loss ratio.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map(
            ({ change, flydex: { name, token_id }, league_full, wl_ratio }) => (
              <Card key={token_id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <UnderlineLink href={`/battlefly/${token_id}`}>
                      {name}
                    </UnderlineLink>
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {league_full}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{wl_ratio}</div>
                  <p className="text-xs text-muted-foreground">
                    {change} from last 24 hours
                  </p>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center">
          <TableFilters />
          <SortDropdown />
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
                  <Icon name="trophy" />
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
                  {fly.wl_ratio_24h ? (
                    <div className="flex flex-col">
                      <p className="text-sm font-light">24h W/L</p>
                      <p className="font-semibold">{fly.wl_ratio_24h}</p>
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
                          <div key={item.children}>
                            <Badge className="text-[0.625rem]">
                              {item.children}
                            </Badge>
                          </div>
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
                        <Link key={item.filter} to={{ pathname: '/', search }}>
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
