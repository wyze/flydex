import type { ActionArgs, LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import {
  Form,
  Link,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from '@remix-run/react'
import { motion } from 'framer-motion'
import queryString from 'query-string'
import { z } from 'zod'
import { zx } from 'zodix'

import Mods from '~/components/Mods'
import Pagination from '~/components/Pagination'
import Pill from '~/components/Pill'
import Tooltip from '~/components/Tooltip'
import usePagination from '~/hooks/usePagination'
import { FLY_RARITY_COLORS } from '~/lib/consts'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getFlydex, getTreasureTag } from '~/services/hasura.server'

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
        })
      )
    )
  }

  if (parsed.data.query.type === 'tokenid') {
    return redirect(`/battlefly/${parsed.data.query.value}`)
  }

  return redirect(
    '/?'.concat(
      queryString.stringify({
        where: JSON.stringify(parsed.data.query.value),
      })
    )
  )
}

export async function loader({ request }: LoaderArgs) {
  const params = zx.parseQuery(request, {
    limit: z
      .number()
      .refine((value) => value <= 30)
      .default(30),
    offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 30100),
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
          data.token = { staked: { _eq: true } }
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
    })
  )
}

export default function Index() {
  const { flies, total } = useLoaderData<typeof loader>()
  const [params] = useSearchParams()
  const page = Number(params.get('offset') ?? '0') / 30 + 1
  const pagination = usePagination(total, { page, size: 30 })

  return (
    <div className="flex-1 p-12">
      <Pagination {...pagination} showing={false} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flies.map((fly) => {
          const bodyColor = fly.body_color
          const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
          const { equipped, inventory } = normalize.mods(fly)

          return (
            <div
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-md shadow-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:shadow-gray-700"
              key={fly.token_id}
            >
              <Link prefetch="intent" to={`battlefly/${fly.token_id}`}>
                <motion.div
                  className="rounded-full p-3 shadow shadow-gray-300 dark:shadow-gray-500"
                  style={{
                    background: `linear-gradient(to bottom right, ${startColor}, ${bodyColor})`,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <img
                    alt={fly.name}
                    className="pointer-events-none h-12 w-12 select-none lg:h-24 lg:w-24"
                    src={fly.image}
                  />
                </motion.div>
              </Link>
              <div className="relative flex h-full flex-1 flex-col pl-4">
                <div className="flex items-center justify-between">
                  <Link prefetch="intent" to={`battlefly/${fly.token_id}`}>
                    <motion.div
                      className="text-lg font-medium dark:text-gray-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {fly.name}
                    </motion.div>
                  </Link>
                  <div className="text-sm font-light text-gray-500 dark:text-gray-400">
                    #{fly.token_id}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Tooltip>
                    <Tooltip.Trigger>
                      <div className="relative w-10">
                        {Array(fly.league_tier)
                          .fill('')
                          .map((_, index) => (
                            <img
                              alt={fly.league}
                              key={index}
                              className="filter-outline pointer-events-none absolute inset-0 h-6 w-6 select-none shadow-white dark:shadow-gray-700"
                              src={`/images/${fly.league.toLowerCase()}.svg`}
                              style={{ left: index * 16 }}
                            />
                          ))}
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                      {fly.league} {Array(fly.league_tier).fill('I').join('')}
                    </Tooltip.Content>
                  </Tooltip>
                  <div className="text-sm">
                    <div
                      className={
                        fly.rank > 0
                          ? 'text-pink-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }
                    >
                      {fly.rank > 0 ? `Rank: ${fly.rank}` : 'Unranked'}
                    </div>
                    <div className="text-right text-gray-400 dark:text-gray-500">
                      {fly.contest_points.toLocaleString()} CP
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="flex flex-col gap-1 lg:flex-row">
                    <div className="rounded-md border border-gray-400 px-1 text-xs text-gray-400">
                      {fly.edition}
                    </div>
                    <div
                      className={`${
                        ['Artefact', 'Epic'].includes(fly.rarity)
                          ? 'text-gray-100'
                          : 'text-gray-800'
                      } rounded-md border px-1 text-xs dark:border-gray-900`}
                      style={{
                        background: `rgb(${FLY_RARITY_COLORS[fly.rarity]})`,
                      }}
                    >
                      {fly.rarity}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-end gap-2">
                  <Mods items={equipped} title="Mods" />
                  <Mods items={inventory} title="Inventory" />
                </div>
                {fly.win_loss?.wl_ratio_24h ? (
                  <div className="flex flex-1 items-end">
                    <span className="mt-2.5 text-xs font-light text-slate-500">
                      24h W/L: {fly.win_loss.wl_ratio_24h}
                    </span>
                  </div>
                ) : null}
                <div className="absolute bottom-0 right-0">
                  <Pill>{fly.location}</Pill>
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
