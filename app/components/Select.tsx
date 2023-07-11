import * as RadixSelect from '@radix-ui/react-select'
import { IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react'

import Icon from './Icon'

type ChildrenProps = {
  children: React.ReactNode
}

export default function Select(
  props: ChildrenProps & {
    onValueChange: (value: string) => void
    value: string
  },
) {
  return <RadixSelect.Root {...props} />
}

Select.Trigger = function SelectTrigger({
  label,
  placeholder,
}: {
  label: string
  placeholder: string
}) {
  return (
    <RadixSelect.Trigger
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded bg-white px-4 text-xs leading-none text-pink-500 shadow-[0_2px_10px] shadow-black/10 outline-none transition duration-200 hover:bg-pink-50 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-pink-400 dark:bg-gray-800"
      aria-label={label}
    >
      <RadixSelect.Value placeholder={placeholder} />
      <RadixSelect.Icon className="text-pink-500">
        <Icon className="h-4 w-4" icon={IconChevronDown} />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  )
}

Select.Content = function SelectContent({ children }: ChildrenProps) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content className="overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] dark:bg-gray-700">
        <RadixSelect.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-pink-500">
          <Icon className="h-4 w-4" icon={IconChevronUp} />
        </RadixSelect.ScrollUpButton>
        <RadixSelect.Viewport className="p-1">{children}</RadixSelect.Viewport>
        <RadixSelect.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-pink-500">
          <Icon className="h-4 w-4" icon={IconChevronDown} />
        </RadixSelect.ScrollDownButton>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

Select.Group = RadixSelect.Group

Select.Label = function SelectLabel({ children }: ChildrenProps) {
  return (
    <RadixSelect.Label className="px-6 text-xs leading-6 text-slate-400">
      {children}
    </RadixSelect.Label>
  )
}

Select.Separator = RadixSelect.Separator

Select.Item = function SelectItem({
  children,
  value,
}: ChildrenProps & { value: string }) {
  return (
    <RadixSelect.Item
      className="data-[disabled]:text-mauve8 relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none text-pink-500 transition duration-200 data-[disabled]:pointer-events-none data-[highlighted]:bg-pink-400 data-[highlighted]:text-pink-50 data-[highlighted]:outline-none"
      value={value}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
        <Icon className="h-4 w-4" icon={IconCheck} />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  )
}
