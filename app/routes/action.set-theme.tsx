import { type ActionArgs, json, redirect } from '@remix-run/node'
import { z } from 'zod'
import { zx } from 'zodix'

import { isTheme } from '~/components/theme-provider'
import { commitTheme, destroySession } from '~/lib/session.server'

export const action = async ({ request }: ActionArgs) => {
  const { pathname: redirectTo, theme } = await zx.parseForm(request, {
    pathname: z.string(),
    theme: z.union([
      z.literal('dark'),
      z.literal('light'),
      z.literal('system'),
    ]),
  })

  if (!isTheme(theme)) {
    return json({
      success: false,
      message: `theme value of ${theme} is not a valid theme`,
    })
  }

  return theme === 'system'
    ? destroySession({ redirectTo, request })
    : commitTheme({ redirectTo, request, theme })
}

export const loader = async () => redirect('/', { status: 404 })
