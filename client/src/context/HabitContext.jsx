import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { USER as INITIAL_USER, BADGES, HABITS as INITIAL_HABITS } from '../data/mockData'

// Create context for habit management
const HabitContext = createContext(null)

// localStorage key for persisting habits
const HABITS_STORAGE_KEY = 'habits_app_data'

// Get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split('T')[0]

// Get yesterday's date in YYYY-MM-DD format
const getYesterday = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

// Check if a habit is completed today
// Returns true if today's date is in the completedDates array
const isCompletedToday = (habit) => {
  const today = getToday()
  return habit.completedDates?.includes(today) ?? false
}

// Calculate current streak (consecutive days of completion)
// Counts backward from today until a missing date
const getCurrentStreak = (completedDates = []) => {
  const dates = [...new Set(completedDates)].sort()
  const today = new Date()
  const toKey = (date) => date.toISOString().split('T')[0]
  let streak = 0

  // Loop through each day going backwards
  for (let offset = 0; ; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = toKey(date)
    // Stop counting when we find a day without the habit completed
    if (!dates.includes(key)) break
    streak += 1
  }

  return streak
}

// Generate array of last 7 days completion status
// Used for displaying weekly progress (week dots)
const generateWeekArray = (completedDates = []) => {
  const week = []
  // Loop through last 7 days (including today)
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split('T')[0]
    // true if completed on that day, false otherwise
    week.push(completedDates.includes(key))
  }
  return week
}

// Calculate number of badges unlocked based on achievements
// Checks day streak, total XP, habits count, and daily completion count
const computeBadgesUnlocked = ({ dayStreak, totalXp, habitsCount, completedTodayCount }) => {
  // Badge criteria: each true = 1 badge
  const criteria = [
    dayStreak >= 1,        // Badge 1: Any streak
    dayStreak >= 3,        // Badge 2: 3+ day streak
    dayStreak >= 7,        // Badge 3: 7+ day streak
    totalXp >= 1000,       // Badge 4: 1000 XP
    totalXp >= 2000,       // Badge 5: 2000 XP
    completedTodayCount >= 1,  // Badge 6: 1+ habits today
    completedTodayCount >= 3,  // Badge 7: 3+ habits today
    habitsCount >= 5,      // Badge 8: 5+ habits total
  ]
  // Count how many criteria are met
  return criteria.filter(Boolean).length
}

// Get a flattened list of all habit completion dates
const getAllCompletionDates = (habits) => habits.flatMap((habit) => habit.completedDates || [])

// Calculate total XP earned from historical habit completions
const calculateTotalXpFromHabits = (habits) =>
  habits.reduce((sum, habit) => sum + (habit.completedDates?.length || 0) * (habit.xp || 10), 0)

// Determine the latest completed date across all habits
const getLatestCompletionDate = (habits) => {
  const dates = [...new Set(getAllCompletionDates(habits))]
  if (!dates.length) return null
  return dates.sort()[dates.length - 1]
}

// Calculate updated user stats based on habits and XP gain
// Updates XP, day streak, and badge count
const buildUpdatedUser = (prev, xpGain, habits) => {
  const today = getToday()
  const completedTodayCount = habits.filter(isCompletedToday).length
  const allCompletionDates = getAllCompletionDates(habits)
  const dayStreak = allCompletionDates.length ? getCurrentStreak(allCompletionDates) : prev.dayStreak
  const lastCompletedDate = getLatestCompletionDate(habits) || prev.lastCompletedDate

  const totalXpFromHabits = calculateTotalXpFromHabits(habits)
  const updatedTotalXp = xpGain > 0
    ? prev.totalXp + xpGain
    : Math.max(prev.totalXp, totalXpFromHabits)

  const baseXp = Math.min(totalXpFromHabits, prev.xpMax)
  const updatedXp = xpGain > 0
    ? Math.min(prev.xp + xpGain, prev.xpMax)
    : Math.max(prev.xp, baseXp)

  const recalculatedBadges = computeBadgesUnlocked({
    dayStreak,
    totalXp: updatedTotalXp,
    habitsCount: habits.length,
    completedTodayCount,
  })
  const badgesUnlocked = Math.max(prev.badgesUnlocked || 0, recalculatedBadges)

  return {
    ...prev,
    xp: updatedXp,
    totalXp: updatedTotalXp,
    dayStreak,
    lastCompletedDate,
    badgesUnlocked,
    badgesTotal: BADGES.length,
  }
}

// Main provider component for habit management
export function HabitProvider({ children }) {
  // User state - tracks profile, XP, streaks, and badges
  const [user, setUser] = useState({
    ...INITIAL_USER,
    badgesTotal: INITIAL_USER.badgesTotal || BADGES.length,
    badgesUnlocked: INITIAL_USER.badgesUnlocked,
    lastCompletedDate: INITIAL_USER.lastCompletedDate || null,
  })
  // Habits state - initialize with mockData to show sample habits
  const [habits, setHabits] = useState(INITIAL_HABITS)

  // Load habits from localStorage on component mount and sync with server
  useEffect(() => {
    const loadHabits = async () => {
      try {
        // Try to get habits from localStorage first (offline support)
        const stored = localStorage.getItem(HABITS_STORAGE_KEY)
        if (stored) {
          const habitsData = JSON.parse(stored)
          setHabits(habitsData)
          setUser((prev) => buildUpdatedUser(prev, 0, habitsData))
          return  // Use stored data
        }

        // Fetch from server to get latest data
        const response = await axios.get('http://localhost:5000/api/habits')
        if (response.data && response.data.length > 0) {
          setHabits(response.data)
          // Save server data to localStorage
          localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(response.data))
          setUser((prev) => buildUpdatedUser(prev, 0, response.data))
        }
      } catch (error) {
        console.error('Failed to load habits:', error)
        // Continue with initial mockData if server fails
        setUser((prev) => buildUpdatedUser(prev, 0, INITIAL_HABITS))
      }
    }

    loadHabits()
  }, [])

  // Recalculate user stats whenever habits change
  useEffect(() => {
    if (!habits.length) return
    setUser((prev) => buildUpdatedUser(prev, 0, habits))
  }, [habits])

  // Auto-save habits to localStorage whenever they change
  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits))
    }
  }, [habits])

  // Add a new habit
  const addHabit = useCallback(async (habitData) => {
    try {
      // Create new habit object with required fields
      const newHabit = {
        ...habitData,                      // name, icon, category, color, frequency, xp
        id: `habit_${Date.now()}`,         // Unique ID based on timestamp
        completedDates: [],                // Empty array - no days completed yet
        xp: habitData.xp || 10,            // XP reward for completing this habit
        streak: 0,                         // No streak for a new habit
      }

      // Try to sync with server (if available)
      try {
        const response = await axios.post('http://localhost:5000/api/habits', newHabit)
        if (response.data) {
          // If server returns updated habit, use it
          setHabits((currentHabits) => [...currentHabits, response.data])
          return response.data
        }
      } catch (serverError) {
        console.warn('Server not available, saving locally:', serverError)
      }

      // If server fails or is not available, save locally to state and localStorage
      setHabits((currentHabits) => [...currentHabits, newHabit])
      return newHabit
    } catch (error) {
      console.error('Failed to add habit:', error)
      throw error
    }
  }, [])

  // Toggle habit completion for today (check/uncheck)
  const toggleHabit = useCallback((id) => {
    const today = getToday()

    setHabits((list) =>
      list.map((h) => {
        if (h.id !== id) return h

        // Create copy of completedDates array
        const completedDates = [...(h.completedDates || [])]
        const todayIndex = completedDates.indexOf(today)
        let xpGain = 0

        if (todayIndex > -1) {
          // If today exists in array: remove it (uncheck habit)
          completedDates.splice(todayIndex, 1)
        } else {
          // If today doesn't exist: add it (check habit)
          completedDates.push(today)
          // Award XP only when completing (not when uncompleting)
          xpGain = h.xp || 10
        }

        // Create updated habit object
        const updated = {
          ...h,
          completedDates,
          streak: getCurrentStreak(completedDates),  // Recalculate streak
          week: generateWeekArray(completedDates),   // Recalculate week array
        }

        // If user completed the habit today, award XP
        if (xpGain > 0) {
          setUser((prev) => buildUpdatedUser(prev, xpGain, list.map((item) => (item.id === id ? updated : item))))
        }

        return updated
      })
    )

    // Try to sync with server (non-blocking)
    try {
      axios.patch(`http://localhost:5000/api/habits/${id}/toggle`)
    } catch (error) {
      console.error('Failed to toggle habit on server:', error)
    }
  }, [])

  // Mark habit as completed for today (mark button)
  const completeHabit = useCallback((id) => {
    const today = getToday()

    setHabits((list) =>
      list.map((h) => {
        if (h.id !== id) return h

        // Create copy of completedDates
        const completedDates = [...(h.completedDates || [])]
        
        // Only complete if not already completed today
        if (!completedDates.includes(today)) {
          completedDates.push(today)
          const xpGain = h.xp || 10
          const updated = {
            ...h,
            completedDates,
            streak: getCurrentStreak(completedDates),
            week: generateWeekArray(completedDates),
          }
          // Award XP for completing
          setUser((prev) => buildUpdatedUser(prev, xpGain, list.map((item) => (item.id === id ? updated : item))))
          return updated
        }

        return h
      })
    )

    // Try to sync with server
    try {
      axios.patch(`http://localhost:5000/api/habits/${id}`, { completed: true })
    } catch (error) {
      console.error('Failed to complete habit on server:', error)
    }
  }, [])

  // Get a specific habit by ID
  const getHabit = useCallback((id) => habits.find((h) => h.id === id), [habits])

  // Provide context to all child components
  return (
    <HabitContext.Provider value={{ user, habits, addHabit, toggleHabit, completeHabit, getHabit, isCompletedToday, getCurrentStreak }}>
      {children}
    </HabitContext.Provider>
  )
}

// Hook to use the habit context in components
export const useHabits = () => useContext(HabitContext)
