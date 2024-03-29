import * as RadixPopover from '@radix-ui/react-popover'
import { forwardRef } from 'react'

import { Icon } from './icon'

type ChildrenProps = {
  children: React.ReactNode
}

export function Popover({ children }: ChildrenProps) {
  return <RadixPopover.Root>{children}</RadixPopover.Root>
}

Popover.Trigger = function PopoverTrigger(
  props: ChildrenProps & { className?: string },
) {
  return <RadixPopover.Trigger asChild {...props} />
}

Popover.Content = forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  React.ComponentPropsWithoutRef<typeof RadixPopover.Content>
>(function PopoverContent(
  { children, className, align = 'center', sideOffset = 4, ...props },
  ref,
) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={`${
          className ?? 'w-[260px]'
        } data-[state=open]:data-[side=bottom]:animate-slideUpAndFade data-[state=open]:data-[side=left]:animate-slideRightAndFade data-[state=open]:data-[side=right]:animate-slideLeftAndFade data-[state=open]:data-[side=top]:animate-slideDownAndFade rounded bg-white p-5 shadow-[0_10px_38px_-10px_hsla(206,22%,7%,.35),0_10px_20px_-15px_hsla(206,22%,7%,.2)] will-change-[transform,opacity] dark:bg-gray-700 dark:text-gray-200`}
        {...props}
      >
        {children}
        <RadixPopover.Close
          className="absolute right-2 top-2 inline-flex h-6 w-6 cursor-default items-center justify-center rounded-full text-pink-500 outline-none transition duration-200 hover:bg-pink-200 focus:shadow-[0_0_0_2px] focus:shadow-pink-200 dark:text-pink-200 dark:hover:bg-pink-500 dark:focus:shadow-pink-500"
          aria-label="Close"
        >
          <Icon name="x" />
        </RadixPopover.Close>
        <RadixPopover.Arrow className="fill-white dark:fill-gray-700" />
      </RadixPopover.Content>
    </RadixPopover.Portal>
  )
})
