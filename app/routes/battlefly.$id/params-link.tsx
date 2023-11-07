import { Link, useSearchParams } from '@remix-run/react'
import queryString from 'query-string'

export function ParamsLink({
  children,
  offset = 0,
  param,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode
  offset?: number
  param: string
}) {
  const [params] = useSearchParams()
  const search = queryString.stringify(
    Array.from(params.entries()).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (key !== param) {
          acc[key] = value
        }

        return acc
      },
      { [param]: offset ? offset : undefined },
    ),
    { skipEmptyString: true },
  )

  return (
    <Link preventScrollReset prefetch="intent" to={{ search }} {...props}>
      {children}
    </Link>
  )
}
