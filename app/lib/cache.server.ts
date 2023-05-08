import { Cacheables } from 'cacheables'

const cache = new Cacheables({ log: true })

export function cacheable<T>(promise: () => Promise<T>, key: string) {
  return cache.cacheable(promise, key, {
    cachePolicy: 'stale-while-revalidate',
    maxAge: 1000 * 60 * 10, // 10 minutes
  })
}
