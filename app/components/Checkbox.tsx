import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { IconCheck } from '@tabler/icons-react'

import Icon from './Icon'

export default function Checkbox({
  label,
  ...props
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean | 'indeterminate') => void
}) {
  const id = label.toLowerCase().split(' ').join('')

  return (
    <div className="flex items-center">
      <RadixCheckbox.Root
        className="flex h-5 w-5 appearance-none items-center justify-center rounded border border-gray-400 outline-none transition duration-200 hover:bg-pink-50 dark:border-gray-800 dark:hover:bg-pink-700"
        id={id}
        {...props}
      >
        <RadixCheckbox.Indicator className="text-pink-500">
          <Icon className="h-4 w-4" icon={IconCheck} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <label
        className="pl-3 text-sm leading-none text-gray-600 dark:text-gray-300"
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  )
}
