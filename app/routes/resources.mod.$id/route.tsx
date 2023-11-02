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
    <>
      <HoverCard>
        <HoverCardTrigger asChild>
          {typeof children === 'string' ? (
            <Button
              className="hidden md:inline-flex"
              onMouseEnter={load}
              variant="link"
            >
              {children}
            </Button>
          ) : (
            <div
              className="hidden cursor-pointer md:inline-flex"
              onMouseEnter={load}
            >
              {children}
            </div>
          )}
        </HoverCardTrigger>
        <HoverCardContent className="w-96">
          {fetcher.data ? <Content {...fetcher.data} /> : <Loader />}
        </HoverCardContent>
      </HoverCard>
      <Popover>
        <PopoverTrigger asChild>
          {typeof children === 'string' ? (
            <Button className="md:hidden" onTouchStart={load} variant="link">
              {children}
            </Button>
          ) : (
            <div className="cursor-pointer md:hidden" onTouchStart={load}>
              {children}
            </div>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-96">
          {fetcher.data ? <Content {...fetcher.data} /> : <Loader />}
        </PopoverContent>
      </Popover>
    </>
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
  name,
  season,
  ...mod
}: SerializeFrom<typeof loader>) {
  const stats = Object.entries(mod).filter(
    ([key, value]) => key !== 'class' && Boolean(value),
  )

  return (
    <>
      <h3 className="mb-2 text-center text-2xl font-bold">{name}</h3>
      <div className="text-center text-sm leading-relaxed">{description}</div>
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
