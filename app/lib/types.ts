import type { getFlydex } from '~/services/hasura.server'

export type Fly = Awaited<ReturnType<typeof getFlydex>>['flies'][number]
export type Mod = Fly['mods'][number] & { color: string }
