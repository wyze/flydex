import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from '@remix-run/react'
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Table as TanStackTable,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import queryString from 'query-string'
import { useEffect, useRef, useState } from 'react'

import { Pagination } from '~/components/pagination'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { Separator } from '~/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { usePagination } from '~/hooks/use-pagination'
import { cn } from '~/lib/helpers'

import { Icon } from './icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

type FilterOption = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect?: (values: string[]) => void
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  facet?: string
  title?: string
  options: FilterOption[]
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterableColumns?: {
    id: keyof TData
    title: string
    options: FilterOption[]
  }[]
  searchableColumns?: {
    id: keyof TData
    title: string
  }[]
  total: number
}

interface MobileFilterProps<TData> {
  table: TanStackTable<TData>
  filterableColumns: DataTableProps<TData, unknown>['filterableColumns']
}

interface FilterCommandGroupProps<TData, TValue> {
  column?: Column<TData, TValue>
  facet?: string
  options: FilterOption[]
  selected: Set<string>
}

const PAGE_SIZE = 30

export function DataTable<TData, TValue>({
  columns,
  data,
  filterableColumns,
  searchableColumns,
  total,
}: DataTableProps<TData, TValue>) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    function initial() {
      const parsed = queryString.parse(search)
      const where = JSON.parse(
        typeof parsed?.where === 'string' ? parsed.where : '{}',
      ) as { category?: { _in: string[] }; type?: { _in: string[] } }

      return Object.entries(where).map(([id, { _in }]) => ({ id, value: _in }))
    },
  )
  const [sorting, setSorting] = useState<SortingState>(function initial() {
    const parsed = queryString.parse(search)
    const where = JSON.parse(
      typeof parsed?.order_by === 'string' ? parsed.order_by : '{}',
    ) as { equipped?: 'asc' | 'desc'; inventory?: 'asc' | 'desc' }

    return Object.entries(where).map(([id, order]) => ({
      id,
      desc: order === 'desc',
    }))
  })

  useEffect(() => {
    const parsed = queryString.parse(search)
    const orderBy =
      typeof parsed.order_by === 'string'
        ? (JSON.parse(parsed.order_by) as Record<string, 'asc' | 'desc'>)
        : {}
    const [order] = sorting

    if (
      order?.id === Object.keys(orderBy).at(0) &&
      order?.desc === (Object.values(orderBy).at(0) === 'desc')
    ) {
      // State is current, no need to navigate
      return
    }

    navigate({
      pathname,
      search: queryString.stringify(
        {
          ...parsed,
          order_by: order
            ? JSON.stringify({
                [order.id]: order.desc ? 'desc' : 'asc',
              })
            : '',
        },
        { skipEmptyString: true },
      ),
    })
  }, [navigate, pathname, search, sorting])

  const [params] = useSearchParams()
  const page = Number(params.get('offset') ?? '0') / PAGE_SIZE + 1
  const pagination = usePagination(total, { page, size: PAGE_SIZE })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFilteredRowModel: getFilteredRowModel(),
    manualFiltering: true,
    manualSorting: true,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility: { unit_type: false },
      sorting,
    },
  })

  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="-mx-1 w-full space-y-4 overflow-auto px-1 py-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {searchableColumns?.map(
            (column) =>
              table.getColumn(column.id ? String(column.id) : '') && (
                <Input
                  key={String(column.id)}
                  placeholder={`Filter ${column.title}...`}
                  value={
                    (table
                      .getColumn(String(column.id))
                      ?.getFilterValue() as string) ?? ''
                  }
                  onChange={(event) => {
                    const key = String(column.id)

                    table.getColumn(key)?.setFilterValue(event.target.value)

                    const parsed = queryString.parse(location.search)
                    const where = JSON.parse(
                      typeof parsed?.where === 'string' ? parsed.where : '{}',
                    )
                    const search = queryString.stringify(
                      {
                        where: JSON.stringify({
                          ...where,
                          ...(event.target.value.length > 0
                            ? { [key]: { _iregex: event.target.value } }
                            : { [key]: undefined }),
                        }).replace('{}', ''),
                      },
                      { skipEmptyString: true },
                    )

                    navigate({ pathname, search })
                  }}
                  className="h-8 w-[150px] lg:w-[250px]"
                />
              ),
          ) ?? null}
          <div className="hidden space-x-2 md:block">
            {filterableColumns?.map((column) =>
              table.getColumn(column.id ? String(column.id) : '') ? (
                <DataTableFacetedFilter
                  key={String(column.id)}
                  column={table.getColumn(column.id ? String(column.id) : '')}
                  title={column.title}
                  options={column.options}
                />
              ) : null,
            ) ?? null}
          </div>
          <MobileFilters {...{ filterableColumns, table }} />
          {isFiltered ? (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters()

                navigate({ pathname, search: '' })
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Icon className="ml-2" name="x" />
            </Button>
          ) : null}
        </div>
        <div className="hidden lg:flex">
          <Pagination button={ParamsLink} showing={false} {...pagination} />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination button={ParamsLink} {...pagination} />
    </div>
  )
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  facet,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set(column?.getFilterValue() as string[])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Icon className="mr-2 h-4 w-4" name="plus-circle" />
          {title}
          {selectedValues.size > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <FilterCommandGroup
              {...{ column, facet, options }}
              selected={selectedValues}
            />
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ParamsLink({
  children,
  offset = 0,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode
  offset?: number
}) {
  const [params] = useSearchParams()
  const where = params.get('where') ?? ''
  const search = queryString.stringify(
    { offset: offset ? offset : undefined, where },
    { skipEmptyString: true },
  )

  return (
    <Link preventScrollReset to={{ search }} {...props}>
      {children}
    </Link>
  )
}

export function MobileFilters<TData>({
  filterableColumns,
  table,
}: MobileFilterProps<TData>) {
  const filters = table.getState().columnFilters
  const [selected, setSelected] = useState<string | null>(null)
  const selectedFilter =
    filterableColumns?.find((column) => column.id === selected) ?? null

  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="block md:hidden">
      <Popover
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null)
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Icon className="mr-2 h-4 w-4" name="plus-circle" />
            Filters
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge
              variant="secondary"
              className="rounded-sm px-1 font-normal lg:hidden"
            >
              {table.getState().columnFilters.length}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder={selectedFilter?.title ?? 'Filters'}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              {selected ? (
                <FilterCommandGroup
                  column={table.getColumn(selected)}
                  options={selectedFilter?.options ?? []}
                  selected={
                    new Set(
                      (table
                        .getColumn(selected)
                        ?.getFilterValue() as string[]) ?? [],
                    )
                  }
                />
              ) : (
                <CommandGroup>
                  {filterableColumns?.map((option) => {
                    return (
                      <CommandItem
                        key={String(option.id)}
                        onSelect={() => {
                          setSelected(String(option.id))

                          inputRef.current?.focus()
                        }}
                      >
                        <span>{option.title}</span>
                        <Badge
                          variant="outline"
                          className="ml-auto rounded-sm px-1 font-normal tracking-widest"
                        >
                          {(
                            filters.find(
                              (filter) => filter.id === option.id,
                            ) as { value: string[] } | undefined
                          )?.value.length ?? 0}
                          /{option.options.length}
                        </Badge>
                      </CommandItem>
                    )
                  }) ?? null}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function FilterCommandGroup<TData, TValue>({
  column,
  facet,
  options,
  selected,
}: FilterCommandGroupProps<TData, TValue>) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <>
      <CommandGroup>
        {options.map((option) => {
          const isSelected = selected.has(option.value)

          return (
            <CommandItem
              key={option.value}
              onSelect={() => {
                if (isSelected) {
                  selected.delete(option.value)
                } else {
                  selected.add(option.value)
                }

                const filterValues = Array.from(selected)

                column?.setFilterValue(
                  filterValues.length ? filterValues : undefined,
                )

                const defaultOnSelect = () => {
                  const parsed = queryString.parse(location.search)
                  const where = JSON.parse(
                    typeof parsed?.where === 'string' ? parsed.where : '{}',
                  ) as { type?: { _in: string[] } }
                  const key = column?.id ?? facet ?? ''
                  const search = queryString.stringify(
                    {
                      where: JSON.stringify({
                        ...where,
                        ...(filterValues.length > 0
                          ? { [key]: { _in: filterValues } }
                          : { [key]: undefined }),
                      }).replace('{}', ''),
                    },
                    { skipEmptyString: true },
                  )

                  navigate({ pathname, search })
                }

                option.onSelect?.(filterValues) ?? defaultOnSelect()
              }}
            >
              <div
                className={cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )}
              >
                <Icon aria-hidden="true" className="h-4 w-4" name="check" />
              </div>
              {option.icon ? (
                <option.icon
                  className="mr-2 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
              <span>{option.label}</span>
            </CommandItem>
          )
        })}
      </CommandGroup>
      {selected.size > 0 ? (
        <>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                column?.setFilterValue(undefined)

                const parsed = queryString.parse(location.search)
                const where = JSON.parse(
                  typeof parsed?.where === 'string' ? parsed.where : '{}',
                ) as { type?: { _in: string[] } }
                const key = column?.id ?? ''
                const search = queryString.stringify(
                  {
                    where: JSON.stringify({
                      ...where,
                      [key]: undefined,
                    }).replace('{}', ''),
                  },
                  { skipEmptyString: true },
                )

                navigate({ pathname, search })
              }}
              className="justify-center text-center"
            >
              Clear filters
            </CommandItem>
          </CommandGroup>
        </>
      ) : null}
    </>
  )
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: React.HTMLAttributes<HTMLDivElement> & {
  column: Column<TData, TValue>
  title: string
}) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  const sorted = column.getIsSorted()
  const type = column.columnDef.sortingFn === 'basic' ? 'number' : 'string'
  const icon = sorted
    ? sorted === 'asc'
      ? type === 'number'
        ? 'arrow-up-0-1'
        : 'arrow-up-a-z'
      : type === 'number'
      ? 'arrow-down-1-0'
      : 'arrow-down-z-a'
    : 'arrow-down-up'

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={
              sorted === 'desc'
                ? 'Sorted descending.'
                : sorted === 'asc'
                ? 'Sorted ascending.'
                : 'Not sorted.'
            }
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
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
          <DropdownMenuItem
            aria-label="Sort ascending"
            onClick={() => column.toggleSorting(false)}
          >
            <Icon
              className="mr-2 text-muted-foreground/80"
              aria-hidden="true"
              name={type === 'number' ? 'arrow-up-0-1' : 'arrow-up-a-z'}
              size="sm"
            />
            Sort ascending
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-label="Sort descending"
            onClick={() => column.toggleSorting(true)}
          >
            <Icon
              className="mr-2 text-muted-foreground/80"
              aria-hidden="true"
              name={type === 'number' ? 'arrow-down-1-0' : 'arrow-down-z-a'}
              size="sm"
            />
            Sort descending
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-label="Remove sort"
            onClick={() => column.clearSorting()}
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
