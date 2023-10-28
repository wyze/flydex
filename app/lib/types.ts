import type { z } from 'zod'

import type { mod } from '~/lib/schemas.server'

export type Mod = { mod: z.output<typeof mod>; slot: number | null }
export type ModWithColor = Mod & { color: string }
