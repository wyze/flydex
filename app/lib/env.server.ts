import { z } from 'zod'

export const { COOKIE_SECRET, HASURA_API_KEY, HASURA_ENDPOINT } = z
  .object({
    VITE_COOKIE_SECRET: z.string().default('c00k13-s3cr3t'),
    VITE_HASURA_API_KEY: z.string().default(''),
    VITE_HASURA_ENDPOINT: z.string().url().default(''),
  })
  .transform((value) =>
    Object.fromEntries(
      Object.entries(value).map(([key, value]) => [
        key.replace('VITE_', ''),
        value,
      ]),
    ),
  )
  .parse(import.meta.env)
