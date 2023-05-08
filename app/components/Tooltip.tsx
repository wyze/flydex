import * as RadixTooltip from '@radix-ui/react-tooltip'

type ChildrenProps = {
  children: React.ReactNode
}

export default function Tooltip({ children }: ChildrenProps) {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>{children}</RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

Tooltip.Trigger = function TooltipTrigger(
  props: ChildrenProps & { className?: string }
) {
  return <RadixTooltip.Trigger asChild {...props} />
}

Tooltip.Content = function TooltipContent({ children }: ChildrenProps) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        className="select-none rounded bg-white px-4 py-3 leading-none shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] will-change-[transform,opacity] data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade dark:bg-gray-700 dark:text-gray-200"
        sideOffset={5}
      >
        {children}
        <RadixTooltip.Arrow className="fill-white dark:fill-gray-700" />
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  )
}
