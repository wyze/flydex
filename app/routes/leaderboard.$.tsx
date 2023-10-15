import { type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { z } from 'zod'

import { LeaderboardRow } from '~/components/leaderboard'
import { Pagination } from '~/components/pagination'
import { Select } from '~/components/select'
import { ToggleGroup } from '~/components/toggle-group'
import { usePagination } from '~/hooks/use-pagination'
import { json } from '~/lib/responses.server'
import { getLeaderboard } from '~/services/hasura.server'

const PAGE_SIZE = 30

export async function loader({ params }: DataFunctionArgs) {
  const parsed = z
    .string()
    .transform((value) => {
      const [day, leagueSegment, page] = value.split('/')
      const league = leagueSegment
        .replace('-', ' ')
        .split('')
        .map((character, index) =>
          index > 0 ? character : character.toUpperCase(),
        )
        .join('')

      return {
        limit: PAGE_SIZE,
        offset: page ? (Number(page) - 1) * PAGE_SIZE : 0,
        where: {
          day: { _eq: day },
          league: { _eq: league },
        },
      }
    })
    .parse(params['*'])

  return json(`leaderboard:${params['*']}`, () => getLeaderboard(parsed))
}

export default function Leaderboard() {
  const { leaderboard, showRewards, today, total, yesterday } =
    useLoaderData<typeof loader>()
  const [day, league, page] = useParams()['*']?.split('/') ?? []
  const navigate = useNavigate()
  const pagination = usePagination(total, {
    page: page ? Number(page) : 1,
    size: PAGE_SIZE,
  })

  return (
    <div className="px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Estimated daily rankings based on amount of wins since UTC midnight.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 sm:ml-16 sm:mt-0 sm:flex-none">
          <ToggleGroup
            label="Change day"
            onValueChange={(value) => {
              navigate(`${value}/${league}`)
            }}
            type="single"
            value={day}
          >
            <ToggleGroup.Item
              className="mt-px h-auto w-auto px-2 py-2"
              label="View yesterday"
              value={yesterday}
            >
              Yesterday
            </ToggleGroup.Item>
            <ToggleGroup.Item
              className="mt-px h-auto w-auto px-2 py-2"
              label="View today"
              value={today}
            >
              Today
            </ToggleGroup.Item>
          </ToggleGroup>
          <Select
            onValueChange={(value) => {
              navigate(`${day}/${value}`)
            }}
            value={league}
          >
            <Select.Trigger
              label="View different league"
              placeholder="Select a league"
            />
            <Select.Content>
              <Select.Item value="overview">Overview</Select.Item>
              <Select.Separator className="m-1 h-px bg-gray-200 dark:bg-gray-600" />
              {['Apex', 'Predator', 'Monarch', 'Pupa']
                .flatMap((league) =>
                  [1, 2, 3].map((tier) => `${league} ${tier}`),
                )
                .map((league) => (
                  <Select.Item
                    key={league}
                    value={league.replace(' ', '-').toLowerCase()}
                  >
                    {league}
                  </Select.Item>
                ))}
            </Select.Content>
          </Select>
        </div>
      </div>
      <div className="mt-8 flex flex-col space-y-4">
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
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 dark:bg-gray-900">
                  {leaderboard.map((props, index) => (
                    <LeaderboardRow
                      key={props.rank}
                      {...{ ...props, index, showRewards }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Pagination button={ParamsLink} {...pagination} />
      </div>
    </div>
  )
}

function ParamsLink({
  children,
  offset = 0,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children: React.ReactNode
  offset?: number
}) {
  const [day, league] = useParams()['*']?.split('/') ?? []
  const page = offset / PAGE_SIZE + 1
  const segments = [day, league, page === 1 ? null : page]
    .filter(Boolean)
    .join('/')

  return (
    <Link prefetch="intent" to={segments} {...props}>
      {children}
    </Link>
  )
}
