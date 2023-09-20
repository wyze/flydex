import * as remix from '@remix-run/node'
import { useLoaderData, useRevalidator } from '@remix-run/react'
import { differenceInSeconds } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { ScrollArea } from '~/components/scroll-area'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import type { Mod } from '~/lib/types'
import { getInvitational } from '~/services/hasura.server'

export async function loader() {
  const initialTimer = differenceInSeconds(
    new Date('2023-09-21 00:00:00'),
    new Date(),
  )
  const players = await getInvitational()

  if (initialTimer >= 0) {
    return remix.json({ initialTimer, players })
  }

  return json('invitational', () =>
    Promise.resolve({ initialTimer: 0, players }),
  )
}

export default function Invitational() {
  const { initialTimer, players } = useLoaderData<typeof loader>()
  const [timer, setTimer] = useState(initialTimer)
  const { revalidate } = useRevalidator()

  useEffect(() => {
    if (initialTimer > 0) {
      const interval = setInterval(() => {
        setTimer((state) => {
          if (state < 0) {
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

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mx-auto py-10 text-4xl">Countdown to the Invitational</h1>
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
                          className="w-3"
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

function Mods({ items }: { items: Mod[] }) {
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
    <div className="absolute flex text-9xl">
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
