import { type SerializeFrom } from '@remix-run/node'
import {
  useLoaderData,
  useRevalidator,
  useSearchParams,
} from '@remix-run/react'
import { differenceInSeconds } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useDebouncedCallback } from 'use-debounce'

import { Icon } from '~/components/icon'
import { LeaderboardRow } from '~/components/leaderboard'
import { MobileTooltip } from '~/components/mobile-tooltip'
import { Pagination } from '~/components/pagination'
import { ScrollArea } from '~/components/scroll-area'
import { Tooltip } from '~/components/tooltip'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { useToast } from '~/components/ui/use-toast'
import { UnderlineLink } from '~/components/underline-link'
import { useDocumentVisibility } from '~/hooks/use-document-visibility'
import { usePagination } from '~/hooks/use-pagination'
import { INVITATIONAL_FLY_IDS } from '~/lib/constants'
import { cn } from '~/lib/helpers'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import type { ModWithColor } from '~/lib/types'
import {
  getInvitational,
  getInvitationalBattles,
  getInvitationalLeaderboard,
} from '~/services/hasura.server'

export async function loader() {
  const initialTimer = differenceInSeconds(
    new Date('2023-09-20 00:00:00'),
    new Date(),
  )
  const initialPodiumTimer = differenceInSeconds(
    new Date('2023-09-23 00:00:00'),
    new Date(),
  )

  return json('invitational', () =>
    Promise.all([
      getInvitationalBattles(),
      getInvitationalLeaderboard(),
      getInvitational(),
    ]).then(([battles, leaderboard, players]) => ({
      battles,
      ...leaderboard,
      initialLastCombatId: `${battles.at(0)?.id}`,
      initialPodiumTimer,
      initialTimer,
      players,
    })),
  )
}

type EventSourceOptions = {
  init?: EventSourceInit
  event?: string
}

/**
 * Subscribe to an event source and return the latest event.
 * @param url The URL of the event source to connect to
 * @param options The options to pass to the EventSource constructor
 * @returns The last event received from the server
 */
export function useEventSource(
  url: string | URL,
  { event = 'message', init }: EventSourceOptions = {},
) {
  const [data, setData] = useState<string | null>(null)

  useEffect(() => {
    const eventSource = new EventSource(url, init)

    eventSource.addEventListener(event ?? 'message', handler)

    // rest data if dependencies change
    setData(null)

    function handler(event: MessageEvent) {
      setData(event.data || 'UNKNOWN_EVENT_DATA')
    }

    return () => {
      eventSource.removeEventListener(event ?? 'message', handler)
      eventSource.close()
    }
  }, [url, event, init])

  return data
}

export default function Invitational() {
  const {
    battles,
    initialLastCombatId,
    initialPodiumTimer,
    initialTimer,
    leaderboard,
    players,
    total,
  } = useLoaderData<typeof loader>()
  const [timer, setTimer] = useState(initialTimer)
  const [podiumTimer, setPodiumTimer] = useState(initialPodiumTimer)
  const [battleTimer, setBattleTimer] = useState(1140)
  const { revalidate } = useRevalidator()
  const { toast } = useToast()

  const [params, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') ?? 'leaderboard')
  const setParams = useDebouncedCallback(setSearchParams, 500)

  const pagination = usePagination(total, {
    page: 1,
    size: 20,
  })

  const visibility = useDocumentVisibility()
  const lastCombatId = useEventSource('/sse/invitational', { event: 'combat' })

  useEffect(() => {
    if (initialLastCombatId !== lastCombatId) {
      toast({
        title: 'New battles detected',
        description: 'Refreshing content to pull latest battles',
      })

      revalidate()
    }
  }, [initialLastCombatId, lastCombatId, revalidate, toast])

  useEffect(() => {
    if (visibility === 'visible') {
      revalidate()
    }
  }, [revalidate, visibility])

  useEffect(() => {
    if (params.get('tab') !== tab) {
      setParams({ tab })
    }
  }, [params, setParams, tab])

  useEffect(() => {
    if (initialTimer > 0) {
      const interval = setInterval(() => {
        setTimer((state) => {
          if (state < 0) {
            clearInterval(interval)

            revalidate()
          }

          return state - 1
        })
      }, 1000)

      return function cleanup() {
        clearInterval(interval)
      }
    }
  }, [initialTimer, revalidate])

  useEffect(() => {
    if (initialPodiumTimer > 0) {
      const interval = setInterval(() => {
        setPodiumTimer((state) => {
          if (state < 0) {
            clearInterval(interval)

            setTab('podium')
          }

          return state - 1
        })
      }, 1000)

      return function cleanup() {
        clearInterval(interval)
      }
    }
  }, [initialPodiumTimer])

  useEffect(() => {
    if (battles.length === 0) {
      const interval = setInterval(() => {
        setBattleTimer((state) => {
          if (state < 0) {
            clearInterval(interval)

            revalidate()
          }

          return state - 1
        })
      }, 1000)

      return function cleanup() {
        clearInterval(interval)
      }
    }
  }, [battles.length, revalidate])

  if (timer > 0) {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="mx-auto py-10 text-4xl">
          Countdown to the Invitational
        </h1>
        <div className="relative mt-6 flex h-32 justify-center text-pink-600">
          <Panel timer={timer} />
        </div>
        <h2 className="mx-auto mt-10 py-5 text-2xl">Meet the players</h2>
        <div className="mb-12 grid max-w-max gap-4 px-8 lg:grid-cols-2 lg:px-24">
          {players.map(({ flydex, name, username, wallet, ...mods }) => {
            const bodyColor = flydex.body_color
            const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
            const { equipped } = normalize.mods(flydex)

            return (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="mx-4 h-10 w-10 flex-shrink-0 select-none">
                      <img
                        alt=""
                        className="h-10 w-10 rounded-full p-1"
                        style={{
                          background: `linear-gradient(to bottom, ${bodyColor}, ${startColor})`,
                        }}
                        src={flydex.image}
                      />
                    </div>
                    {name}
                    <div className="ml-auto flex items-center gap-2 px-4 text-base">
                      <div className="text-pink-500">{username}</div>
                      <Button asChild size="xs">
                        <a
                          className="w-7"
                          href={`https://twitter.com/${username}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          𝕏
                        </a>
                      </Button>
                      <Button asChild size="xs">
                        <a
                          href={`https://friend.tech/rooms/${wallet}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <img
                            alt="friend.tech logo"
                            className="w-3 dark:invert"
                            src="/images/friendtech.png"
                          />
                        </a>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Mods items={equipped} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            <span className="text-orange-500">BattleFly</span> ×{' '}
            <span className="text-blue-500">friend.tech</span> Invitational
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Information about the current Invitational.
          </p>
        </div>
      </div>
      <Tabs className="mb-8" onValueChange={setTab} value={tab}>
        <TabsList className="my-5">
          {podiumTimer > 0 ? null : (
            <TabsTrigger value="podium">Podium</TabsTrigger>
          )}
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="battles">Battles</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>
        <TabsContent value="podium">
          <div className="flex h-80 items-end justify-center gap-4">
            {[
              {
                container: { duration: 1 },
                fly: leaderboard[2],
                height: '30%',
                stand: { delay: 1.2 },
              },
              {
                container: { delay: 5.2 },
                fly: leaderboard[0],
                height: '90%',
                stand: { delay: 6.7 },
              },
              {
                container: { delay: 2.5 },
                fly: leaderboard[1],
                height: '60%',
                stand: { delay: 3.7 },
              },
            ].map(({ container, fly, height, stand }) => {
              const bodyColor = fly.flydex.body_color
              const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'

              return (
                <motion.div
                  key={fly.rank}
                  className="flex w-32 flex-col gap-1 text-center"
                  animate={{ height, opacity: 1 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ ...container, duration: 1 }}
                >
                  <motion.div
                    className="flex flex-col items-center"
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.3, ...stand }}
                  >
                    <div className="mx-4 h-10 w-10 flex-shrink-0 select-none">
                      <img
                        alt=""
                        className="h-10 w-10 rounded-full p-1"
                        style={{
                          background: `linear-gradient(to bottom, ${bodyColor}, ${startColor})`,
                        }}
                        src={fly.flydex.image}
                      />
                    </div>
                    <motion.span
                      animate={{ opacity: 1 }}
                      initial={{ opacity: 0 }}
                      transition={{ delay: stand.delay + 0.5, duration: 0.25 }}
                    >
                      {fly.rank === 1 ? <Celebrate /> : null}
                      {fly.invite.username}
                    </motion.span>
                  </motion.div>
                  <div className="mx-auto w-20 flex-1 rounded-t bg-gradient-to-br from-orange-500 to-blue-500" />
                </motion.div>
              )
            })}
          </div>
        </TabsContent>
        <TabsContent value="leaderboard">
          <div className="flex flex-col space-y-4">
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
                          BattleFly
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                        >
                          Owner
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                        >
                          Socials
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                        >
                          League
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
                          Battles
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-900">
                      {leaderboard.map((props, index) => (
                        <LeaderboardRow
                          key={props.rank}
                          {...{
                            ...props,
                            flydex: {
                              ...props.flydex,
                              name: '',
                              token: { owner: '', treasure_tag: null },
                            },
                            index,
                            showRewards: false,
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <Pagination {...pagination} />
          </div>
        </TabsContent>
        <TabsContent value="battles">
          <div className="py-2">
            {battles.length === 0 ? (
              <div className="space-y-5">
                <h2 className="text-center text-2xl">Estimated first battle</h2>
                <div className="relative mt-6 flex h-32 justify-center text-pink-600">
                  <Panel timer={battleTimer} />
                </div>
              </div>
            ) : null}
            {battles.map((item, index) => {
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
              const id =
                INVITATIONAL_FLY_IDS.find((id) =>
                  [item.winner.token_id, item.loser.token_id].includes(id),
                ) ?? 0

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
                    <YouCell {...{ id, loser, winner }} />
                    <span className="mt-2 font-bold tracking-widest">VS</span>
                    <ThemCell {...{ id, loser, winner }} />
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
          </div>
        </TabsContent>
        <TabsContent value="players">
          <div className="grid max-w-max gap-4 px-8 lg:grid-cols-2 lg:px-24">
            {players.map(({ flydex, name, username, wallet, ...mods }) => {
              const bodyColor = flydex.body_color
              const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
              const { equipped } = normalize.mods(flydex)

              return (
                <Card key={name}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <div className="mx-4 h-10 w-10 flex-shrink-0 select-none">
                        <img
                          alt=""
                          className="h-10 w-10 rounded-full p-1"
                          style={{
                            background: `linear-gradient(to bottom, ${bodyColor}, ${startColor})`,
                          }}
                          src={flydex.image}
                        />
                      </div>
                      {name}
                      <div className="ml-auto flex items-center gap-2 px-4 text-base">
                        <div className="text-pink-500">{username}</div>
                        <Button asChild size="xs">
                          <a
                            className="w-7"
                            href={`https://twitter.com/${username}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            𝕏
                          </a>
                        </Button>
                        <Button asChild size="xs">
                          <a
                            href={`https://friend.tech/rooms/${wallet}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <img
                              alt="friend.tech logo"
                              className="w-3 dark:invert"
                              src="/images/friendtech.png"
                            />
                          </a>
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Mods items={equipped} />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Celebrate() {
  const [recycle, setRecycle] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setRecycle(false)
    }, 10_000)

    return function cleanup() {
      clearTimeout(timeout)
    }
  }, [])

  return <Confetti recycle={recycle} />
}

function Mods({ items }: { items: ModWithColor[] }) {
  return (
    <ScrollArea
      className="max-w-sm dark:bg-gray-700 sm:max-w-none"
      orientation="horizontal"
    >
      <div className="flex gap-4">
        {items.map(({ color, mod }, index) => {
          return (
            <div
              className="flex w-32 flex-col items-center gap-1 rounded p-2 shadow-gray-400 dark:bg-gray-800 dark:text-gray-200 dark:shadow-gray-900"
              key={index}
            >
              <img
                alt={mod.name}
                className="w-24 rounded"
                src={mod.image}
                style={{
                  background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                }}
              />
              <div className="text-center text-sm">{mod.name}</div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function Digit({ value }: { value: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="tabular-nums"
        key={value}
        initial={{ y: -14, rotateX: 90, opacity: 0 }}
        animate={{ y: 0, rotateX: 0, opacity: 1 }}
        exit={{ y: 14, rotateX: 90, opacity: 0, color: '#663399' }}
        transition={{ duration: 0.3 }}
      >
        {value}
      </motion.div>
    </AnimatePresence>
  )
}

function Panel({ timer }: { timer: number }) {
  const hour = String(Math.trunc(timer / 3600))
    .padStart(2, '0')
    .split('')
  const minute = String(Math.floor((timer / 60) % 60))
    .padStart(2, '0')
    .split('')
  const second = String(timer % 60)
    .padStart(2, '0')
    .split('')

  return (
    <div className="absolute flex text-4xl md:text-9xl">
      <Digit value={hour[0]} />
      <Digit value={hour[1]} />
      <div>:</div>
      <Digit value={minute[0]} />
      <Digit value={minute[1]} />
      <div>:</div>
      <Digit value={second[0]} />
      <Digit value={second[1]} />
    </div>
  )
}

type Data = SerializeFrom<typeof loader>['battles'][number]

function ThemCell({
  id,
  loser,
  winner,
}: {
  id: number
  loser: Data['loser']
  winner: Data['loser']
}) {
  return (
    <BattleflyCell
      battlefly={id === loser.token_id ? winner : loser}
      link
      winner={id === loser.token_id}
    />
  )
}

function YouCell({
  id,
  loser,
  winner,
}: {
  id: number
  loser: Data['loser']
  winner: Data['loser']
}) {
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
            <MobileTooltip
              key={index}
              content={mod.name}
              trigger={
                <img
                  alt={mod.name}
                  className="w-8 rounded"
                  src={mod.image}
                  style={{
                    background: `linear-gradient(119.42deg, rgba(37, 33, 55, 0.5) -16.72%, rgb(${color}) 153.84%)`,
                  }}
                />
              }
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
