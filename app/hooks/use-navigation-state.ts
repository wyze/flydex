import { useFetchers, useNavigation } from '@remix-run/react'
import { useMemo } from 'react'

export function useNavigationState() {
  const navigation = useNavigation()
  const fetchers = useFetchers()

  return useMemo(
    () =>
      [navigation.state, ...fetchers.map((fetcher) => fetcher.state)].every(
        (state) => state === 'idle',
      )
        ? 'idle'
        : 'loading',
    [fetchers, navigation.state],
  )
}
