import type { DataFunctionArgs, SerializeFrom } from '@remix-run/node'
import { Link, useFetcher, useParams, useSearchParams } from '@remix-run/react'
import queryString from 'query-string'
import { Fragment, useEffect } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { Icon } from '~/components/icon'
import { Pagination } from '~/components/pagination'
import { Popover } from '~/components/popover'
import { ScrollArea } from '~/components/scroll-area'
import { Tooltip } from '~/components/tooltip'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { UnderlineLink } from '~/components/underline-link'
import { usePagination } from '~/hooks/use-pagination'
import { cn } from '~/lib/helpers'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getCombatHistory } from '~/services/hasura.server'

const PAGE_SIZE = 10

export function loader({ request }: DataFunctionArgs) {
  const { combat_offset, ...rest } = zx.parseQuery(request, {
    id: z.string().transform(Number),
    limit: z
      .number()
      .refine((value) => value <= PAGE_SIZE)
      .default(PAGE_SIZE),
    combat_offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 30000),
  })
  const params = { ...rest, offset: combat_offset }

  return json(`combat:${JSON.stringify(params)}`, () =>
    getCombatHistory(params),
  )
}

export function CombatHistory() {
  const fetcher = useFetcher<typeof loader>()
  const [params] = useSearchParams()
  const offset = params.get('combat_offset')
  const id = useIdParam()
  const { load } = fetcher

  const page = Number(params.get('combat_offset') ?? '0') / PAGE_SIZE + 1
  const pagination = usePagination(fetcher.data?.total ?? 0, {
    page,
    size: PAGE_SIZE,
  })

  useEffect(() => {
    const search = queryString.stringify(
      { combat_offset: offset ?? '', id },
      { skipEmptyString: true },
    )

    load(`/resources/combat-history?${search}`)
  }, [id, load, offset])

  if (!fetcher.data || fetcher.data.total === 0) {
    return null
  }

  const { combat } = fetcher.data

  return (
    <section className="md:col-span-2" aria-labelledby="combat-history">
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2
            id="combat-history"
            className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200"
          >
            Combat History
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Check out the most recent combat history.
          </p>
        </div>
        <div className="py-2">
          {fetcher.state === 'loading'
            ? combat.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <Skeleton className="h-4 w-full py-6" />
                </div>
              ))
            : combat.map((item, index) => {
                const loser = {
                  ...item.loser,
                  mods: [
                    { mod: item.loser_slot_0_mod, slot: 0 },
                    { mod: item.loser_slot_1_mod, slot: 1 },
                    { mod: item.loser_slot_2_mod, slot: 2 },
                    { mod: item.loser_slot_3_mod, slot: 3 },
                  ],
                }
                const winner = {
                  ...item.winner,
                  mods: [
                    { mod: item.winner_slot_0_mod, slot: 0 },
                    { mod: item.winner_slot_1_mod, slot: 1 },
                    { mod: item.winner_slot_2_mod, slot: 2 },
                    { mod: item.winner_slot_3_mod, slot: 3 },
                  ],
                }

                return (
                  <a
                    key={item.id}
                    className={cn(
                      'grid grid-cols-1 items-center gap-10 px-6 py-4 transition-opacity duration-300 hover:opacity-70 lg:grid-cols-2',
                      index % 2 ? undefined : 'bg-muted dark:bg-gray-700',
                    )}
                    href={`https://play.battlefly.game/battleflies/view/${id}/battlelog/${item.id}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <div className="flex flex-1 flex-col items-center gap-2 sm:flex-row sm:gap-10">
                      <YouCell loser={loser} winner={winner} />
                      <span className="mt-2 font-bold tracking-widest">VS</span>
                      <ThemCell loser={loser} winner={winner} />
                    </div>
                    <div className="text-center text-muted-foreground sm:text-left">
                      The battle occurred in the{' '}
                      <span className="font-medium text-primary">
                        {item.location
                          .at(0)
                          ?.toUpperCase()
                          .concat(item.location.slice(1))}
                      </span>{' '}
                      {item.created_at}.
                    </div>
                  </a>
                )
              })}
          <div className="px-2">
            <Pagination button={ParamsLink} {...pagination} />
          </div>
        </div>
      </div>
    </section>
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
  const search = queryString.stringify(
    Array.from(params.entries()).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (key !== 'combat_offset') {
          acc[key] = value
        }

        return acc
      },
      { combat_offset: offset ? offset : undefined },
    ),
    { skipEmptyString: true },
  )

  return (
    <Link preventScrollReset to={{ search }} {...props}>
      {children}
    </Link>
  )
}

type Data = SerializeFrom<typeof loader>['combat'][number]

function useIdParam() {
  const { id } = useParams()

  return Number(id)
}

function ThemCell({
  loser,
  winner,
}: {
  loser: Data['loser']
  winner: Data['loser']
}) {
  const id = useIdParam()

  return (
    <BattleflyCell
      battlefly={id === loser.token_id ? winner : loser}
      link
      winner={id === loser.token_id}
    />
  )
}

function YouCell({
  loser,
  winner,
}: {
  loser: Data['loser']
  winner: Data['loser']
}) {
  const id = useIdParam()

  return (
    <BattleflyCell
      battlefly={id === loser.token_id ? loser : winner}
      winner={id === winner.token_id}
    />
  )
}

function BattleflyCell({
  battlefly,
  link = false,
  winner,
}: {
  battlefly: Data['loser']
  link?: boolean
  winner: boolean
}) {
  return (
    <div>
      <div className="flex w-full flex-1 items-center gap-2">
        {link ? (
          <>
            <UnderlineLink href={`/battlefly/${battlefly.token_id}`}>
              {battlefly.name}
            </UnderlineLink>
            <Badge variant="default">{battlefly.token_id}</Badge>
          </>
        ) : (
          battlefly.name
        )}
        {winner ? (
          <Tooltip>
            <Tooltip.Trigger>
              <Icon className="text-yellow-600" name="trophy" />
            </Tooltip.Trigger>
            <Tooltip.Content>Winner</Tooltip.Content>
          </Tooltip>
        ) : null}
      </div>
      <ScrollArea className="w-40 pb-0" orientation="horizontal">
        <div className="flex max-w-max gap-2 pt-2">
          {normalize.mods(battlefly).equipped.map(({ color, mod }, index) => (
            <Fragment key={index}>
              <Tooltip>
                <Tooltip.Trigger className="hidden md:block">
                  <img
                    alt={mod.name}
                    className="w-8 rounded"
                    src={mod.image}
                    style={{
                      background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                    }}
                  />
                </Tooltip.Trigger>
                <Tooltip.Content>{mod.name}</Tooltip.Content>
              </Tooltip>
              <Popover>
                <Popover.Trigger className="md:hidden">
                  <img
                    alt={mod.name}
                    className="w-8 rounded"
                    src={mod.image}
                    style={{
                      background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                    }}
                  />
                </Popover.Trigger>
                <Popover.Content>{mod.name}</Popover.Content>
              </Popover>
            </Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
