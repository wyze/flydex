import { redirect } from '@remix-run/node'
import { cacheHeader } from 'pretty-cache-header'

import { today } from '~/lib/date.server'

export function loader() {
  return redirect(`${today}/overview`)
}

export function headers() {
  return {
    'Cache-Control': cacheHeader({
      public: true,
      maxAge: '1hour',
      staleWhileRevalidate: '45minutes',
    }),
  }
}

export default function LeaderboardIndex() {
  return null
}
