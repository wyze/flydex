import * as remix from '@remix-run/node'
import type { TypedResponse } from '@remix-run/node'
import { cacheHeader } from 'pretty-cache-header'

import * as cache from './cache.server'

export async function json<Data, Uncached extends Record<string, unknown>>(
  cacheKey: string,
  getData: () => Promise<Data>,
  uncached: Uncached
): Promise<TypedResponse<Data & Uncached>>
export async function json<Data>(
  cacheKey: string,
  getData: () => Promise<Data>,
  uncached?: never
): Promise<TypedResponse<Data>>
export async function json<Data, Uncached extends Record<string, unknown>>(
  cacheKey: string,
  getData: () => Promise<Data>,
  uncached?: Uncached
) {
  const data = await cache.cacheable(getData, cacheKey)

  return remix.json(uncached ? { ...data, ...uncached } : data, {
    headers: {
      'Cache-Control': cacheHeader({
        public: true,
        maxAge: '10minutes',
        staleWhileRevalidate: '5minutes',
      }),
    },
  })
}

export async function error<Data>(data: Data, status = 422) {
  return remix.json<Data>(data, { status })
}
