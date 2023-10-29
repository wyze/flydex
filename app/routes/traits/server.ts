import type { DataFunctionArgs } from '@remix-run/node'
import { z } from 'zod'
import { zx } from 'zodix'

import { cacheable } from '~/lib/cache.server'
import { client } from '~/lib/client.server'
import { PAGE_SIZE } from '~/lib/constants'
import { traitDescription } from '~/lib/helpers'
import { trait } from '~/lib/schemas.server'

import {
  type GetTraitListQueryVariables,
  getSdk,
} from './queries.generated.server'

const schema = {
  trait: trait
    .merge(
      z.object({
        equipped: z.number(),
      }),
    )
    .transform(traitDescription)
    .array(),
  filters: z.object({
    tags: z
      .object({
        tag: z.string(),
      })
      .array(),
  }),
}

const sdk = getSdk(client)

async function getTraitFilters() {
  const data = await cacheable(sdk.GetTraitFilters, ['traits', 'filters'])

  return schema.filters.parse(data)
}

async function getTraitList(variables: GetTraitListQueryVariables) {
  const data = await cacheable(sdk.GetTraitList.bind(null, variables), [
    'traits',
    variables,
  ])

  return {
    total: z.number().parse(data.battlefly_trait_aggregate.aggregate?.count),
    traits: schema.trait.parse(data.battlefly_trait),
  }
}

export function loader({ request }: DataFunctionArgs) {
  const params = zx.parseQuery(request, {
    limit: z
      .number()
      .refine((value) => value <= PAGE_SIZE)
      .default(PAGE_SIZE),
    offset: z
      .string()
      .default('0')
      .transform(Number)
      .refine((value) => value <= 60),
    order_by: z
      .string()
      .default(JSON.stringify({ name: 'asc' }))
      .transform((value) => JSON.parse(value)),
    where: z
      .string()
      .default('{}')
      .transform((value) => JSON.parse(value)),
  })

  return Promise.all([getTraitFilters(), getTraitList(params)]).then(
    ([filters, traits]) => ({ ...traits, filters }),
  )
}
