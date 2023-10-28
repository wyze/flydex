import { Cacheables } from 'cacheables'
import ms from 'ms'

const cache = new Cacheables({ log: true })

export function cacheable<T, K>(
  promise: () => Promise<T>,
  key: string | K[],
  maxAge = ms('10m'),
) {
  return cache.cacheable(
    promise,
    Array.isArray(key)
      ? key
          .map((item) =>
            typeof item === 'object' ? JSON.stringify(item) : item,
          )
          .join(':')
      : key,
    {
      cachePolicy: 'stale-while-revalidate',
      maxAge,
    },
  )
}
