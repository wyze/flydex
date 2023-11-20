import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

export function MobileTooltip({
  content,
  trigger,
}: {
  content: React.ReactNode
  trigger: React.ReactNode
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger className="hidden md:block">{trigger}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
      <Popover>
        <PopoverTrigger className="md:hidden">{trigger}</PopoverTrigger>
        <PopoverContent>{content}</PopoverContent>
      </Popover>
    </>
  )
}
