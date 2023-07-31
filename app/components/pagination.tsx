import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import { createElement } from 'react'

import type { usePagination } from '~/hooks/use-pagination'

import { Icon } from './icon'
import { QueryLink } from './query-link'

type Button = React.FunctionComponent<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: React.ReactNode
    offset?: number
  }
>

function PageButton({
  button,
  current,
  page,
  size,
}: {
  button: Button
  current: number
  page: number
  size: number
}) {
  return createElement(button, {
    children: (
      <div
        className={clsx(
          current === page
            ? 'z-10 border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-600 dark:text-pink-50'
            : 'border-slate-300 bg-white text-slate-500 transition duration-200 hover:bg-slate-50  dark:border-gray-700 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-800',
          'relative inline-flex h-full items-center border px-3 py-1 text-sm font-medium focus:z-20',
        )}
      >
        {current}
      </div>
    ),
    offset: (current - 1) * size,
  })
}

export function Pagination({
  button = QueryLink,
  count,
  gap,
  length,
  noNextPage,
  noPreviousPage,
  page,
  pages,
  range: [start, end],
  showing,
  size,
}: ReturnType<typeof usePagination> & {
  button?: Button
  showing?: false
}) {
  return (
    <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
      {showing !== false ? (
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            {start + 1}-{end}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            {length.toLocaleString()}
          </span>
        </span>
      ) : (
        <span />
      )}
      {count > 1 ? (
        <nav
          className="isolate inline-flex h-8 -space-x-px rounded-md shadow-sm"
          aria-label="Pagination"
        >
          {createElement(button, {
            'aria-disabled': noPreviousPage,
            children: (
              <>
                {' '}
                <span className="sr-only">Previous</span>
                <Icon icon={IconChevronLeft} />
              </>
            ),
            className:
              'relative inline-flex items-center rounded-l-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-500 transition duration-200 hover:bg-slate-50 focus:z-20 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-gray-700 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-800',
            offset: (page - 2) * size,
          })}
          <PageButton current={1} {...{ button, page, size }} />
          {gap?.before ? (
            <span className="relative inline-flex items-center border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700  dark:border-gray-700 dark:bg-slate-500 dark:text-gray-200">
              ...
            </span>
          ) : null}
          {pages.map((item) => (
            <PageButton current={item} key={item} {...{ button, page, size }} />
          ))}
          {gap?.after ? (
            <span className="relative inline-flex items-center border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700  dark:border-gray-700 dark:bg-slate-500 dark:text-gray-200">
              ...
            </span>
          ) : null}
          <PageButton current={count} {...{ button, page, size }} />
          {createElement(button, {
            'aria-disabled': noNextPage,
            children: (
              <>
                <span className="sr-only">Next</span>
                <Icon icon={IconChevronRight} />
              </>
            ),
            className:
              'relative inline-flex items-center rounded-r-md border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-500 transition duration-200 hover:bg-slate-50 focus:z-20 aria-disabled:pointer-events-none aria-disabled:opacity-40 dark:border-gray-700 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-800',
            offset: page * size,
          })}
        </nav>
      ) : null}
    </div>
  )
}
