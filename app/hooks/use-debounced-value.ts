import { useEffect, useRef, useState } from 'react'

export function useDebouncedValue<T>(
  value: T,
  wait = 500,
  options = { leading: false },
) {
  const [state, setState] = useState(value)
  const mountedRef = useRef(false)
  const timeoutRef = useRef<number>(0)
  const cooldownRef = useRef(false)

  const cancel = () => window.clearTimeout(timeoutRef.current)

  useEffect(() => {
    if (!mountedRef.current) {
      return
    }

    if (!cooldownRef.current && options.leading) {
      cooldownRef.current = true

      setState(value)
    } else {
      cancel()

      timeoutRef.current = window.setTimeout(() => {
        cooldownRef.current = false

        setState(value)
      }, wait)
    }
  }, [value, options.leading, wait])

  useEffect(() => {
    mountedRef.current = true

    return cancel
  }, [])

  return [state, cancel] as const
}
