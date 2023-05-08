import * as RadixScrollArea from '@radix-ui/react-scroll-area'

export default function ScrollArea({
  children,
  className,
  orientation = 'vertical',
}: {
  children: React.ReactNode
  className: string
  orientation?: 'horizontal' | 'vertical'
}) {
  return (
    <RadixScrollArea.Root className={`${className} overflow-hidden rounded`}>
      <RadixScrollArea.Viewport className="h-full w-full rounded">
        {children}
      </RadixScrollArea.Viewport>
      <RadixScrollArea.Scrollbar
        className="flex touch-none select-none bg-slate-200 p-0.5 transition duration-200 ease-out hover:bg-slate-300 data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col"
        key={orientation}
        orientation={orientation}
      >
        <RadixScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-slate-500 before:absolute before:left-1/2 before:top-1/2 before:h-full before:min-h-[44px] before:w-full before:min-w-[44px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']" />
      </RadixScrollArea.Scrollbar>
      <RadixScrollArea.Corner className="bg-slate-200" />
    </RadixScrollArea.Root>
  )
}
