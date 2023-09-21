import fontStyles from '@fontsource-variable/inter/index.css'
import type { LinksFunction } from '@remix-run/node'
import * as remix from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'

import { Footer } from '~/components/footer'
import { SiteHeader } from '~/components/site-header'
import { TailwindIndicator } from '~/components/tailwind-indicator'
import {
  ThemeBody,
  ThemeHead,
  ThemeProvider,
  useTheme,
} from '~/components/theme-provider'
import { Toaster } from '~/components/ui/toaster'
import { useFathom } from '~/hooks/use-fathom'
import { useNProgress } from '~/hooks/use-n-progress'
import { NODE_ENV } from '~/lib/env.server'
import { getSession } from '~/lib/session.server'
import nProgressStyles from '~/styles/nprogress.css'
import styles from '~/styles/tailwind.css'

export const links: LinksFunction = () =>
  [styles, nProgressStyles, fontStyles]
    .map((href) => ({ rel: 'stylesheet', href }))
    .concat([{ rel: 'shortcut icon', href: '/images/logo.png' }])

export const meta: remix.MetaFunction = () => [
  { charSet: 'utf-8' },
  { title: 'FlyDex' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1' },
]

export async function loader({ request }: remix.DataFunctionArgs) {
  const { theme } = await getSession(request)

  return remix.json({ env: { NODE_ENV }, theme })
}

function App() {
  const data = useLoaderData<typeof loader>()
  const [theme] = useTheme()

  useFathom()
  useNProgress()

  return (
    <html className={`min-h-screen scroll-smooth ${theme ?? ''}`} lang="en">
      <head>
        <Meta />
        <Links />
        <ThemeHead ssrTheme={data.theme !== 'system'} />
      </head>
      <body className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
        <ThemeBody ssrTheme={data.theme !== 'system'} />
        <SiteHeader />
        <Outlet />
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        {data.env.NODE_ENV === 'development' ? <TailwindIndicator /> : null}
        <Footer />
      </body>
    </html>
  )
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>()

  return (
    <ThemeProvider specifiedTheme={data.theme}>
      <App />
    </ThemeProvider>
  )
}
