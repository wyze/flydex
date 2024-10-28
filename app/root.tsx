import '@fontsource-variable/inter/index.css'
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
import { TooltipProvider } from '~/components/ui/tooltip'
import { useNProgress } from '~/hooks/use-n-progress'
import { today } from '~/lib/date.server'
import { getSession } from '~/lib/session.server'
import '~/styles/nprogress.css'
import '~/styles/tailwind.css'

export async function loader({ request }: remix.DataFunctionArgs) {
  const { theme } = await getSession(request)

  return remix.json({ theme, today })
}

function App() {
  const data = useLoaderData<typeof loader>()
  const [theme] = useTheme()

  useNProgress()

  return (
    <html className={`min-h-screen scroll-smooth ${theme ?? ''}`} lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>FlyDex</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <ThemeHead ssrTheme={data.theme !== 'system'} />
        <link rel="icon" href="/images/logo.png" type="image/png" />
        <link
          rel="preload"
          href="https://umami.wyze.dev/script.js"
          as="script"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
        <ThemeBody ssrTheme={data.theme !== 'system'} />
        <SiteHeader />
        <Outlet />
        <Toaster />
        <ScrollRestoration />
        <LiveReload />
        <Scripts />
        {import.meta.env.DEV ? <TailwindIndicator /> : null}
        <script
          defer
          src="https://umami.wyze.dev/script.js"
          data-domains="flydex.honeycomb.fyi"
          data-website-id="a39c176e-6eab-4bba-bdeb-120a9df733ef"
        />
        <Footer />
      </body>
    </html>
  )
}

export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>()

  return (
    <ThemeProvider specifiedTheme={data.theme}>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </ThemeProvider>
  )
}
