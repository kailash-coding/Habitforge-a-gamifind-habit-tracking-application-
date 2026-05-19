import { useParams, useNavigate, Link } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'

// Days of week labels
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split('T')[0]

// Calculate current streak (consecutive days of completion)
const getCurrentStreak = (completedDates = []) => {
  const dates = [...new Set(completedDates)].sort()
  const today = new Date()
  const toKey = (date) => date.toISOString().split('T')[0]
  let streak = 0

  // Count backward from today until we find a day without completion
  for (let offset = 0; ; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = toKey(date)
    if (!dates.includes(key)) break
    streak += 1
  }

  return streak
}

// Detail page for a single habit
export default function HabitDetail() {
  const { id } = useParams()  // Get habit ID from URL
  const navigate = useNavigate()
  const { getHabit, toggleHabit } = useHabits()
  const habit = getHabit(id)
  const today = getToday()
  const todayIndex = (new Date().getDay() + 6) % 7  // Get today's day index (0 = Monday)
  const isCompletedToday = habit?.completedDates?.includes(today) ?? false

  // Show error if habit not found
  if (!habit) {
    return (
      <div className="detail-screen">
        <p style={{ padding: 40, textAlign: 'center' }}>Habit not found</p>
        <Link to="/habits">Back</Link>
      </div>
    )
  }

  return (
    <div className="detail-screen">
      {/* Navigation header */}
      <nav className="detail-nav">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <span style={{ fontWeight: 600 }}>{habit.name}</span>
      </nav>

      {/* Habit icon in glow orb */}
      <div
        className="glow-orb"
        style={{ background: `${habit.color}33`, '--glow': habit.glow }}
      >
        {habit.icon}
      </div>

      {/* Habit name */}
      <h1 className="detail-title">{habit.name}</h1>

      {/* Stats row - streak and XP */}
      <div className="detail-stats">
        <div className="detail-stat">
          <div className="n">{getCurrentStreak(habit.completedDates)}</div>
          <div className="l">Current Streak</div>
        </div>
        <div className="detail-stat">
          <div className="n">+{habit.xp} XP</div>
          <div className="l">Today</div>
        </div>
      </div>

      {/* Weekly completion view - shows last 7 days */}
      <div className="week-row">
        {DAYS.map((d, i) => {
          // Calculate date for this day
          const date = new Date()
          date.setDate(date.getDate() - (todayIndex - i))
          const dateKey = date.toISOString().split('T')[0]
          // Check if completed on this day
          const completed = habit.completedDates?.includes(dateKey) ?? false

          return (
            <div key={i} className={`week-day ${i === todayIndex ? 'today' : ''}`}>
              {d}
              <div className={`dot ${completed ? 'done' : ''}`}>
                {completed ? '✓' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Toggle button - change based on today's completion status */}
      <button
        type="button"
        className="btn-primary-lg"
        onClick={() => toggleHabit(habit.id)}
      >
        {isCompletedToday ? 'Mark Incomplete' : 'Mark as Completed'}
      </button>
      
      {/* Edit button (placeholder) */}
      <button type="button" className="btn-outline-lg">
        Edit Habit
      </button>
    </div>
  )
}
