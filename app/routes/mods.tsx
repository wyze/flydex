import { Outlet } from '@remix-run/react'

export default function ModsLayout() {
  return (
    <div className="flex-1">
      <Outlet />
    </div>
  )
}
