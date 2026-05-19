import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const links = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/habits', icon: '✅', label: 'Habits' },
  { to: '/analytics', icon: '📊', label: 'Stats' },
  { to: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomNav({ dark = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const hide = location.pathname.startsWith('/habits/')

  if (hide) return null

  return (
    <nav className={`bottom-nav ${dark ? 'dark' : ''}`}>
      {links.slice(0, 2).map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="ni">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
      <button type="button" className="fab" title="Add habit" onClick={() => navigate('/habits/new')}>
        +
      </button>
      {links.slice(2).map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="ni">{l.icon}</span>
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
