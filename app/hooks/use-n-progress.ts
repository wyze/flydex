import NProgress from 'nprogress'
import { useEffect } from 'react'

import { useNavigationState } from '~/hooks/use-navigation-state'

export function useNProgress() {
  const state = useNavigationState()

  useEffect(() => {
    if (state === 'loading') {
      NProgress.start()
    }

    if (state === 'idle') {
      NProgress.done()
    }
  }, [state])
}
