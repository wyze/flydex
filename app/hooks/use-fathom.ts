import { useLocation } from '@remix-run/react'
import { load, trackPageview } from 'fathom-client'
import { useEffect } from 'react'

export function useFathom() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    load('DSXEEGPL', {
      spa: 'history',
      excludedDomains: ['localhost'],
    })
  }, [])

  useEffect(() => {
    if (['/', '/battlefly', '/mods', '/traits'].includes(pathname)) {
      trackPageview({
        url: [pathname, search.slice(1)].join(':'),
      })
    }
  }, [pathname, search])
}
