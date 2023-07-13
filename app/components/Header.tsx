import {
  Form,
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useRouteLoaderData,
} from '@remix-run/react'
import {
  IconArrowsSort,
  IconClock,
  IconDeviceDesktop,
  IconFilter,
  IconMoon,
  IconSun,
} from '@tabler/icons-react'
import { trackGoal } from 'fathom-client'
import { AnimatePresence, motion } from 'framer-motion'
import queryString from 'query-string'

import type { getModFilters } from '~/services/hasura.server'

import Checkbox from './Checkbox'
import DropdownMenu from './DropdownMenu'
import Icon from './Icon'
import Popover from './Popover'
import { useTheme } from './ThemeProvider'
import ToggleGroup from './ToggleGroup'
import Tooltip from './Tooltip'

const THEME_TO_GOAL: Record<string, string> = {
  dark: '5AMGCSRO',
  light: 'P1FUJ0KX',
  system: '1KGL5KHI',
}

export default function Header() {
  const [, theme, setTheme] = useTheme()
  const { pathname } = useLocation()

  return (
    <div className="bg-gray-50 px-12 text-gray-800 shadow-md shadow-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:shadow-gray-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-baseline gap-6">
          <Link to="/">
            <motion.div
              className="text-2xl font-bold leading-6"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              FlyDex
            </motion.div>
          </Link>

          <NavLink to="/leaderboard">
            {({ isActive }) => (
              <motion.div
                className={`text-sm text-pink-500 ${
                  isActive ? 'underline' : ''
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Leaderboard
              </motion.div>
            )}
          </NavLink>

          <NavLink to="/mods">
            {({ isActive }) => (
              <motion.div
                className={`text-sm text-pink-500 ${
                  isActive ? 'underline' : ''
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Mods
              </motion.div>
            )}
          </NavLink>
        </div>

        <Form action="/?index" method="post" className="flex basis-1/2 gap-2">
          <input
            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900"
            name="query"
            placeholder="Search by wallet, treasure tag, or token id"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-pink-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-gray-600 dark:focus:ring-offset-gray-900"
          >
            Search
          </button>
        </Form>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait" initial={false}>
            {['/', '/mods'].includes(pathname) ? (
              <FilterAndSort />
            ) : (
              <motion.div key="placeholder" className="w-[5.5rem]" />
            )}
          </AnimatePresence>
          <UpdatedAt />
          <DropdownMenu>
            <DropdownMenu.Trigger>
              <button className="inline-flex h-9 items-center justify-center rounded-md px-2 text-sm transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-90 radix-state-open:bg-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:radix-state-open:bg-gray-800">
                <Icon
                  className="rotate-0 scale-100 text-gray-600 transition-all duration-200 hover:text-gray-700 dark:-rotate-90 dark:scale-0"
                  icon={IconSun}
                />
                <Icon
                  className="absolute rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100 dark:text-gray-400"
                  icon={IconMoon}
                />
                <span className="sr-only">Toggle theme</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="min-w-max" sideOffset={3}>
              <DropdownMenu.RadioGroup
                onValueChange={(value) => {
                  trackGoal(THEME_TO_GOAL[value], 0)
                  setTheme(value as typeof theme)
                }}
                value={theme}
              >
                <DropdownMenu.RadioItem value="light">
                  <Icon className="mr-2 h-4 w-4" icon={IconSun} />
                  <span>Light</span>
                </DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="dark">
                  <Icon className="mr-2 h-4 w-4" icon={IconMoon} />
                  <span>Dark</span>
                </DropdownMenu.RadioItem>
                <DropdownMenu.RadioItem value="system">
                  <Icon className="mr-2 h-4 w-4" icon={IconDeviceDesktop} />
                  <span>System</span>
                </DropdownMenu.RadioItem>
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function FilterSection({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div>
      <div className="pb-1 pl-8 text-xs leading-6 text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FilterAndSort() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const parsed = queryString.parse(search)
  const where = JSON.parse(
    typeof parsed?.where === 'string' ? parsed.where : '{}',
  ) as { location?: { _in: string[] }; rarity: { _in: string[] } }
  const locations = where?.location?._in ?? []
  const sort =
    Object.entries(
      JSON.parse(typeof parsed?.order_by === 'string' ? parsed.order_by : '{}'),
    )
      .map(([key, value]) => `${key}:${value}`)
      .at(0) ?? ''

  const {
    filters: { mods },
  } = useRouteLoaderData('root') as {
    filters: { mods: Awaited<ReturnType<typeof getModFilters>> }
  }

  const isHome = pathname === '/'
  const isMods = pathname === '/mods'

  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Popover>
        <Popover.Trigger>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-pink-500 shadow-[0_2px_10px] shadow-gray-400 outline-none transition duration-200 hover:bg-pink-200 focus:shadow-[0_0_0_2px] focus:shadow-slate-600 dark:bg-gray-700 dark:shadow-gray-600"
            aria-label={`Filter ${isHome ? 'battleflies' : 'mods'}`}
          >
            <Icon className="h-4 w-4" icon={IconFilter} />
          </button>
        </Popover.Trigger>
        <Popover.Content className="grid grid-cols-3 gap-6">
          {isHome ? (
            <FilterSection label="Location">
              {['hyperdome', 'mission_control', 'proving_grounds'].map(
                (value) => {
                  const checked = locations.includes(value)

                  return (
                    <Checkbox
                      key={value}
                      checked={checked}
                      label={value
                        .split('_')
                        .map(([first, ...rest]) =>
                          first.toUpperCase().concat(...rest),
                        )
                        .join(' ')}
                      onCheckedChange={() => {
                        const updates = checked
                          ? locations.filter((item) => item !== value)
                          : locations.concat(value)

                        const search = queryString.stringify(
                          {
                            where: JSON.stringify({
                              ...where,
                              ...(updates.length > 0
                                ? { location: { _in: updates } }
                                : { location: undefined }),
                            }).replace('{}', ''),
                          },
                          { skipEmptyString: true },
                        )

                        navigate({ pathname: '/', search })
                      }}
                    />
                  )
                },
              )}
            </FilterSection>
          ) : null}
          {isMods ? (
            <FilterSection label="Category">
              {mods.categories
                .map((mod) => mod.category)
                .map((value) => {
                  const parsed = queryString.parse(search)
                  const where = JSON.parse(
                    typeof parsed?.where === 'string' ? parsed.where : '{}',
                  ) as { category?: { _in: string[] } }
                  const _in = where?.category?._in ?? []
                  const checked = _in.includes(value)

                  return (
                    <Checkbox
                      key={value}
                      checked={checked}
                      label={value}
                      onCheckedChange={() => {
                        const updates = checked
                          ? _in.filter((item) => item !== value)
                          : _in.concat(value)
                        const search = queryString.stringify(
                          {
                            where: JSON.stringify({
                              ...where,
                              ...(updates.length > 0
                                ? { category: { _in: updates } }
                                : { category: undefined }),
                            }).replace('{}', ''),
                          },
                          { skipEmptyString: true },
                        )

                        navigate({ pathname, search })
                      }}
                    />
                  )
                })}
            </FilterSection>
          ) : null}
          <FilterSection label="Rarity">
            {[
              isHome ? 'Artefact' : '',
              'Legendary',
              'Epic',
              'Rare',
              'Uncommon',
              'Common',
              isMods ? 'Core' : '',
            ]
              .filter(Boolean)
              .map((value) => {
                const parsed = queryString.parse(search)
                const where = JSON.parse(
                  typeof parsed?.where === 'string' ? parsed.where : '{}',
                ) as { rarity?: { _in: string[] } }
                const _in = where?.rarity?._in ?? []
                const checked = _in.includes(value)

                return (
                  <Checkbox
                    key={value}
                    checked={checked}
                    label={value}
                    onCheckedChange={() => {
                      const updates = checked
                        ? _in.filter((item) => item !== value)
                        : _in.concat(value)
                      const search = queryString.stringify(
                        {
                          where: JSON.stringify({
                            ...where,
                            ...(updates.length > 0
                              ? { rarity: { _in: updates } }
                              : { rarity: undefined }),
                          }).replace('{}', ''),
                        },
                        { skipEmptyString: true },
                      )

                      navigate({ pathname, search })
                    }}
                  />
                )
              })}
          </FilterSection>
          {isMods ? (
            <FilterSection label="Type">
              {mods.types
                .map((mod) => mod.type)
                .map((value) => {
                  const parsed = queryString.parse(search)
                  const where = JSON.parse(
                    typeof parsed?.where === 'string' ? parsed.where : '{}',
                  ) as { type?: { _in: string[] } }
                  const _in = where?.type?._in ?? []
                  const checked = _in.includes(value)

                  return (
                    <Checkbox
                      key={value}
                      checked={checked}
                      label={value}
                      onCheckedChange={() => {
                        const updates = checked
                          ? _in.filter((item) => item !== value)
                          : _in.concat(value)
                        const search = queryString.stringify(
                          {
                            where: JSON.stringify({
                              ...where,
                              ...(updates.length > 0
                                ? { type: { _in: updates } }
                                : { type: undefined }),
                            }).replace('{}', ''),
                          },
                          { skipEmptyString: true },
                        )

                        navigate({ pathname, search })
                      }}
                    />
                  )
                })}
            </FilterSection>
          ) : null}
          {isHome ? (
            <FilterSection label="League">
              {['Larvae', 'Pupa', 'Monarch', 'Predator', 'Apex'].flatMap(
                (leagueName) => {
                  const parsed = queryString.parse(search)
                  const where = JSON.parse(
                    typeof parsed?.where === 'string' ? parsed.where : '{}',
                  ) as Partial<{
                    league_full: { _in: string[] }
                  }>
                  const [rest, leagueFull] = (
                    where?.league_full?._in ?? []
                  ).reduce(
                    (acc, item) => {
                      const count = item.startsWith(leagueName)

                      acc[Number(count)].push(item)

                      return acc
                    },
                    [[], []] as [string[], string[]],
                  )
                  const checked = leagueFull.length > 0

                  return (
                    <div
                      key={leagueName}
                      className="flex w-48 items-center justify-between"
                    >
                      <Checkbox
                        checked={checked}
                        label={leagueName}
                        onCheckedChange={() => {
                          const updates = checked
                            ? leagueFull.filter(
                                (item) => !item.startsWith(leagueName),
                              )
                            : rest.concat(
                                [1, 2, 3].map(
                                  (item) => `${leagueName} ${item}`,
                                ),
                              )
                          const search = queryString.stringify(
                            {
                              where: JSON.stringify({
                                ...where,
                                ...(updates.length > 0
                                  ? { league_full: { _in: updates } }
                                  : { league_full: undefined }),
                              }).replace('{}', ''),
                            },
                            { skipEmptyString: true },
                          )

                          navigate({ pathname: '/', search })
                        }}
                      />
                      <AnimatePresence>
                        {checked ? (
                          <ToggleGroup
                            className="ml-8"
                            label={leagueName}
                            type="multiple"
                            onValueChange={(value) => {
                              const updates = value
                                .map((tier) => `${leagueName} ${tier}`)
                                .concat(rest)
                              const search = queryString.stringify(
                                {
                                  where: JSON.stringify({
                                    ...where,
                                    ...(updates.length > 0
                                      ? { league_full: { _in: updates } }
                                      : { league_full: undefined }),
                                  }).replace('{}', ''),
                                },
                                { skipEmptyString: true },
                              )

                              navigate({ pathname: '/', search })
                            }}
                            value={leagueFull.map((item) => item.slice(-1))}
                          >
                            {[1, 2, 3].map((tier) => (
                              <ToggleGroup.Item
                                key={tier}
                                label={`${leagueName} ${tier}`}
                                value={`${tier}`}
                              >
                                {Array(tier).fill('I').join('')}
                              </ToggleGroup.Item>
                            ))}
                          </ToggleGroup>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )
                },
              )}
            </FilterSection>
          ) : null}
        </Popover.Content>
      </Popover>

      {isHome ? (
        <DropdownMenu>
          <DropdownMenu.Trigger>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-pink-500 shadow-[0_2px_10px] shadow-slate-400 outline-none transition duration-200 hover:bg-pink-200 focus:shadow-[0_0_0_2px] focus:shadow-slate-600 dark:bg-gray-700 dark:shadow-gray-600"
              aria-label="Sort battleflies"
            >
              <Icon className="h-4 w-4" icon={IconArrowsSort} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="min-w-[120px]">
            <DropdownMenu.RadioGroup
              value={sort}
              onValueChange={(value) => {
                const parsed = queryString.parse(location.search)
                const orderBy = Object.entries(
                  JSON.parse(
                    typeof parsed?.order_by === 'string'
                      ? parsed.order_by
                      : '{}',
                  ) as Partial<Record<string, 'asc' | 'desc'>>,
                )
                  .at(0)
                  ?.join(':')
                const search = queryString.stringify(
                  {
                    order_by:
                      orderBy === value
                        ? ''
                        : JSON.stringify(
                            Object.fromEntries([value.split(':')]),
                          ),
                    where: JSON.stringify(where).replace('{}', ''),
                  },
                  { skipEmptyString: true },
                )

                navigate({ pathname: '/', search })
              }}
            >
              {[
                'contest_points:asc',
                'contest_points:desc',
                'rank:asc_nulls_last',
                'rank:desc_nulls_last',
                'wl_ratio_24h:asc_nulls_last',
                'wl_ratio_24h:desc_nulls_last',
              ].map((value) => {
                const [label, direction] = value.split(':')

                return (
                  <DropdownMenu.RadioItem key={value} value={value}>
                    <>
                      {direction.includes('asc')
                        ? 'Lowest to Highest '
                        : 'Highest to Lowest '}
                      {label
                        .split('_')
                        .map(([first, ...rest]) =>
                          first
                            .toUpperCase()
                            .concat(...rest)
                            .replace('Wl', 'W/L'),
                        )
                        .join(' ')}{' '}
                    </>
                  </DropdownMenu.RadioItem>
                )
              })}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu>
      ) : null}
    </motion.div>
  )
}

function UpdatedAt() {
  const { pathname } = useLocation()
  const { updatedAt } = (useRouteLoaderData(
    pathname === '/' ? 'routes/_index' : 'routes/battlefly.$id',
  ) ?? {}) as { updatedAt: string }

  if (pathname.includes('leaderboard')) {
    return null
  }

  return (
    <>
      <Tooltip>
        <Tooltip.Trigger className="hidden md:block">
          <div className="pl-2 text-gray-400 transition duration-200 hover:text-gray-500">
            <Icon icon={IconClock} />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <span className="text-sm">{updatedAt}</span>
        </Tooltip.Content>
      </Tooltip>
      <Popover>
        <Popover.Trigger className="md:hidden">
          <div className="pl-2 text-gray-400 transition duration-200 hover:text-gray-500">
            <Icon icon={IconClock} />
          </div>
        </Popover.Trigger>
        <Popover.Content>
          <span className="text-sm">{updatedAt}</span>
        </Popover.Content>
      </Popover>
    </>
  )
}
