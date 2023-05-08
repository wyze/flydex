import { redirect } from '@remix-run/node'

import { today } from '~/lib/date.server'

export function loader() {
  return redirect(`${today}/overview`)
}

export default function LeaderboardIndex() {
  return null
}
