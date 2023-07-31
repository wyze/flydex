export function Pill({
  as: Component = 'span',
  children,
}: {
  as?: 'li' | 'span'
  children: React.ReactNode
}) {
  return (
    <Component className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800 dark:bg-gray-600 dark:text-slate-200">
      {children}
    </Component>
  )
}
