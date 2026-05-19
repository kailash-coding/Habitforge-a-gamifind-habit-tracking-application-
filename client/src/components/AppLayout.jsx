import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

const DARK_ROUTES = ['/analytics', '/profile', '/habits/']

export default function AppLayout() {
  const { pathname } = useLocation()
  const isDark = DARK_ROUTES.some((r) => pathname.startsWith(r))
  const hideNav = pathname === '/sign'

  return (
    <div className={`phone-shell ${isDark ? 'dark-page' : ''}`}>
      <Outlet />
      {!hideNav && <BottomNav dark={isDark} />}
    </div>
  )
}
