import { useLocation, useNavigate } from '@remix-run/react'
import queryString from 'query-string'

import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/helpers'

export function SortDropdown() {
  const navigate = useNavigate()
  const { pathname, ...location } = useLocation()

  const options = [
    { label: 'Contest Points', value: 'contest_points' },
    { label: 'Level', value: 'level' },
    { label: 'Rank', value: 'rank' },
    { label: '24h W/L Ratio', value: 'wl_ratio_24h' },
  ]

  const parsed = queryString.parse(location.search)
  const { order_by, where } = parsed
  const orderBy = JSON.parse(
    typeof order_by === 'string' ? order_by : '{}',
  ) as Record<string, 'asc_nulls_last' | 'desc_nulls_last'>

  const { label } =
    options.find((option) => option.value === Object.keys(orderBy).at(0)) ?? {}
  const sorted = Object.values(orderBy).at(0)
  const icon = sorted
    ? sorted === 'asc_nulls_last'
      ? 'arrow-up-0-1'
      : 'arrow-down-1-0'
    : 'arrow-down-up'

  return (
    <div className="ml-8 flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={
              sorted === 'desc_nulls_last'
                ? `Sorted by ${label} descending.`
                : sorted === 'asc_nulls_last'
                  ? `Sorted by ${label} ascending.`
                  : 'Not sorted.'
            }
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{label ?? 'Sort By'}</span>
            <Icon
              className={cn(
                'ml-2',
                icon === 'arrow-down-up' ? null : 'text-foreground',
              )}
              aria-hidden="true"
              name={icon}
              size="sm"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {options.map(({ label, value }) => (
            <DropdownMenuGroup key={value}>
              <DropdownMenuLabel>{label}</DropdownMenuLabel>
              <DropdownMenuItem
                aria-label="Sort ascending"
                onClick={() => {
                  const search = queryString.stringify(
                    {
                      order_by: JSON.stringify({ [value]: 'asc_nulls_last' }),
                      where,
                    },
                    { skipEmptyString: true },
                  )

                  navigate({ pathname, search })
                }}
              >
                <Icon
                  className="mr-2 text-muted-foreground/80"
                  aria-hidden="true"
                  name="arrow-up-0-1"
                  size="sm"
                />
                Sort ascending
              </DropdownMenuItem>
              <DropdownMenuItem
                aria-label="Sort descending"
                onClick={() => {
                  const search = queryString.stringify(
                    {
                      order_by: JSON.stringify({ [value]: 'desc_nulls_last' }),
                      where,
                    },
                    { skipEmptyString: true },
                  )

                  navigate({ pathname, search })
                }}
              >
                <Icon
                  className="mr-2 text-muted-foreground/80"
                  aria-hidden="true"
                  name="arrow-down-1-0"
                  size="sm"
                />
                Sort descending
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            aria-label="Remove sort"
            onClick={() => {
              const search = queryString.stringify(
                { where },
                { skipEmptyString: true },
              )

              navigate({ pathname, search })
            }}
            disabled={!sorted}
          >
            <Icon
              className="mr-2 text-muted-foreground/80"
              aria-hidden="true"
              name="x"
              size="sm"
            />
            Remove sort
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
