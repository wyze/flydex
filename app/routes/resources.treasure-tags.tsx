import type { ActionArgs, SerializeFrom } from '@remix-run/node'
import { useNavigate } from '@remix-run/react'
import { Tag } from 'lucide-react'
import { z } from 'zod'
import { zx } from 'zodix'

import { CommandGroup, CommandItem } from '~/components/ui/command'
import { json } from '~/lib/responses.server'
import { getTreasureTagOwners } from '~/services/hasura.server'

interface CommandGetTreasureTagsProps {
  data: SerializeFrom<typeof loader>

  runCommand: (command: () => void) => void
}

export async function loader({ request }: ActionArgs) {
  const parsed = zx.parseQuerySafe(request, {
    query: z.string(),
  })

  if (!parsed.success) {
    return json('invalid:treasure-tag', () =>
      Promise.resolve({ tags: [], total: 0 }),
    )
  }

  const { query } = parsed.data

  return json(`treasure-tag:${query}`, () => getTreasureTagOwners(query))
}

export function CommandGetTreasureTags({
  data,
  runCommand,
}: CommandGetTreasureTagsProps) {
  const navigate = useNavigate()

  return (
    <CommandGroup heading="Treasure Tags">
      {data.tags.map(({ display_name, owner }) => (
        <CommandItem
          key={display_name}
          value={display_name}
          onSelect={() => {
            runCommand(() => navigate(`/owner/${owner}`))
          }}
        >
          <Tag className="mr-2" size={16} strokeWidth={1.5} />
          {display_name}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
