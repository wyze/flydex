import { type LoaderArgs } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { Fragment } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { LeaderboardRow } from '~/components/leaderboard'
import { json } from '~/lib/responses.server'
import { getLeaderboardOverview } from '~/services/hasura.server'

export async function loader({ params }: LoaderArgs) {
  const { day } = zx.parseParams(params, {
    day: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  })

  return json(`leaderboard-overview:${day}`, () => getLeaderboardOverview(day))
}

export default function Leaderboard() {
  const { leaderboards, showRewards } = useLoaderData<typeof loader>()
  const { day } = useParams()

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Leaderboard Overview
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Estimated daily rankings based on amount of wins since UTC midnight.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-red-300 dark:divide-red-800">
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
                      League
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                    >
                      Wins
                    </th>
                    {showRewards ? (
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50"
                      >
                        Reward
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-700">
                  {leaderboards
                    .filter((leaderboard) => leaderboard.length > 0)
                    .map((leaderboard) => {
                      const { league } = leaderboard.at(0) ?? {}

                      return (
                        <Fragment key={league}>
                          <tr className="border-t border-gray-200 dark:border-gray-700">
                            <th
                              colSpan={4}
                              scope="colgroup"
                              className="bg-gray-50 py-2 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:bg-gray-900 sm:pl-6"
                            >
                              <Link
                                className="text-pink-500 underline"
                                prefetch="intent"
                                to={`/leaderboard/${day}/${league
                                  ?.toLowerCase()
                                  .replace(' ', '-')}`}
                              >
                                {league}
                              </Link>
                            </th>
                          </tr>
                          {leaderboard.map((props, index) => (
                            <LeaderboardRow
                              key={props.rank}
                              {...{ ...props, index, showRewards }}
                            />
                          ))}
                        </Fragment>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
