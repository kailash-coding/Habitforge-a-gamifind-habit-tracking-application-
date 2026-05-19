export const XP_PER_LEVEL = 300

const RANKS = [
  { min: 1, name: 'Starter' },
  { min: 4, name: 'Builder' },
  { min: 8, name: 'Champion' },
  { min: 12, name: 'Legend' },
  { min: 16, name: 'Master' },
]

export const toDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const getTodayKey = () => toDateKey(new Date())

export const getHabitXp = (habit) => {
  const n = Number(habit?.xp)
  return Number.isFinite(n) && n > 0 ? n : 10
}

export const colorToGlow = (hex = '#7C4DFF') => {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 'rgba(124, 77, 255, 0.45)'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return 'rgba(124, 77, 255, 0.45)'
  return `rgba(${r}, ${g}, ${b}, 0.45)`
}

export const HABIT_COLORS = [
  '#7C4DFF',
  '#448AFF',
  '#26C6DA',
  '#FF7043',
  '#EC4899',
  '#10B981',
  '#FBBF24',
  '#FF6B6B',
]

export const HABIT_ICONS = ['📝', '💧', '📚', '🧘', '🏃', '🥗', '😴', '💪', '🎯', '🎸', '🧠', '☀️']

export const HABIT_CATEGORIES = ['General', 'Health', 'Fitness', 'Growth', 'Mindfulness', 'Wellness']

export const isDailyHabit = (habit) => (habit.frequency || 'daily') === 'daily'

export const filterDailyHabits = (habits) => habits.filter(isDailyHabit)

export const getLevelProgress = (totalXp) => {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const xpInLevel = totalXp % XP_PER_LEVEL
  return {
    level,
    xpInLevel,
    xpMax: XP_PER_LEVEL,
    xpToNext: XP_PER_LEVEL - xpInLevel,
  }
}

export const getRankForLevel = (level) => {
  let rank = RANKS[0].name
  RANKS.forEach((tier) => {
    if (level >= tier.min) rank = tier.name
  })
  return rank
}

export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()

export const getMonthPrefix = (year, month) =>
  `${year}-${String(month + 1).padStart(2, '0')}`

export const getDayCompletion = (habits, dateKey) => {
  const daily = filterDailyHabits(habits)
  const completedCount = daily.filter((h) => h.completedDates?.includes(dateKey)).length
  const total = daily.length
  const rate = total ? completedCount / total : 0

  let status = 'none'
  if (rate === 1 && total > 0) status = 'perfect'
  else if (rate > 0) status = 'partial'

  return { completedCount, total, rate, status }
}

export const buildMonthCalendar = (habits, year, month) => {
  const todayKey = getTodayKey()
  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = new Date(year, month, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const date = new Date(year, month, day)
    const key = toDateKey(date)
    const { completedCount, total, status } = getDayCompletion(habits, key)

    return {
      day,
      key,
      isToday: key === todayKey,
      isFuture: key > todayKey,
      completedCount,
      total,
      status: key > todayKey ? 'future' : status,
    }
  })

  return { days, firstWeekday, daysInMonth }
}

export const getMonthlyXpStats = (habits, year, month) => {
  const daily = filterDailyHabits(habits)
  const prefix = getMonthPrefix(year, month)
  const daysInMonth = getDaysInMonth(year, month)

  let earned = 0
  daily.forEach((habit) => {
    habit.completedDates?.forEach((date) => {
      if (date.startsWith(prefix)) earned += getHabitXp(habit)
    })
  })

  const budget = daily.reduce((sum, habit) => sum + getHabitXp(habit), 0) * daysInMonth

  return {
    earned,
    budget,
    remaining: Math.max(0, budget - earned),
    percent: budget ? Math.min(100, Math.round((earned / budget) * 100)) : 0,
  }
}

export const getMonthPerfectStreak = (habits, year, month) => {
  const todayKey = getTodayKey()
  const prefix = getMonthPrefix(year, month)
  let streak = 0
  const date = new Date()

  if (date.getFullYear() !== year || date.getMonth() !== month) {
    date.setFullYear(year, month, getDaysInMonth(year, month))
  } else if (todayKey.startsWith(prefix)) {
    const { status: todayStatus } = getDayCompletion(habits, todayKey)
    if (todayStatus !== 'perfect') {
      date.setDate(date.getDate() - 1)
    }
  }

  while (date.getMonth() === month) {
    const key = toDateKey(date)
    if (key > todayKey) {
      date.setDate(date.getDate() - 1)
      continue
    }
    const { status } = getDayCompletion(habits, key)
    if (status !== 'perfect') break
    streak += 1
    date.setDate(date.getDate() - 1)
  }

  return streak
}

export const getMonthPerfectDays = (habits, year, month) => {
  const prefix = getMonthPrefix(year, month)
  const todayKey = getTodayKey()
  let count = 0

  const daysInMonth = getDaysInMonth(year, month)
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${prefix}-${String(day).padStart(2, '0')}`
    if (key > todayKey) break
    const { status } = getDayCompletion(habits, key)
    if (status === 'perfect') count += 1
  }

  return count
}
