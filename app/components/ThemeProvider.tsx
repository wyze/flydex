import { useFetcher, useLocation } from '@remix-run/react'
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'

export type Theme = (typeof themes)[number]

type ThemeContextType = [
  Exclude<Theme, 'system'> | null,
  Theme,
  (theme: Theme) => void
]

const themes = ['dark', 'light', 'system'] as const
const prefersDarkMq = '(prefers-color-scheme: dark)'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getPreferredTheme() {
  if (typeof document !== 'undefined') {
    return window.matchMedia(prefersDarkMq).matches ? 'dark' : 'light'
  }

  return null
}

export function ThemeProvider({
  children,
  specifiedTheme,
}: {
  children: React.ReactNode
  specifiedTheme: Theme
}) {
  const { pathname } = useLocation()
  const [theme, setTheme] = useState(specifiedTheme)
  const [, forceUpdate] = useReducer((state) => state + 1, 0)

  const persistTheme = useFetcher()
  const persistThemeRef = useRef(persistTheme)
  const mountRun = useRef(false)

  useEffect(() => {
    persistThemeRef.current = persistTheme
  }, [persistTheme])

  useEffect(() => {
    if (!mountRun.current) {
      mountRun.current = true

      return
    }

    if (theme !== specifiedTheme) {
      persistThemeRef.current.submit(
        { pathname, theme },
        { action: 'action/set-theme', method: 'post' }
      )
    }
  }, [pathname, specifiedTheme, theme])

  useEffect(() => {
    const mediaQuery = window.matchMedia(prefersDarkMq)

    mediaQuery.addEventListener('change', forceUpdate)

    return () => mediaQuery.removeEventListener('change', forceUpdate)
  }, [])

  return (
    <ThemeContext.Provider
      value={[
        theme === 'system' ? getPreferredTheme() : theme,
        theme,
        setTheme,
      ]}
    >
      {children}
    </ThemeContext.Provider>
  )
}

const clientThemeCode = `
// hi there dear reader 👋
// this is how I make certain we avoid a flash of the wrong theme. If you select
// a theme, then I'll know what you want in the future and you'll not see this
// script anymore.
;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersDarkMq)}).matches
    ? 'dark'
    : 'light';
  const cl = document.documentElement.classList;
  const themeAlreadyApplied = cl.contains('light') || cl.contains('dark');
  if (themeAlreadyApplied) {
    // this script shouldn't exist if the theme is already applied!
    console.warn(
      "Hi there, could you let me know you're seeing this message? Thanks!",
    );
  } else {
    cl.add(theme);
  }
  const meta = document.querySelector('meta[name=color-scheme]');
  if (meta) {
    if (theme === 'dark') {
      meta.content = 'dark light';
    } else if (theme === 'light') {
      meta.content = 'light dark';
    }
  } else {
    console.warn(
      "Hey, could you let me know you're seeing this message? Thanks!",
    );
  }
})();
`

const themeStylesCode = `
  /* default light, but app-preference is "dark" */
  html.dark {
    light-mode {
      display: none;
    }
  }

  /* default light, and no app-preference */
  html:not(.dark) {
    dark-mode {
      display: none;
    }
  }

  @media (prefers-color-scheme: dark) {
    /* prefers dark, but app-preference is "light" */
    html.light {
      dark-mode {
        display: none;
      }
    }

    /* prefers dark, and app-preference is "dark" */
    html.dark,
    /* prefers dark and no app-preference */
    html:not(.light) {
      light-mode {
        display: none;
      }
    }
  }
`

export function ThemeHead({ ssrTheme }: { ssrTheme: boolean }) {
  const [theme] = useTheme()

  return (
    <>
      {/*
        On the server, "theme" might be `null`, so clientThemeCode ensures that
        this is correct before hydration.
      */}
      {ssrTheme ? (
        <meta
          name="color-scheme"
          content={theme === 'light' ? 'light dark' : 'dark light'}
        />
      ) : null}
      {/*
        If we know what the theme is from the server then we don't need
        to do fancy tricks prior to hydration to make things match.
      */}
      {ssrTheme ? null : (
        <>
          <script
            // NOTE: we cannot use type="module" because that automatically makes
            // the script "defer". That doesn't work for us because we need
            // this script to run synchronously before the rest of the document
            // is finished loading.
            dangerouslySetInnerHTML={{ __html: clientThemeCode }}
          />
          <style dangerouslySetInnerHTML={{ __html: themeStylesCode }} />
        </>
      )}
    </>
  )
}

const clientDarkAndLightModeElsCode = `;(() => {
  const theme = window.matchMedia(${JSON.stringify(prefersDarkMq)}).matches
    ? 'dark'
    : 'light';
  const darkEls = document.querySelectorAll("dark-mode");
  const lightEls = document.querySelectorAll("light-mode");
  for (const darkEl of darkEls) {
    if (theme === "dark") {
      for (const child of darkEl.childNodes) {
        darkEl.parentElement?.append(child);
      }
    }
    darkEl.remove();
  }
  for (const lightEl of lightEls) {
    if (theme === "light") {
      for (const child of lightEl.childNodes) {
        lightEl.parentElement?.append(child);
      }
    }
    lightEl.remove();
  }
})();`

export function ThemeBody({ ssrTheme }: { ssrTheme: boolean }) {
  return ssrTheme ? null : (
    <script
      dangerouslySetInnerHTML={{ __html: clientDarkAndLightModeElsCode }}
    />
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && themes.includes(value as any)
}
