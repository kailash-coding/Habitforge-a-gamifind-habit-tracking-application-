import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useHabits } from '../context/HabitContext'
import { HABIT_COLORS, HABIT_ICONS, HABIT_CATEGORIES, colorToGlow } from '../utils/habitStats'

const DEFAULT_FORM = {
  name: '',
  icon: '📝',
  category: 'General',
  color: HABIT_COLORS[0],
  frequency: 'daily',
  xp: 10,
}

export default function NewHabit() {
  const navigate = useNavigate()
  const { addHabit } = useHabits()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'xp' ? Number(value) || 10 : value,
    }))
  }

  const setColor = (color) => {
    setForm((prev) => ({ ...prev, color }))
  }

  const setIcon = (icon) => {
    setForm((prev) => ({ ...prev, icon }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Please enter a habit name.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await addHabit({
        ...form,
        name: form.name.trim(),
        glow: colorToGlow(form.color),
      })
      navigate('/habits')
    } catch {
      setError('Unable to add habit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="light-page screen-scroll new-habit-page">
      <header className="page-header">
        <Link to="/habits" className="back-link" aria-label="Back">
          ←
        </Link>
        <h1>Add Habit</h1>
        <span className="page-header-spacer" />
      </header>

      <div
        className="habit-preview-card"
        style={{
          background: `${form.color}18`,
          borderColor: `${form.color}44`,
        }}
      >
        <div
          className="habit-preview-icon"
          style={{ background: `${form.color}28`, color: form.color }}
        >
          {form.icon}
        </div>
        <div className="habit-preview-text">
          <strong>{form.name.trim() || 'New habit'}</strong>
          <span>{form.category} · {form.frequency} · +{form.xp} XP</span>
        </div>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label className="form-field">
          <span>Habit name</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Drink water"
            autoFocus
          />
        </label>

        <div className="form-field">
          <span>Icon</span>
          <div className="icon-picker">
            {HABIT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`icon-option ${form.icon === icon ? 'selected' : ''}`}
                style={
                  form.icon === icon
                    ? { background: `${form.color}28`, borderColor: form.color }
                    : undefined
                }
                onClick={() => setIcon(icon)}
                aria-label={`Icon ${icon}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <label className="form-field">
          <span>Category</span>
          <select name="category" value={form.category} onChange={handleChange}>
            {HABIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <div className="form-field">
          <span>Color</span>
          <div className="color-picker">
            {HABIT_COLORS.map((hex) => (
              <button
                key={hex}
                type="button"
                className={`color-swatch ${form.color === hex ? 'selected' : ''}`}
                style={{ background: hex }}
                onClick={() => setColor(hex)}
                aria-label={`Color ${hex}`}
              />
            ))}
          </div>
          <label className="custom-color-row">
            <span>Custom</span>
            <input
              name="color"
              type="color"
              value={form.color}
              onChange={handleChange}
            />
            <code>{form.color}</code>
          </label>
        </div>

        <label className="form-field">
          <span>Frequency</span>
          <select name="frequency" value={form.frequency} onChange={handleChange}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>

        <label className="form-field">
          <span>XP reward</span>
          <input
            type="number"
            name="xp"
            value={form.xp}
            onChange={handleChange}
            min={1}
            max={100}
          />
        </label>

        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? 'Saving…' : 'Save Habit'}
        </button>
      </form>
    </div>
  )
}
