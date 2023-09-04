import { type LoaderArgs } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { Fragment } from 'react'
import { z } from 'zod'
import { zx } from 'zodix'

import { Mods } from '~/components/mods'
import { Owner } from '~/components/owner'
import { UnderlineLink } from '~/components/underline-link'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getLeaderboardOverview } from '~/services/hasura.server'

export async function loader({ params }: LoaderArgs) {
  const { day } = zx.parseParams(params, {
    day: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  })

  return json(`leaderboard-overview:${day}`, () => getLeaderboardOverview(day))
}

export default function Leaderboard() {
  const { leaderboards } = useLoaderData<typeof loader>()
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
                          {leaderboard.map(
                            ({ flydex, league, token_id, wins }, index) => {
                              const bodyColor = flydex.body_color
                              const startColor =
                                bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
                              const { equipped } = normalize.mods(flydex)

                              return (
                                <tr
                                  key={token_id}
                                  className={
                                    index % 2
                                      ? undefined
                                      : 'bg-gray-50 dark:bg-gray-800'
                                  }
                                >
                                  <td className="whitespace-nowrap text-sm">
                                    <div className="py-4 pl-4 pr-3 sm:pl-6">
                                      <div className="flex items-center">
                                        <div className="w-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                          {index + 1}.
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
                                            <UnderlineLink
                                              href={`/battlefly/${token_id}`}
                                            >
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
                                    <div className="text-gray-900 dark:text-gray-200">
                                      {league}
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 text-sm">
                                    <div className="text-gray-500 dark:text-gray-400">
                                      {wins}
                                    </div>
                                  </td>
                                </tr>
                              )
                            },
                          )}
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
