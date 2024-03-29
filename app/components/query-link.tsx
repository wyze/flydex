import { Link, useSearchParams } from '@remix-run/react'
import queryString from 'query-string'

export function QueryLink({
  children,
  offset,
  where,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children: React.ReactNode
  offset?: number
  where?: { rank: { _gt: 0 } | { _eq: 0 } } | { location: { _eq: 'hyperdome' } }
}) {
  const [params] = useSearchParams()
  const existing = JSON.parse(params.get('where') ?? '{}')
  const search = queryString.stringify({
    ...(offset ? { offset } : {}),
    where: JSON.stringify({ ...existing, ...where }),
  })

  return (
    <Link prefetch="intent" to={{ pathname: '/', search }} {...props}>
      {children}
    </Link>
  )
}
