import { Link } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'

const MENU = [
  { icon: '👤', label: 'Account', path: '#' },
  { icon: '👑', label: 'My Plan', path: '/upgrade', premium: true },
  { icon: '🔔', label: 'Reminders', path: '#' },
  { icon: '📁', label: 'Export Data', path: '#' },
  { icon: '❓', label: 'Help & Support', path: '#' },
  { icon: '🚪', label: 'Sign Out', path: '#', danger: true },
]

export default function Profile() {
  const { user } = useHabits()
  const xpPercent = Math.round((user.xp / user.xpMax) * 100)

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
        <p style={{ color: '#888', marginTop: 4 }}>
          Level {user.level} · {user.rank}
        </p>
        <div style={{ maxWidth: 280, margin: '16px auto 0', padding: '0 16px' }}>
          <div className="xp-bar-labels" style={{ color: '#888' }}>
            <span>{user.xp.toLocaleString()} XP</span>
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
      </nav>
    </div>
  )
}
