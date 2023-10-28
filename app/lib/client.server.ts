import { GraphQLClient } from 'graphql-request'

import { HASURA_API_KEY, HASURA_ENDPOINT } from './env.server'

export const client = new GraphQLClient(HASURA_ENDPOINT, {
  headers: { 'x-hasura-admin-secret': HASURA_API_KEY },
})
