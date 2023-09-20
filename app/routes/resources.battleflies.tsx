import type { DataFunctionArgs, SerializeFrom } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { z } from 'zod'
import { zx } from 'zodix'

import { Badge } from '~/components/ui/badge'
import { CommandGroup, CommandItem } from '~/components/ui/command'
import { json } from '~/lib/responses.server'
import { getFlydexTokens } from '~/services/hasura.server'

interface CommandGetBattlefliesProps {
  data: SerializeFrom<typeof loader>

  runCommand: (command: () => void) => void
}

export async function loader({ request }: DataFunctionArgs) {
  const parsed = zx.parseQuerySafe(request, {
    query: z
      .string()
      .regex(/^\d{1,5}$/)
      .transform((value) => ({
        value: { token_id_string: { _iregex: value } },
      })),
  })

  if (!parsed.success) {
    return json('invalid:battleflies', () =>
      Promise.resolve({ tokens: [], total: 0 }),
    )
  }

  const { value } = parsed.data.query

  return json(`battleflies:${value.token_id_string._iregex}`, () =>
    getFlydexTokens({ where: value }),
  )
}

export function CommandGetBattleflies({
  data,
  runCommand,
}: CommandGetBattlefliesProps) {
  const navigate = useNavigate()

  return (
    <CommandGroup heading="BattleFlies">
      {data.tokens.map(({ name, token_id }) => (
        <CommandItem
          key={token_id}
          value={token_id}
          onSelect={() => {
            runCommand(() => navigate(`/battlefly/${token_id}`))
          }}
        >
          {name}
          <Badge className="ml-2 rounded-sm bg-highlight text-highlight-foreground hover:bg-highlight/80 dark:bg-highlight-foreground dark:text-highlight dark:hover:bg-highlight-foreground/80">
            {token_id}
          </Badge>
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
