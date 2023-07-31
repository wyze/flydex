import * as RadixTabs from '@radix-ui/react-tabs'

type ChildrenProps = {
  children: React.ReactNode
}

export function Tabs(props: ChildrenProps & { defaultValue: string }) {
  return <RadixTabs.Root className="flex w-full flex-col" {...props} />
}

Tabs.List = function TabsList({
  children,
  label,
}: ChildrenProps & { label: string }) {
  return (
    <RadixTabs.List
      className="flex shrink-0 border-b border-pink-100"
      aria-label={label}
    >
      {children}
    </RadixTabs.List>
  )
}

Tabs.Trigger = function TabsTrigger({
  className,
  ...props
}: ChildrenProps & {
  className?: string
  disabled?: boolean
  value: string
}) {
  return (
    <RadixTabs.Trigger
      className={`${className} flex h-[45px] flex-1 cursor-default select-none items-center justify-center bg-white px-5 text-[15px] leading-none text-pink-600 outline-none enabled:hover:text-pink-500 disabled:opacity-60 data-[state=active]:text-pink-500 data-[state=active]:shadow-[inset_0_-1px_0_0,0_1px_0_0] data-[state=active]:shadow-current data-[state=active]:focus:relative data-[state=active]:focus:shadow-[0_0_0_2px] data-[state=active]:focus:shadow-black dark:bg-gray-700 dark:data-[state=active]:focus:shadow-gray-300`}
      {...props}
    />
  )
}

Tabs.Content = function TabsContent(props: ChildrenProps & { value: string }) {
  return (
    <RadixTabs.Content
      className="grow rounded-b-md bg-white p-5 outline-none focus:shadow-[0_0_0_2px] focus:shadow-black dark:bg-gray-700 dark:focus:shadow-gray-300"
      {...props}
    />
  )
}
