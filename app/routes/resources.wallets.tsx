import type { ActionArgs, SerializeFrom } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { z } from 'zod'
import { zx } from 'zodix'

import { Icon } from '~/components/icon'
import { CommandGroup, CommandItem } from '~/components/ui/command'
import { json } from '~/lib/responses.server'
import { getFlydexOwners } from '~/services/hasura.server'

interface CommandGetWalletsProps {
  data: SerializeFrom<typeof loader>

  runCommand: (command: () => void) => void
}

export async function loader({ request }: ActionArgs) {
  const parsed = zx.parseQuerySafe(request, {
    query: z.string().transform((value) => ({
      owner: { _iregex: value },
    })),
  })

  if (!parsed.success) {
    return json('invalid:wallet', () =>
      Promise.resolve({ total: 0, wallets: [] }),
    )
  }

  const { query } = parsed.data

  return json(`wallet:${query.owner._iregex}`, () =>
    getFlydexOwners({ where: query }),
  )
}

export function CommandGetWallets({
  data,
  runCommand,
}: CommandGetWalletsProps) {
  const navigate = useNavigate()

  return (
    <CommandGroup heading="Wallets">
      {data.wallets.map(({ owner }) => (
        <CommandItem
          key={owner}
          value={owner}
          onSelect={() => {
            runCommand(() => navigate(`/owner/${owner}`))
          }}
        >
          <Icon className="mr-2" name="wallet" />
          {owner}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
