import type { DataFunctionArgs, SerializeFrom } from '@remix-run/node'
import { useLoaderData, useLocation, useSearchParams } from '@remix-run/react'
import type { ColumnDef } from '@tanstack/react-table'
import { z } from 'zod'
import { zx } from 'zodix'

import { DataTable } from '~/components/data-table'
import { Mods } from '~/components/mods'
import { Owner } from '~/components/owner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { UnderlineLink } from '~/components/underline-link'
import * as normalize from '~/lib/normalize'
import { json } from '~/lib/responses.server'
import { getTrending } from '~/services/hasura.server'

const DEFAULT_LEAGUE = 'Apex 2'

export function loader({ request }: DataFunctionArgs) {
  const params = zx.parseQuery(request, {
    limit: z
      .number()
      .refine((value) => value <= 30)
      .default(30),
    offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 400),
    where: z
      .string()
      .default(`{"league_full":{"_eq":"${DEFAULT_LEAGUE}"}}`)
      .transform((value) => JSON.parse(value)),
  })

  return json(`trending:${JSON.stringify(params)}`, () => getTrending(params))
}

export default function TrendingPage() {
  const { flies, total } = useLoaderData<typeof loader>()
  const { search } = useLocation()
  const [params, setParams] = useSearchParams()
  const where = JSON.parse(params.get('where') ?? '{}')
  const selected: string = where?.league_full?._eq ?? DEFAULT_LEAGUE

  return (
    <div className="flex-1 p-12">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Trending
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            A list of flies sorted by how well they have increased their
            win/loss ratio over the past 24 hours.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 sm:ml-16 sm:mt-0 sm:flex-none">
          <Select
            onValueChange={(value) => {
              if (value !== selected) {
                setParams((params) => {
                  if (value === DEFAULT_LEAGUE) {
                    params.delete('where')
                  } else {
                    params.set(
                      'where',
                      JSON.stringify({ ...where, league_full: { _eq: value } }),
                    )
                  }

                  return params
                })
              }
            }}
            value={selected}
          >
            <SelectTrigger className="w-_[180px]">
              <SelectValue placeholder="Select a league" />
            </SelectTrigger>
            <SelectContent>
              {['Apex', 'Predator', 'Monarch', 'Pupa']
                .flatMap((league) =>
                  [1, 2, 3].map((tier) => `${league} ${tier}`),
                )
                .map((league) => (
                  <SelectItem key={league} value={league}>
                    {league}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col">
        <DataTable key={search} columns={columns} data={flies} total={total} />
      </div>
    </div>
  )
}

type Data = SerializeFrom<typeof loader>['flies'][number]

const columns: Array<ColumnDef<Data>> = [
  {
    accessorKey: 'rank',
    header: 'Rank',
    cell({ getValue }) {
      return (
        <div className="text-gray-500 dark:text-gray-400">
          {getValue() as string}
        </div>
      )
    },
  },
  {
    accessorKey: 'name',
    header: 'BattleFly',
    cell({
      row: {
        original: { flydex },
      },
    }) {
      const bodyColor = flydex.body_color
      const startColor = bodyColor.at(1) === '1' ? '#a2a2a2' : '#2a2a2a'
      const { equipped } = normalize.mods(flydex)

      return (
        <div className="flex items-center">
          {/* <div className="w-3 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
            {rank}.
          </div> */}
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
              <UnderlineLink href={`/battlefly/${flydex.token_id}`}>
                {flydex.name}
              </UnderlineLink>
            </div>
            <Mods items={equipped} title="" />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
    cell({
      row: {
        original: { flydex },
      },
    }) {
      return <Owner {...flydex.token} />
    },
  },
  { accessorKey: 'change', header: 'Change' },
  { accessorKey: 'wl_ratio', header: 'Win/Loss Ratio' },
  { accessorKey: 'wl_ratio_previous', header: 'Previous Win/Loss Ratio' },
]
