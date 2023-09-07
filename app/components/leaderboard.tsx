import * as normalize from '~/lib/normalize'
import type { getLeaderboard } from '~/services/hasura.server'

import { Mods } from './mods'
import { Owner } from './owner'
import { UnderlineLink } from './underline-link'

type LeaderboardData = Awaited<ReturnType<typeof getLeaderboard>>

export function LeaderboardRow({
  day,
  flydex,
  index,
  league,
  rank,
  reward,
  showRewards,
  token_id,
  wins,
  ...mods
}: LeaderboardData['leaderboard'][number] & {
  index: number
  showRewards: LeaderboardData['showRewards']
}) {
  const bodyColor = flydex.body_color
  const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
  const { equipped } = normalize.mods({
    mods: Object.entries(mods).map(([key, mod]) => ({
      mod,
      slot: Number(key.at(-1)),
    })),
  })

  return (
    <tr
      key={token_id}
      className={index % 2 ? undefined : 'bg-gray-50 dark:bg-gray-800'}
    >
      <td className="whitespace-nowrap text-sm">
        <div className="py-4 pl-4 pr-3 sm:pl-6">
          <div className="flex items-center">
            <div className="w-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {rank}.
            </div>
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
            <div className="flex flex-col gap-1">
              <div className="font-medium">
                <UnderlineLink href={`/battlefly/${token_id}`}>
                  {flydex.name}
                </UnderlineLink>
              </div>
              <Mods items={equipped} title="" />
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 text-sm">
        <Owner {...flydex.token} />
      </td>
      <td className="whitespace-nowrap px-3 text-sm">
        <div className="text-gray-900 dark:text-gray-200">{league}</div>
      </td>
      <td className="whitespace-nowrap px-3 text-sm">
        <div className="text-gray-500 dark:text-gray-400">{wins}</div>
      </td>
      {showRewards ? (
        <td className="whitespace-nowrap px-3 text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            {normalize.reward(reward)}
          </div>
        </td>
      ) : null}
    </tr>
  )
}
