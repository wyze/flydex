import { useFetchers, useNavigation } from '@remix-run/react'
import NProgress from 'nprogress'
import { useEffect, useMemo } from 'react'

export default function useNProgress() {
  const navigation = useNavigation()
  const fetchers = useFetchers()
  const state = useMemo(
    () =>
      [navigation.state, ...fetchers.map((fetcher) => fetcher.state)].every(
        (state) => state === 'idle'
      )
        ? 'idle'
        : 'loading',
    [fetchers, navigation.state]
  )

  useEffect(() => {
    if (state === 'loading') {
      NProgress.start()
    }

    if (state === 'idle') {
      NProgress.done()
    }
  }, [state])
}
