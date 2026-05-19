import { Link, useNavigate } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'
import { useAuth } from '../context/AuthContext'

const MENU = [
  { icon: '👤', label: 'Account', path: '/sign' },
  { icon: '👑', label: 'My Plan', path: '/upgrade', premium: true },
  { icon: '🔔', label: 'Reminders', path: '#' },
  { icon: '📁', label: 'Export Data', path: '#' },
  { icon: '❓', label: 'Help & Support', path: '#' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useHabits()
  const { user: authUser, signOut } = useAuth()
  const totalXp = user.totalXp ?? 0
  const xpPercent = user.xpMax ? Math.round((totalXp / user.xpMax) * 100) : 0

  const handleSignOut = () => {
    signOut()
    navigate('/sign', { replace: true })
  }

  return (
    <div className="profile-screen screen-scroll">
      <header className="detail-nav" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="back-btn" aria-label="Settings">
          ⚙️
        </button>
      </header>

      <div className="profile-top">
        <div className="big-avatar">{user.avatar}</div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{user.fullName}</h1>
        {authUser?.email && (
          <p style={{ color: '#888', marginTop: 2, fontSize: '0.85rem' }}>{authUser.email}</p>
        )}
        <p style={{ color: '#888', marginTop: 4 }}>
          Level {user.level} · {user.rank}
        </p>
        <div style={{ maxWidth: 280, margin: '16px auto 0', padding: '0 16px' }}>
          <div className="xp-bar-labels" style={{ color: '#888' }}>
            <span>{totalXp.toLocaleString()} XP</span>
            <span>{user.xpMax.toLocaleString()}</span>
          </div>
          <div className="xp-bar" style={{ background: '#2a2a42' }}>
            <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>

      <nav className="menu-list">
        {MENU.map((item) => (
          <Link key={item.label} to={item.path} className="menu-item">
            <span className="mi-icon">{item.icon}</span>
            <span className="mi-label">{item.label}</span>
            {item.premium && <span className="premium-tag">Premium</span>}
            <span className="mi-arrow">›</span>
          </Link>
        ))}
        <button type="button" className="menu-item menu-item-danger" onClick={handleSignOut}>
          <span className="mi-icon">🚪</span>
          <span className="mi-label">Sign Out</span>
          <span className="mi-arrow">›</span>
        </button>
      </nav>
    </div>
  )
}
