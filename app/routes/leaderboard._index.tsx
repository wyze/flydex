import { redirect } from '@remix-run/node'
import { cacheHeader } from 'pretty-cache-header'

import { today } from '~/lib/date.server'

export function loader() {
  return redirect(`${today}/overview`, {
    headers: {
      'Cache-Control': cacheHeader({
        public: true,
        sMaxage: '30minutes',
        staleWhileRevalidate: '20minutes',
      }),
    },
  })
}

export default function LeaderboardIndex() {
  return null
}
