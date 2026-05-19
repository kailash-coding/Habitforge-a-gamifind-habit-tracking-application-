import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'

// Page to create a new habit
export default function NewHabit() {
  const navigate = useNavigate()
  const { addHabit } = useHabits()
  
  // Form state with default values
  const [form, setForm] = useState({
    name: '',                 // Habit name (required)
    icon: '📝',              // Emoji icon
    category: 'General',     // Habit category
    color: '#888888',        // Color for the habit
    frequency: 'daily',      // daily or weekly
    xp: 10,                  // XP reward for completing
  })
  const [error, setError] = useState('')  // Error message

  // Update form field on input change
  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // Submit form to create new habit
  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // Validate habit name
    if (!form.name.trim()) {
      setError('Please enter a habit name.')
      return
    }

    try {
      // Add habit to context/state and localStorage
      await addHabit(form)
      // Navigate back to habits list
      navigate('/habits')
    } catch (err) {
      setError('Unable to add habit. Please try again.')
    }
  }

  return (
    <div className="light-page screen-scroll">
      {/* Page header */}
      <header className="page-header">
        <h1>Add Habit</h1>
      </header>

      {/* Form */}
      <form className="card form-card" onSubmit={handleSubmit}>
        {/* Error message */}
        {error && <p className="form-error">{error}</p>}

        {/* Habit name field */}
        <label className="form-field">
          <span>Name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Habit name"
          />
        </label>

        {/* Icon field */}
        <label className="form-field">
          <span>Icon</span>
          <input
            name="icon"
            value={form.icon}
            onChange={handleChange}
            placeholder="Emoji icon"
          />
        </label>

        {/* Category field */}
        <label className="form-field">
          <span>Category</span>
          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            placeholder="Category"
          />
        </label>

        {/* Color picker */}
        <label className="form-field">
          <span>Color</span>
          <input
            name="color"
            type="color"
            value={form.color}
            onChange={handleChange}
          />
        </label>

        {/* Frequency dropdown */}
        <label className="form-field">
          <span>Frequency</span>
          <select name="frequency" value={form.frequency} onChange={handleChange}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>

        {/* XP reward field */}
        <label className="form-field">
          <span>XP Reward</span>
          <input
            type="number"
            name="xp"
            value={form.xp}
            onChange={handleChange}
            placeholder="XP points"
            min="1"
          />
        </label>

        {/* Submit button */}
        <button type="submit" className="primary-btn">
          Save Habit
        </button>
      </form>
    </div>
  )
}
