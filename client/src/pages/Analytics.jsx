import { useMemo } from 'react'
import { useHabits } from '../context/HabitContext'

// Day labels for the weekly trend
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Build last 7 days completion data for trend chart
function buildLast7Days(habits) {
  const today = new Date()
  const total = habits.length || 1
  // Create array of last 7 days with completion rates
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = date.toISOString().split('T')[0]
    // Count how many habits were completed on this date
    const completedCount = habits.filter((habit) => habit.completedDates?.includes(key)).length
    return {
      label: DAYS[date.getDay()],
      rate: Math.round((completedCount / total) * 100),  // Percentage completed
    }
  })
}

// Build heatmap data for 84 days (12 weeks)
function buildHeatmap(habits) {
  const total = habits.length || 1
  // Map each date to number of habits completed
  const completedMap = habits.reduce((map, habit) => {
    habit.completedDates?.forEach((date) => {
      map[date] = (map[date] || 0) + 1
    })
    return map
  }, {})

  const today = new Date()
  // Create 84-day heatmap (12 weeks)
  return Array.from({ length: 84 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (83 - index))
    const key = date.toISOString().split('T')[0]
    const count = completedMap[key] || 0
    // Convert count to heatmap level (0-4)
    return Math.min(4, Math.floor((count / total) * 4))
  })
}

// Analytics page showing habit performance and statistics
export default function Analytics() {
  const { habits } = useHabits()

  // Get today's date
  const today = new Date().toISOString().split('T')[0]
  // Count habits completed today
  const completedCount = habits.filter((habit) => habit.completedDates?.includes(today)).length
  // Calculate remaining habits for today
  const remainingCount = habits.length - completedCount
  // Calculate overall completion rate
  const completionRate = habits.length ? Math.round((completedCount / habits.length) * 100) : 0
  // Format today's date for display
  const todayDisplay = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  // Memoize trend data (only recalculate when habits change)
  const trendData = useMemo(() => buildLast7Days(habits), [habits])
  // Memoize heatmap data
  const heatmap = useMemo(() => buildHeatmap(habits), [habits])
  // Get max rate for scaling chart
  const maxRate = Math.max(...trendData.map((d) => d.rate), 1)

  return (
    <div className="detail-screen screen-scroll">
      {/* Analytics header */}
      <header className="analytics-header">
        <h1>Analytics</h1>
        <p style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>Your habit performance & daily results</p>
      </header>

      {/* Summary stats */}
      <article className="chart-card stats-grid">
        {/* Today's completion */}
        <div className="stat-card">
          <h3>Today</h3>
          <p>{todayDisplay}</p>
          <strong>{completedCount} / {habits.length} habits done</strong>
          <small>{remainingCount} remaining</small>
        </div>
        
        {/* Overall completion rate */}
        <div className="stat-card">
          <h3>Completion</h3>
          <p>{completionRate}%</p>
          <small>Overall completion rate</small>
        </div>
        
        {/* Total active habits */}
        <div className="stat-card">
          <h3>Active Habits</h3>
          <p>{habits.length}</p>
          <small>Track your daily goals</small>
        </div>
      </article>

      {/* 7-day completion trend chart */}
      <article className="chart-card">
        <h3>Daily Completion Trend</h3>
        <div className="line-chart">
          {trendData.map((d) => (
            <div
              key={d.label}
              className="bar"
              style={{ height: `${(d.rate / maxRate) * 100}%` }}
              title={`${d.label}: ${d.rate}%`}
            />
          ))}
        </div>
        <div className="chart-labels">
          {trendData.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </article>

      {/* 12-week heatmap */}
      <article className="chart-card">
        <h3>Completion Heatmap</h3>
        <div className="heatmap">
          {heatmap.map((level, i) => (
            <span key={i} className={level ? `l${level}` : ''} />
          ))}
        </div>
      </article>

      {/* Today's habit status */}
      <article className="chart-card">
        <h3>Daily Results</h3>
        <ul className="daily-results">
          {habits.map((habit) => {
            // Check if habit completed today
            const isCompletedToday = habit.completedDates?.includes(today) ?? false
            return (
              <li key={habit.id} className={isCompletedToday ? 'done' : 'pending'}>
                <span>{habit.icon}</span>
                <div>
                  <strong>{habit.name}</strong>
                  <p>{isCompletedToday ? 'Completed today' : 'Pending today'}</p>
                </div>
                <span>{isCompletedToday ? '✓' : '•'}</span>
              </li>
            )
          })}
        </ul>
      </article>
    </div>
  )
}
