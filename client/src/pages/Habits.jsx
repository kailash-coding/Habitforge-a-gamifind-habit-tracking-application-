import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'

// Filter options for habits
const FILTERS = ['All', 'Daily', 'Weekly']

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

export default function Habits() {
  const navigate = useNavigate()
  const { habits, toggleHabit } = useHabits()
  const [filter, setFilter] = useState('All')  // Current filter state
  const today = getToday()

  // Filter habits based on selected filter
  const filtered = habits.filter((h) => {
    if (filter === 'All') return true
    return h.frequency === filter.toLowerCase()
  })

  return (
    <div className="light-page screen-scroll">
      {/* Header with title and add button */}
      <header className="page-header">
        <h1>My Habits</h1>
        <button
          type="button"
          className="icon-btn"
          style={{ background: 'var(--gradient)', color: 'white' }}
          onClick={() => navigate('/habits/new')}
        >
          +
        </button>
      </header>

      {/* Filter tabs */}
      <div className="tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Habit list */}
      {filtered.map((habit) => {
        // Check if this habit is completed today
        const isCompletedToday = habit.completedDates?.includes(today) ?? false
        
        return (
          <Link key={habit.id} to={`/habits/${habit.id}`} className="habit-list-card">
            {/* Habit icon */}
            <span
              className="habit-icon-box"
              style={{ background: `${habit.color}22`, color: habit.color }}
            >
              {habit.icon}
            </span>
            
            {/* Habit info */}
            <div className="habit-list-body">
              <strong>{habit.name}</strong>
              <p className="streak-text">{getCurrentStreak(habit.completedDates)} day streak</p>
              
              {/* Last 7 days completion dots */}
              <div className="week-dots">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() - (6 - i))
                  const dateKey = date.toISOString().split('T')[0]
                  const isCompleted = habit.completedDates?.includes(dateKey) ?? false
                  return <span key={i} className={isCompleted ? 'on' : ''} />
                })}
              </div>
            </div>
            
            {/* Toggle button - shows checkmark if completed today */}
            <button
              type="button"
              className={`big-toggle ${isCompletedToday ? 'on' : ''}`}
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
