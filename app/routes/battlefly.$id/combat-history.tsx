import type { SerializeFrom } from '@remix-run/node'
import {
  Await,
  useLoaderData,
  useParams,
  useSearchParams,
} from '@remix-run/react'
import { Suspense } from 'react'

import { Icon } from '~/components/icon'
import { Pagination } from '~/components/pagination'
import { ScrollArea } from '~/components/scroll-area'
import { Tooltip } from '~/components/tooltip'
import { Badge } from '~/components/ui/badge'
import { Skeleton } from '~/components/ui/skeleton'
import { UnderlineLink } from '~/components/underline-link'
import { usePagination } from '~/hooks/use-pagination'
import { cn } from '~/lib/helpers'
import * as normalize from '~/lib/normalize'
import { ModPreview } from '~/routes/resources.mod.$id/route'

import { PAGE_SIZE_10 } from './constants'
import { ParamsLink } from './params-link'
import type { loader } from './server'

const OFFSET_PARAM = 'combat_offset'

export function CombatHistory() {
  const { combat, totals } = useLoaderData<typeof loader>()
  const [params] = useSearchParams()
  const id = useIdParam()

  const page = Number(params.get(OFFSET_PARAM) ?? '0') / PAGE_SIZE_10 + 1
  const pagination = usePagination(totals.combat, { page, size: PAGE_SIZE_10 })

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
          <Suspense
            fallback={Array(10)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="px-6 py-4">
                  <Skeleton className="h-4 w-full py-6" />
                </div>
              ))}
          >
            <Await resolve={combat}>
              {(combat) =>
                combat.battlefly_combat.map((item, index) => {
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
                    <div
                      key={item.id}
                      className={cn(
                        'grid grid-cols-1 items-center gap-8 px-6 py-4 lg:grid-cols-2',
                        index % 2 ? undefined : 'bg-muted dark:bg-gray-700',
                      )}
                    >
                      <div className="flex flex-1 flex-col items-center gap-2 sm:flex-row sm:gap-8">
                        <YouCell loser={loser} winner={winner} />
                        <span className="mt-2 font-bold tracking-widest">
                          VS
                        </span>
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
                        <a
                          className="ml-3 inline-flex items-center gap-1 text-pink-600 underline"
                          href={`https://play.battlefly.game/battleflies/view/${id}/battlelog/${item.id}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View
                          <Icon name="external-link" />
                        </a>
                      </div>
                    </div>
                  )
                })
              }
            </Await>
          </Suspense>
          <div className="px-2">
            <Pagination button={CombatHistoryPagination} {...pagination} />
          </div>
        </div>
      </div>
    </section>
  )
}

function CombatHistoryPagination(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: React.ReactNode
    offset?: number
  },
) {
  return <ParamsLink {...props} param={OFFSET_PARAM} />
}

type Data = Awaited<
  SerializeFrom<typeof loader>['combat']
>['battlefly_combat'][number]

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
            <ModPreview key={index} id={mod.id}>
              <img
                alt={mod.name}
                className="w-8 rounded"
                src={mod.image}
                style={{
                  background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                }}
              />
            </ModPreview>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
