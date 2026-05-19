import { Link } from 'react-router-dom'
import { BADGES } from '../data/mockData'
import { useHabits } from '../context/HabitContext'

export default function Badges() {
  const { user } = useHabits()
  const unlockedCount = Math.min(user.badgesUnlocked || 0, BADGES.length)
  const badgeList = BADGES.map((badge, index) => ({
    ...badge,
    unlocked: index < unlockedCount,
  }))
  const pct = Math.round((unlockedCount / BADGES.length) * 100)

  return (
    <div className="light-page screen-scroll">
      <header className="page-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--purple)', fontSize: '1.2rem' }}>
          ←
        </Link>
        <h1>Badges</h1>
        <span style={{ width: 32 }} />
      </header>

      <div className="badges-grid">
        {badgeList.map((b) => (
          <div key={b.id} className={`badge-hex ${b.unlocked ? '' : 'locked'}`}>
            <span className="icon">{b.icon}</span>
            <span className="name">{b.name}</span>
          </div>
        ))}
      </div>

      <div className="progress-card">
        <h3>Your Progress</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {unlockedCount} / {BADGES.length} Badges Unlocked
        </p>
        <div className="xp-bar">
          <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '2.5rem' }}>🎁</p>
      </div>
    </div>
  )
}
