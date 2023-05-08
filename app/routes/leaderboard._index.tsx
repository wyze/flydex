import { redirect } from '@remix-run/node'

import { today } from '~/lib/date.server'

export function loader() {
  return redirect(`${today}/apex-1`)
}

export default function LeaderboardIndex() {
  return null
}
