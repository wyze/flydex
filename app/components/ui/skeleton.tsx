import { cn } from "~/lib/helpers"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted dark:bg-muted-foreground", className)}
      {...props}
    />
  )
}

export { Skeleton }
