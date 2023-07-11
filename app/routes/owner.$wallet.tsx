import type { LoaderArgs } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import queryString from 'query-string'
import { z } from 'zod'

export async function loader({ params }: LoaderArgs) {
  const wallet = z
    .string()
    .regex(/^0x\w{40}$/)
    .transform((value) => ({
      token: { owner: { _eq: value.toLowerCase() } },
    }))
    .parse(params.wallet)

  return redirect(
    '/?'.concat(
      queryString.stringify({
        where: JSON.stringify(wallet),
      }),
    ),
  )
}

export default function Owner() {
  return null
}
