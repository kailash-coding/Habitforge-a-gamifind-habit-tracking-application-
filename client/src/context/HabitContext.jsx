import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'
import { USER as INITIAL_USER, BADGES, HABITS as INITIAL_HABITS } from '../data/mockData'
import { useAuth } from './AuthContext'
import {
  getTodayKey,
  getHabitXp,
  toDateKey,
  colorToGlow,
  getLevelProgress,
  getRankForLevel,
  getMonthlyXpStats,
  getMonthPerfectStreak,
  getMonthPerfectDays,
} from '../utils/habitStats'

const HabitContext = createContext(null)

const HABITS_STORAGE_KEY = 'habits_app_data'

export const getToday = getTodayKey

const normalizeHabit = (habit) => {
  let completedDates = Array.isArray(habit.completedDates) ? [...habit.completedDates] : []
  const today = getToday()
  if (habit.completed === true && !completedDates.includes(today)) {
    completedDates.push(today)
  }
  const color = habit.color || '#7C4DFF'
  return {
    ...habit,
    color,
    glow: habit.glow || colorToGlow(color),
    xp: getHabitXp(habit),
    frequency: habit.frequency || 'daily',
    completedDates,
  }
}



const loadHabitsFromStorage = () => {

  try {

    const stored = localStorage.getItem(HABITS_STORAGE_KEY)

    if (stored === null) return null

    const parsed = JSON.parse(stored)

    if (!Array.isArray(parsed)) return null

    return parsed.map(normalizeHabit)

  } catch {

    return null

  }

}



export const isCompletedToday = (habit) => {

  const today = getToday()

  return habit.completedDates?.includes(today) ?? false

}



const getCurrentStreak = (completedDates = []) => {
  const dates = [...new Set(completedDates)]
  const today = new Date()
  let streak = 0

  for (let offset = 0; ; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = toDateKey(date)
    if (!dates.includes(key)) break
    streak += 1
  }

  return streak
}



const generateWeekArray = (completedDates = []) => {

  const week = []

  for (let i = 6; i >= 0; i--) {

    const date = new Date()

    date.setDate(date.getDate() - i)

    const key = date.toISOString().split('T')[0]

    week.push(completedDates.includes(key))

  }

  return week

}



const computeBadgesUnlocked = ({ dayStreak, totalXp, habitsCount, completedTodayCount }) => {

  const criteria = [

    dayStreak >= 1,

    dayStreak >= 3,

    dayStreak >= 7,

    totalXp >= 1000,

    totalXp >= 2000,

    completedTodayCount >= 1,

    completedTodayCount >= 3,

    habitsCount >= 5,

  ]

  return criteria.filter(Boolean).length

}



const getAllCompletionDates = (habits) => habits.flatMap((habit) => habit.completedDates || [])



const calculateTotalXpFromHabits = (habits) =>
  habits.reduce(
    (sum, habit) => sum + (habit.completedDates?.length || 0) * getHabitXp(habit),
    0,
  )

const calculateTodayXpFromHabits = (habits) => {
  const today = getToday()
  return habits.reduce((sum, habit) => {
    if (!habit.completedDates?.includes(today)) return sum
    return sum + getHabitXp(habit)
  }, 0)
}



const getLatestCompletionDate = (habits) => {

  const dates = [...new Set(getAllCompletionDates(habits))]

  if (!dates.length) return null

  return dates.sort()[dates.length - 1]

}



const buildUpdatedUser = (prev, habits) => {
  const completedTodayCount = habits.filter(isCompletedToday).length
  const allCompletionDates = getAllCompletionDates(habits)
  const dayStreak = allCompletionDates.length ? getCurrentStreak(allCompletionDates) : 0
  const lastCompletedDate = getLatestCompletionDate(habits)

  const totalXpFromHabits = calculateTotalXpFromHabits(habits)
  const todayXp = calculateTodayXpFromHabits(habits)
  const dailyXpMax = habits.reduce((sum, habit) => sum + getHabitXp(habit), 0)
  const { level, xpInLevel, xpMax } = getLevelProgress(totalXpFromHabits)

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthly = getMonthlyXpStats(habits, year, month)

  const badgesUnlocked = computeBadgesUnlocked({
    dayStreak,
    totalXp: totalXpFromHabits,
    habitsCount: habits.length,
    completedTodayCount,
  })

  return {
    ...prev,
    level,
    rank: getRankForLevel(level),
    xp: xpInLevel,
    xpMax,
    xpToNext: xpMax - xpInLevel,
    todayXp,
    totalXp: totalXpFromHabits,
    dailyXpMax: dailyXpMax || prev.xpMax,
    dayStreak,
    monthStreak: getMonthPerfectStreak(habits, year, month),
    monthPerfectDays: getMonthPerfectDays(habits, year, month),
    monthlyXpEarned: monthly.earned,
    monthlyXpBudget: monthly.budget,
    monthlyXpPercent: monthly.percent,
    lastCompletedDate,
    badgesUnlocked,
    badgesTotal: BADGES.length,
  }
}



const getInitialHabits = () => {

  const stored = loadHabitsFromStorage()

  if (stored !== null) return stored

  return INITIAL_HABITS.map(normalizeHabit)

}



const getInitialUser = (habits) =>
  buildUpdatedUser(
    {
      ...INITIAL_USER,
      badgesTotal: INITIAL_USER.badgesTotal || BADGES.length,
      badgesUnlocked: INITIAL_USER.badgesUnlocked,
      lastCompletedDate: INITIAL_USER.lastCompletedDate || null,
    },
    habits,
  )

export function HabitProvider({ children }) {
  const { user: authUser } = useAuth()
  const [habits, setHabits] = useState(getInitialHabits)
  const [user, setUser] = useState(() => getInitialUser(getInitialHabits()))

  const skipNextSave = useRef(true)

  useEffect(() => {
    if (!authUser?.name) return
    const firstName = authUser.name.split(' ')[0]
    setUser((prev) => ({
      ...prev,
      name: firstName,
      fullName: authUser.name,
    }))
  }, [authUser])



  useEffect(() => {

    const syncFromServer = async () => {

      if (loadHabitsFromStorage() !== null) return



      try {

        const response = await axios.get('http://localhost:5000/api/habits')

        if (response.data?.length) {

          const normalized = response.data.map(normalizeHabit)

          setHabits(normalized)

        }

      } catch (error) {

        console.warn('Server not available, using local habits:', error)

      }

    }



    syncFromServer()

  }, [])



  useEffect(() => {

    setUser((prev) => buildUpdatedUser(prev, habits))

  }, [habits])



  useEffect(() => {

    if (skipNextSave.current) {

      skipNextSave.current = false

      return

    }

    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits))

  }, [habits])



  const addHabit = useCallback(async (habitData) => {

    const newHabit = normalizeHabit({

      ...habitData,

      id: `habit_${Date.now()}`,

      completedDates: [],

      xp: getHabitXp(habitData),

      streak: 0,

    })



    try {

      const response = await axios.post('http://localhost:5000/api/habits', newHabit)

      if (response.data) {

        const saved = normalizeHabit(response.data)

        setHabits((currentHabits) => [...currentHabits, saved])

        return saved

      }

    } catch (serverError) {

      console.warn('Server not available, saving locally:', serverError)

    }



    setHabits((currentHabits) => [...currentHabits, newHabit])

    return newHabit

  }, [])



  const toggleHabit = useCallback((id) => {

    const today = getToday()



    setHabits((list) =>

      list.map((h) => {

        if (h.id !== id) return h



        const completedDates = [...(h.completedDates || [])]
        const todayIndex = completedDates.indexOf(today)

        if (todayIndex > -1) {
          completedDates.splice(todayIndex, 1)
        } else {
          completedDates.push(today)
        }

        return {
          ...h,
          completedDates,
          streak: getCurrentStreak(completedDates),
          week: generateWeekArray(completedDates),
        }

      })

    )



    axios.patch(`http://localhost:5000/api/habits/${id}/toggle`).catch((error) => {

      console.warn('Failed to toggle habit on server:', error)

    })

  }, [])



  const completeHabit = useCallback((id) => {

    const today = getToday()



    setHabits((list) =>

      list.map((h) => {

        if (h.id !== id) return h



        const completedDates = [...(h.completedDates || [])]



        if (!completedDates.includes(today)) {
          completedDates.push(today)
          return {
            ...h,
            completedDates,
            streak: getCurrentStreak(completedDates),
            week: generateWeekArray(completedDates),
          }
        }



        return h

      })

    )



    axios.patch(`http://localhost:5000/api/habits/${id}`, { markComplete: true }).catch((error) => {

      console.warn('Failed to complete habit on server:', error)

    })

  }, [])



  const getHabit = useCallback((id) => habits.find((h) => h.id === id), [habits])



  return (

    <HabitContext.Provider

      value={{

        user,

        habits,

        addHabit,

        toggleHabit,

        completeHabit,

        getHabit,

        isCompletedToday,

        getCurrentStreak,

        getToday,

      }}

    >

      {children}

    </HabitContext.Provider>

  )

}



export const useHabits = () => useContext(HabitContext)


