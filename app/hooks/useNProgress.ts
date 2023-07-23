import NProgress from 'nprogress'
import { useEffect } from 'react'

import useNavigationState from '~/hooks/useNavigationState'

export default function useNProgress() {
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
