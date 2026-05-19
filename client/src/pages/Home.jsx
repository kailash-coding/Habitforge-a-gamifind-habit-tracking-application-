import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'
import {
  buildMonthCalendar,
  filterDailyHabits,
  getMonthPerfectDays,
} from '../utils/habitStats'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Home() {
  const { user, habits, toggleHabit, isCompletedToday, getCurrentStreak } = useHabits()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthLabel = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const dailyHabits = useMemo(() => filterDailyHabits(habits), [habits])
  const monthCalendar = useMemo(() => buildMonthCalendar(habits, year, month), [habits, year, month])
  const monthPerfectDays = useMemo(() => getMonthPerfectDays(habits, year, month), [habits, year, month])

  const xpPercent = user.xpMax ? Math.round((user.xp / user.xpMax) * 100) : 0
  const budgetPercent = user.monthlyXpPercent ?? 0
  const completedToday = dailyHabits.filter(isCompletedToday).length
  const xpToNext = user.xpMax - user.xp

  return (
    <div className="light-page screen-scroll">
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

      <div className="profile-card">
        <div className="avatar">{user.avatar}</div>
        <div className="info">
          <div className="name">
            {user.fullName}
            <span className="rank-badge">{user.rank}</span>
          </div>
          <p className="meta">
            Level {user.level} · {xpToNext} XP to next level
          </p>
          <div className="xp-bar-wrap">
            <div className="xp-bar-labels">
              <span>{user.xp.toLocaleString()} / {user.xpMax.toLocaleString()} XP</span>
              <span>{user.totalXp.toLocaleString()} total</span>
            </div>
            <div className="xp-bar">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat-box">
          <div className="val">{user.monthStreak ?? 0}</div>
          <div className="lbl">Month Streak</div>
        </div>
        <div className="stat-box">
          <div className="val">{monthPerfectDays}</div>
          <div className="lbl">Perfect Days</div>
        </div>
        <div className="stat-box">
          <div className="val">{completedToday}/{dailyHabits.length || 0}</div>
          <div className="lbl">Done Today</div>
        </div>
      </div>

      <section className="home-section">
        <h2 className="section-title">Monthly XP Budget</h2>
        <article className="budget-card">
          <div className="budget-header">
            <span>{monthLabel}</span>
            <strong>{budgetPercent}%</strong>
          </div>
          <div className="budget-bar">
            <div className="budget-bar-fill" style={{ width: `${budgetPercent}%` }} />
          </div>
          <div className="budget-meta">
            <span>{user.monthlyXpEarned?.toLocaleString() ?? 0} earned</span>
            <span>{user.monthlyXpBudget?.toLocaleString() ?? 0} goal</span>
          </div>
        </article>
      </section>

      <section className="home-section">
        <h2 className="section-title">{monthLabel} Streaks</h2>
        <article className="month-calendar-card">
          <div className="month-weekdays">
            {WEEKDAYS.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className="month-grid">
            {Array.from({ length: monthCalendar.firstWeekday }).map((_, index) => (
              <span key={`pad-${index}`} className="month-day empty" />
            ))}
            {monthCalendar.days.map((day) => (
              <span
                key={day.key}
                className={`month-day ${day.status} ${day.isToday ? 'today' : ''}`}
                title={
                  day.isFuture
                    ? 'Upcoming'
                    : `${day.completedCount}/${day.total} daily habits`
                }
              >
                {day.day}
              </span>
            ))}
          </div>
          <div className="month-legend">
            <span><i className="dot perfect" /> All daily habits</span>
            <span><i className="dot partial" /> Partial</span>
            <span><i className="dot none" /> Missed</span>
          </div>
        </article>
      </section>

      <h2 className="section-title">Daily Habits</h2>
      {dailyHabits.length === 0 && (
        <p style={{ padding: '0 16px', color: '#666' }}>
          No daily habits yet.{' '}
          <Link to="/habits/new">Add one</Link> to start your streak.
        </p>
      )}
      {dailyHabits.map((habit) => {
        const doneToday = isCompletedToday(habit)
        const streak = getCurrentStreak(habit.completedDates)
        return (
          <Link key={habit.id} to={`/habits/${habit.id}`} className="habit-row">
            <div className="icon-wrap" style={{ background: `${habit.color}22` }}>
              {habit.icon}
            </div>
            <div>
              <div className={`title ${doneToday ? 'done-today' : ''}`}>{habit.name}</div>
              <div className="cat">
                {habit.category} · {streak} day streak · +{habit.xp} XP
              </div>
            </div>
            <button
              type="button"
              className={`check ${doneToday ? 'done' : ''}`}
              onClick={(e) => {
                e.preventDefault()
                toggleHabit(habit.id)
              }}
            >
              {doneToday ? '✓' : ''}
            </button>
          </Link>
        )
      })}
    </div>
  )
}
