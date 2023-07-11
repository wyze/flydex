import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu'
import { IconCheck, IconPointFilled } from '@tabler/icons-react'
import React from 'react'

import Icon from './Icon'

type ChildrenProps = {
  children: React.ReactNode
}

export default function DropdownMenu(
  props: ChildrenProps & { defaultOpen?: true },
) {
  return <RadixDropdownMenu.Root {...props} />
}

DropdownMenu.Trigger = function DropdownTrigger({ children }: ChildrenProps) {
  return (
    <RadixDropdownMenu.Trigger asChild>{children}</RadixDropdownMenu.Trigger>
  )
}

DropdownMenu.Content = function DropdownContent({
  children,
  className,
  sideOffset = 5,
}: ChildrenProps & { className?: string; sideOffset?: number }) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        className={`${
          className ?? 'min-w-[220px]'
        } max-h-60 rounded-md bg-white p-1 shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] will-change-[opacity,transform] data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade data-[side=right]:animate-slideLeftAndFade data-[side=top]:animate-slideDownAndFade dark:bg-gray-700`}
        sideOffset={sideOffset}
      >
        {children}
        <RadixDropdownMenu.Arrow className="fill-white dark:fill-gray-700" />
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Portal>
  )
}

DropdownMenu.Label = function DropdownLabel({ children }: ChildrenProps) {
  return (
    <RadixDropdownMenu.Label className="pl-6 text-xs leading-6 text-slate-500">
      {children}
    </RadixDropdownMenu.Label>
  )
}

DropdownMenu.Item = function DropdownItem({ children }: ChildrenProps) {
  return (
    <RadixDropdownMenu.Item className="group relative flex h-6 select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none text-pink-500 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-pink-400 data-[disabled]:text-slate-400 data-[highlighted]:text-pink-50">
      {children}
    </RadixDropdownMenu.Item>
  )
}

DropdownMenu.Separator = function DropdownSeparator() {
  return <RadixDropdownMenu.Separator className="m-1 h-px bg-pink-100" />
}

DropdownMenu.CheckboxItem = function DropdownCheckboxItem({
  children,
  ...props
}: ChildrenProps & {
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <RadixDropdownMenu.CheckboxItem
      className="group relative flex h-6 select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none text-pink-500 outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-pink-400 data-[disabled]:text-slate-400 data-[highlighted]:text-pink-50"
      {...props}
    >
      <RadixDropdownMenu.ItemIndicator className="absolute left-0 inline-flex w-6 items-center justify-center">
        <Icon className="h-4 w-4" icon={IconCheck} />
      </RadixDropdownMenu.ItemIndicator>
      {children}
    </RadixDropdownMenu.CheckboxItem>
  )
}

DropdownMenu.RadioGroup = RadixDropdownMenu.RadioGroup

DropdownMenu.RadioItem = function DropdownRadioItem({
  children,
  ...props
}: ChildrenProps & { asChild?: boolean; value: string }) {
  return (
    <RadixDropdownMenu.RadioItem
      className="group relative flex h-6 select-none items-center rounded-[3px] px-[5px] pl-[25px] text-[13px] leading-none text-pink-500 outline-none transition duration-200 data-[disabled]:pointer-events-none data-[highlighted]:bg-pink-400 data-[disabled]:text-slate-400 data-[highlighted]:text-pink-50"
      {...props}
    >
      <RadixDropdownMenu.ItemIndicator className="absolute left-0 inline-flex w-6 items-center justify-center">
        <Icon className="h-4 w-4" icon={IconPointFilled} />
      </RadixDropdownMenu.ItemIndicator>
      {children}
    </RadixDropdownMenu.RadioItem>
  )
}
