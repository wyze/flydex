import {
  type Session,
  createCookieSessionStorage,
  redirect,
} from '@remix-run/node'
import { z } from 'zod'

import type { Theme } from '~/components/ThemeProvider'
import { COOKIE_SECRET } from '~/lib/env.server'

const isProduction = process.env.NODE_ENV === 'production'

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: isProduction ? '__session' : '__session:flydex',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [COOKIE_SECRET],
    secure: isProduction,
  },
})

const maxAge = 60 * 60 * 24 * 30 // 30 days

const THEME_KEY = 'theme'

async function getStoredSession(request: Request) {
  const cookie = request.headers.get('Cookie')

  return sessionStorage.getSession(cookie)
}

export async function commitTheme({
  redirectTo,
  request,
  theme,
}: {
  redirectTo: string
  request: Request
  theme: Theme | null
}) {
  const { session } = await getSession(request)

  session.set(THEME_KEY, theme)

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge,
      }),
    },
  })
}

export async function destroySession({
  redirectTo,
  request,
}: {
  redirectTo: string
  request: Request
}) {
  const session = await getStoredSession(request)

  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  })
}

export async function getSession(request: Request) {
  const session = await getStoredSession(request)

  return z
    .object({
      session: z.custom<Session>(),
      theme: z
        .union([z.literal('dark'), z.literal('light'), z.literal('system')])
        .default('system'),
    })
    .parse({
      session,
      theme: session.get(THEME_KEY),
    })
}
