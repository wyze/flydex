import { Link, NavLink, useFetcher, useNavigate } from '@remix-run/react'
import { useCommandState } from 'cmdk'
import { motion } from 'framer-motion'
import { forwardRef, useCallback, useEffect, useState } from 'react'
import { useSpinDelay } from 'spin-delay'
import { useDebounce } from 'use-debounce'

import { DropdownMenu } from '~/components/dropdown-menu'
import { Icon } from '~/components/icon'
import { useTheme } from '~/components/theme-provider'
import { Button } from '~/components/ui/button'
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command'
import { useNavigationState } from '~/hooks/use-navigation-state'
import { cn } from '~/lib/helpers'
import {
  CommandGetBattleflies,
  type loader as flyLoader,
} from '~/routes/resources.battleflies'
import {
  CommandGetTreasureTags,
  type loader as tagLoader,
} from '~/routes/resources.treasure-tags'
import {
  CommandGetWallets,
  type loader as walletLoader,
} from '~/routes/resources.wallets'

interface CommandLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode

  /** Estimated progress of loading asynchronous options. */
  progress?: number
}

const THEME_TO_GOAL: Record<string, string> = {
  dark: '5AMGCSRO',
  light: 'P1FUJ0KX',
  system: '1KGL5KHI',
}

export function SiteHeader() {
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
          <nav className="flex items-center">
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <motion.div
          className="hidden text-2xl font-bold leading-6 sm:inline-block"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          FlyDex
        </motion.div>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {['Leaderboard', 'Mods', 'Traits', 'Trending'].map((to) => (
          <NavLink key={to} prefetch="intent" to={`/${to.toLowerCase()}`}>
            {({ isActive }) => (
              <motion.div
                className={cn(
                  'text-sm text-pink-500 transition-colors hover:text-pink-500/80',
                  { underline: isActive },
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {to}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

const CommandLoading = forwardRef<HTMLDivElement, CommandLoadingProps>(
  ({ progress, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className="py-6 text-center text-sm"
        cmdk-loading=""
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Loading..."
      >
        <div aria-hidden>{children}</div>
      </div>
    )
  },
)

CommandLoading.displayName = 'CommandLoading'

const CommandEmpty = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CommandEmpty(props, ref) {
  const hasResults = useCommandState((state) => state.filtered.count > 0)

  return hasResults ? null : (
    <div
      ref={ref}
      {...props}
      className="py-6 text-center text-sm"
      cmdk-empty=""
      role="presentation"
    />
  )
})

CommandEmpty.displayName = 'CommandEmpty'

function CommandMenu() {
  const navigate = useNavigate()
  const navigationState = useNavigationState()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [, , setTheme] = useTheme()

  const flies = useFetcher<typeof flyLoader>()
  const tags = useFetcher<typeof tagLoader>()
  const wallets = useFetcher<typeof walletLoader>()

  const [debouncedSearch] = useDebounce(search, 500)
  const isLoading = useSpinDelay(
    navigationState === 'loading' || debouncedSearch !== search,
    { delay: 100, minDuration: 500 },
  )

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  useEffect(() => {
    function wasKPressed(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', wasKPressed)

    return () => document.removeEventListener('keydown', wasKPressed)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80',
        )}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex">Search everything...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search BattleFlies, Treasure Tags, etc..."
          onValueChange={(query) => {
            setSearch(query)

            flies.submit({ query }, { action: '/resources/battleflies' })
            tags.submit({ query }, { action: '/resources/treasure-tags' })
            wallets.submit({ query }, { action: '/resources/wallets' })
          }}
          value={search}
        />
        <CommandList>
          {isLoading ? (
            <CommandLoading>Fetching results...</CommandLoading>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          <CommandGroup heading="Links">
            {['Home', 'Leaderboard', 'Mods', 'Traits', 'Trending'].map((to) => (
              <CommandItem
                key={to}
                value={to.toLowerCase()}
                onSelect={() => {
                  runCommand(() => navigate(`/${to.replace('Home', '')}`))
                }}
              >
                <Icon className="mr-2" name="file" />
                {to}
              </CommandItem>
            ))}
          </CommandGroup>
          {flies.data && !isLoading ? (
            <>
              <CommandSeparator />
              <CommandGetBattleflies
                data={flies.data}
                runCommand={runCommand}
              />
            </>
          ) : null}
          {tags.data && !isLoading ? (
            <>
              <CommandSeparator />
              <CommandGetTreasureTags
                data={tags.data}
                runCommand={runCommand}
              />
            </>
          ) : null}
          {wallets.data && !isLoading ? (
            <>
              <CommandSeparator />
              <CommandGetWallets data={wallets.data} runCommand={runCommand} />
            </>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Icon className="mr-2" name="sun" />
              Light
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Icon className="mr-2" name="moon" />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Icon className="mr-2" name="laptop" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

function ThemeToggle() {
  const [, theme, setTheme] = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <button className="inline-flex h-9 items-center justify-center rounded-md px-2 transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-90 radix-state-open:bg-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:radix-state-open:bg-gray-800">
          <Icon
            className="rotate-0 scale-100 text-gray-600 transition-all duration-200 hover:text-gray-700 dark:-rotate-90 dark:scale-0"
            name="sun"
            size="md"
          />
          <Icon
            className="absolute rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100 dark:text-gray-400"
            name="moon"
            size="md"
          />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className="min-w-max" sideOffset={3}>
        <DropdownMenu.RadioGroup
          onValueChange={(value) => {
            setTheme(value as typeof theme)
          }}
          value={theme}
        >
          <DropdownMenu.RadioItem value="light">
            <Icon className="mr-2" name="sun" />
            <span>Light</span>
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="dark">
            <Icon className="mr-2" name="moon" />
            <span>Dark</span>
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem value="system">
            <Icon className="mr-2" name="laptop" />
            <span>System</span>
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
