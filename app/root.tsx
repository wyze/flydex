import fontStyles from '@fontsource-variable/inter/index.css'
import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from '@remix-run/node'
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

import Footer from '~/components/Footer'
import Header from '~/components/Header'
import {
  ThemeBody,
  ThemeHead,
  ThemeProvider,
  useTheme,
} from '~/components/ThemeProvider'
import useFathom from '~/hooks/useFathom'
import useNProgress from '~/hooks/useNProgress'
import { getSession } from '~/lib/session.server'
import nProgressStyles from '~/styles/nprogress.css'
import styles from '~/styles/tailwind.css'

import { getModFilters } from './services/hasura.server'

export const links: LinksFunction = () =>
  [styles, nProgressStyles, fontStyles]
    .map((href) => ({ rel: 'stylesheet', href }))
    .concat([{ rel: 'shortcut icon', href: '/images/logo.png' }])

export const meta: V2_MetaFunction = () => [
  { charSet: 'utf-8' },
  { title: 'FlyDex' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1' },
]

export async function loader({ request }: LoaderArgs) {
  const [{ theme }, mods] = await Promise.all([
    getSession(request),
    getModFilters(),
  ])

  return remix.json({ filters: { mods }, theme })
}

function App() {
  const data = useLoaderData<typeof loader>()
  const [theme] = useTheme()

  useFathom()
  useNProgress()

  return (
    <html className={`h-screen scroll-smooth ${theme ?? ''}`} lang="en">
      <head>
        <Meta />
        <Links />
        <ThemeHead ssrTheme={data.theme !== 'system'} />
      </head>
      <body className="flex h-full flex-col bg-white dark:bg-gray-900">
        <ThemeBody ssrTheme={data.theme !== 'system'} />
        <Header />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
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
