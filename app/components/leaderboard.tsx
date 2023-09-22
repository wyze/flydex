import * as normalize from '~/lib/normalize'
import type { getLeaderboard } from '~/services/hasura.server'

import { Mods } from './mods'
import { Owner } from './owner'
import { Button } from './ui/button'
import { UnderlineLink } from './underline-link'

type LeaderboardData = Awaited<ReturnType<typeof getLeaderboard>>

export function LeaderboardRow({
  day,
  flydex,
  index,
  invite,
  league,
  league_battles,
  rank,
  reward,
  showRewards,
  token_id,
  wins,
  ...mods
}: LeaderboardData['leaderboard'][number] & {
  invite?: {
    name: string
    username: string
    wallet: string
  }
  index: number
  league_battles?: number
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
                  {invite?.name ?? flydex.name}
                </UnderlineLink>
              </div>
              <Mods items={equipped} title="" />
            </div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 text-sm">
        {invite ? invite.username : <Owner {...flydex.token} />}
      </td>
      {invite ? (
        <td className="whitespace-nowrap px-3 text-sm">
          <div className="flex gap-3">
            <Button asChild size="xs">
              <a
                className="w-7"
                href={`https://twitter.com/${invite.username}`}
                rel="noreferrer"
                target="_blank"
              >
                𝕏
              </a>
            </Button>
            <Button asChild size="xs">
              <a
                href={`https://friend.tech/rooms/${invite.wallet}`}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt="friend.tech logo"
                  className="w-3 min-w-[0.75rem] dark:invert"
                  src="/images/friendtech.png"
                />
              </a>
            </Button>
          </div>
        </td>
      ) : null}
      <td className="whitespace-nowrap px-3 text-sm">
        <div className="text-gray-900 dark:text-gray-200">{league}</div>
      </td>
      <td className="whitespace-nowrap px-3 text-sm">
        <div className="text-gray-500 dark:text-gray-400">{wins}</div>
      </td>
      {league_battles ? (
        <td className="whitespace-nowrap px-3 text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            {league_battles}
          </div>
        </td>
      ) : null}
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
