import { z } from 'zod'

export const { COOKIE_SECRET, HASURA_API_KEY, HASURA_ENDPOINT } = z
  .object({
    COOKIE_SECRET: z.string().default('c00k13-s3cr3t'),
    HASURA_API_KEY: z.string().default(''),
    HASURA_ENDPOINT: z.string().url().default(''),
  })
  .parse(process.env)
