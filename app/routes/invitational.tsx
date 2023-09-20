import { json } from '@remix-run/node'
import { useLoaderData, useRevalidator } from '@remix-run/react'
import { differenceInSeconds } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function loader() {
  const initialTimer = differenceInSeconds(
    new Date('2023-09-21 00:00:00'),
    new Date(),
  )

  return json({ initialTimer })
}

export default function Invitational() {
  const { initialTimer } = useLoaderData<typeof loader>()
  const [timer, setTimer] = useState(initialTimer)
  const { revalidate } = useRevalidator()

  useEffect(() => {
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
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="mx-auto py-10 text-4xl">Countdown to the Invitational</h1>
      <div className="relative mt-6 flex h-32 justify-center text-pink-600">
        <Panel timer={timer} />
      </div>
    </div>
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
