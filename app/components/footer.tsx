import { IconCell } from '@tabler/icons-react'

import { Icon } from './icon'

export function Footer() {
  return (
    <div className="flex justify-center bg-gray-50 px-12 py-4 text-gray-800 shadow-inner shadow-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:shadow-gray-900">
      Powered by
      <a
        className="ml-1 flex items-center text-purple-600 transition duration-200 hover:text-purple-500"
        href="https://honeycomb.fyi?ref=flydex"
        rel="noreferrer"
        target="_blank"
      >
        <Icon icon={IconCell} /> Honeycomb
      </a>
    </div>
  )
}
