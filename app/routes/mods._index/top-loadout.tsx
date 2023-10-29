import { Await, useLoaderData } from '@remix-run/react'
import { Suspense } from 'react'

import { Mods } from '~/components/mods'
import * as normalize from '~/lib/normalize'

import type { loader } from './server'

function getTopLoadout<
  T extends Record<`slot_${number}`, Array<{ wl_ratio: string }>>,
>(value: T) {
  const loadout = [
    ...value.slot_0,
    ...value.slot_1,
    ...value.slot_2,
    ...value.slot_3,
  ].reduce<(typeof value)['slot_0'][number] | null>((acc, loadout) => {
    if (!acc) {
      return loadout
    }

    return Number(loadout.wl_ratio.slice(0, -1)) >
      Number(acc.wl_ratio.slice(0, -1))
      ? loadout
      : acc
  }, null)

  return { ...value, loadout }
}

export function TopLoadout({
  className,
  display,
  fallback,
  id,
}: {
  className: string
  display: 'children' | 'title'
  fallback: React.ReactNode
  id: string
}) {
  const { loadouts } = useLoaderData<typeof loader>()

  return (
    <Suspense fallback={fallback}>
      <Await resolve={loadouts}>
        {(loadouts) => {
          const mods = loadouts.find((loadout) => {
            const values = Object.values(loadout).flat()

            return values.some((item) => item.id === id)
          })
          const loadout = mods ? getTopLoadout(mods)?.loadout ?? null : null
          const value = `W/L Ratio: ${loadout?.wl_ratio}`

          return loadout ? (
            <div className={className}>
              <Mods
                items={
                  normalize.mods({
                    mods: Object.entries(loadout)
                      .filter(([key]) => key.startsWith('slot_'))
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
                title={display === 'title' ? value : ''}
              />
              {display === 'children' ? value : null}
            </div>
          ) : (
            'Unused'
          )
        }}
      </Await>
    </Suspense>
  )
}
