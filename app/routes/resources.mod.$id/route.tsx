import type { SerializeFrom } from '@remix-run/node'
import { useFetcher } from '@remix-run/react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '~/components/ui/hover-card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/helpers'

import { loader } from './server'

export { loader }

export function ModPreview({
  children,
  id,
}: {
  children: React.ReactNode
  id: string
}) {
  const fetcher = useFetcher<typeof loader>()

  function load() {
    fetcher.load(`/resources/mod/${id}`)
  }

  return (
    <HoverCard>
      <Popover>
        <HoverCardTrigger asChild>
          <Button
            className="hidden md:inline-flex"
            onMouseEnter={load}
            variant="link"
          >
            {children}
          </Button>
        </HoverCardTrigger>
        <PopoverTrigger asChild>
          <Button className="md:hidden" onTouchStart={load} variant="link">
            {children}
          </Button>
        </PopoverTrigger>
        <HoverCardContent className="w-80">
          {fetcher.data ? <Content {...fetcher.data} /> : <Loader />}
        </HoverCardContent>
        <PopoverContent className="w-80">
          {fetcher.data ? <Content {...fetcher.data} /> : <Loader />}
        </PopoverContent>
      </Popover>
    </HoverCard>
  )
}

function Loader() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Separator className="my-2" />
      <Skeleton className="h-4 w-3/4" />
      <Separator className="my-2" />
      <div className="mx-4 grid grid-cols-2 gap-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>
  )
}

function Content({
  description,
  season,
  ...mod
}: SerializeFrom<typeof loader>) {
  const stats = Object.entries(mod).filter(
    ([key, value]) => key !== 'class' && Boolean(value),
  )

  return (
    <>
      {description}
      <Separator className="mb-2 mt-2" />
      <div className="flex items-center justify-center gap-3">
        <Badge variant="secondary">
          {season[0].toUpperCase().concat(season.slice(1).replace('-', ' '))}
        </Badge>
        <Badge variant="highlight">{mod.class}</Badge>
      </div>
      {stats.length > 0 ? (
        <>
          <Separator className="mb-4 mt-2" />
          <div
            className={cn('grid gap-2', stats.length > 1 ? 'grid-cols-2' : '')}
          >
            {stats.map(([label, value], index) => (
              <div key={index} className="flex flex-col gap-1 text-center">
                <div className="text-sm text-muted-foreground">
                  {label
                    .split('_')
                    .slice(1)
                    .map(([first, ...rest]) =>
                      first.toUpperCase().concat(...rest),
                    )
                    .join(' ')
                    .replace('Hp', 'HP')}
                </div>
                <div className="text-lg font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  )
}
