import { useNavigation } from '@remix-run/react'
import { load, trackPageview } from 'fathom-client'
import { useEffect } from 'react'

export default function useFathom() {
  const navigation = useNavigation()

  useEffect(() => {
    load('DSXEEGPL', {
      spa: 'history',
      excludedDomains: ['localhost'],
    })
  }, [])

  useEffect(() => {
    if (navigation.location?.pathname === '/') {
      trackPageview({
        url: navigation.location.search.replace('?', '/') || '/',
      })
    }

    if (navigation.location?.pathname.startsWith('/battlefly')) {
      trackPageview({
        url: [
          navigation.location.pathname,
          navigation.location.search.slice(1),
        ].join(':'),
      })
    }
  }, [navigation.location])
}
