import { Link } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'

// Get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split('T')[0]

// Home page - displays user profile, stats, and today's habits
export default function Home() {
  const { user, habits, toggleHabit } = useHabits()
  const xpPercent = Math.round((user.xp / user.xpMax) * 100)
  const today = getToday()

  return (
    <div className="light-page screen-scroll">
      {/* Hero header with greeting */}
      <header className="hero-header">
        <div className="header-row">
          <div>
            <p>Good morning,</p>
            <h1>{user.name}! 👋</h1>
          </div>
          <button type="button" className="icon-btn" aria-label="Notifications">
            🔔
          </button>
        </div>
      </header>

      {/* User profile card with XP bar */}
      <div className="profile-card">
        <div className="avatar">{user.avatar}</div>
        <div className="info">
          <div className="name">
            {user.fullName}
            <span className="rank-badge">{user.rank}</span>
          </div>
          <p className="meta">Level {user.level}</p>
          <div className="xp-bar-wrap">
            <div className="xp-bar-labels">
              <span>{user.xp.toLocaleString()} XP</span>
              <span>{user.xpMax.toLocaleString()}</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats - day streak, total XP, badges */}
      <div className="quick-stats">
        <Link to="/habits" className="stat-box" style={{ textDecoration: 'none' }}>
          <div className="val">{user.dayStreak}</div>
          <div className="lbl">Day Streak</div>
        </Link>
        <div className="stat-box">
          <div className="val">{user.totalXp.toLocaleString()}</div>
          <div className="lbl">Total XP</div>
        </div>
        <Link to="/badges" className="stat-box" style={{ textDecoration: 'none' }}>
          <div className="val">{user.badgesUnlocked}</div>
          <div className="lbl">Badges</div>
        </Link>
      </div>

      {/* Today's habits section */}
      <h2 className="section-title">Today&apos;s Habits</h2>
      {habits.length === 0 && (
        <p style={{ padding: '0 16px', color: '#666' }}>
          No habits yet. Add one to start tracking your daily progress.
        </p>
      )}
      {habits.map((habit) => {
        // Check if this habit is completed today
        const isCompletedToday = habit.completedDates?.includes(today) ?? false
        return (
          <Link key={habit.id} to={`/habits/${habit.id}`} className="habit-row">
            {/* Habit icon box */}
            <div className="icon-wrap" style={{ background: `${habit.color}22` }}>
              {habit.icon}
            </div>
            
            {/* Habit name and category */}
            <div>
              <div className="title">{habit.name}</div>
              <div className="cat">{habit.category}</div>
            </div>
            
            {/* Toggle button - shows checkmark if completed today */}
            <button
              type="button"
              className={`check ${isCompletedToday ? 'done' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                toggleHabit(habit.id)
              }}
            >
              {isCompletedToday ? '✓' : ''}
            </button>
          </Link>
        )
      })}
    </div>
  )
}
