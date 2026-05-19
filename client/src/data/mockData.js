export const USER = {
  name: 'Alex',
  fullName: 'Alex Warrior',
  avatar: '🧑‍🚀',
  level: 12,
  rank: 'Legend',
  xp: 0,
  xpMax: 3200,
  dayStreak: 12,
  totalXp: 0,
  badgesUnlocked: 18,
  badgesTotal: 30,
}

export const HABITS = [
  {
    id: 'water',
    name: 'Drink Water',
    icon: '💧',
    category: 'Health',
    color: '#448AFF',
    glow: 'rgba(68, 138, 255, 0.45)',
    xp: 10,
    frequency: 'daily',
    completedDates: ['2026-05-19', '2026-05-18', '2026-05-17', '2026-05-16', '2026-05-15'],
    streak: 5,
  },
  {
    id: 'read',
    name: 'Read 30 mins',
    icon: '📚',
    category: 'Growth',
    color: '#7C4DFF',
    glow: 'rgba(124, 77, 255, 0.45)',
    xp: 15,
    frequency: 'daily',
    completedDates: ['2026-05-19', '2026-05-18', '2026-05-16', '2026-05-15', '2026-05-14', '2026-05-13'],
    streak: 6,
  },
  {
    id: 'meditate',
    name: 'Meditate',
    icon: '🧘',
    category: 'Mindfulness',
    color: '#26C6DA',
    glow: 'rgba(38, 198, 218, 0.45)',
    xp: 12,
    frequency: 'daily',
    completedDates: ['2026-05-19', '2026-05-17', '2026-05-15'],
    streak: 1,
  },
  {
    id: 'exercise',
    name: 'Morning Run',
    icon: '🏃',
    category: 'Fitness',
    color: '#FF7043',
    glow: 'rgba(255, 112, 67, 0.45)',
    xp: 20,
    frequency: 'daily',
    completedDates: ['2026-05-19', '2026-05-18', '2026-05-17', '2026-05-16'],
    streak: 4,
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: '📝',
    category: 'Growth',
    color: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    xp: 10,
    frequency: 'weekly',
    completedDates: ['2026-05-19', '2026-05-12', '2026-05-05'],
    streak: 1,
  },
  {
    id: 'run',
    name: 'Run',
    icon: '🏃',
    category: 'Fitness',
    color: '#FF6B6B',
    glow: 'rgba(255, 107, 107, 0.45)',
    xp: 25,
    frequency: 'daily',
    completedDates: ['2026-05-19', '2026-05-18'],
    streak: 2,
  },
  {
    id: 'reading',
    name: 'Read',
    icon: '📖',
    category: 'Growth',
    color: '#4ECDC4',
    glow: 'rgba(78, 205, 196, 0.45)',
    xp: 15,
    frequency: 'daily',
    completedDates: ['2026-05-19'],
    streak: 1,
  },
  {
    id: 'yoga',
    name: 'Yoga',
    icon: '🧘‍♀️',
    category: 'Wellness',
    color: '#95E1D3',
    glow: 'rgba(149, 225, 211, 0.45)',
    xp: 12,
    frequency: 'daily',
    completedDates: ['2026-05-19', '2026-05-18', '2026-05-17'],
    streak: 3,
  },
]

export const BADGES = [
  { id: 1, name: 'Consistency King', icon: '👑', unlocked: true, color: '#FBBF24' },
  { id: 2, name: 'Iron Mind', icon: '🧠', unlocked: true, color: '#7C4DFF' },
  { id: 3, name: 'Habit Master', icon: '🏆', unlocked: true, color: '#448AFF' },
  { id: 4, name: 'Early Bird', icon: '🌅', unlocked: true, color: '#FF7043' },
  { id: 5, name: 'Week Warrior', icon: '⚔️', unlocked: true, color: '#26C6DA' },
  { id: 6, name: 'Century Club', icon: '💯', unlocked: true, color: '#10B981' },
  { id: 7, name: 'Night Owl', icon: '🦉', unlocked: false, color: '#6B7280' },
  { id: 8, name: 'Unstoppable', icon: '🔥', unlocked: false, color: '#6B7280' },
]

export const HEATMAP_WEEKS = 12
export const HEATMAP_LEVELS = [0, 1, 2, 3, 4]

export function generateHeatmap() {
  const cells = []
  for (let i = 0; i < 84; i++) {
    const r = Math.sin(i * 0.4) * 0.5 + 0.5
    cells.push(Math.floor(r * 4))
  }
  return cells
}

export const CONSISTENCY_DATA = [
  { day: '1', rate: 62 },
  { day: '5', rate: 68 },
  { day: '10', rate: 71 },
  { day: '15', rate: 65 },
  { day: '20', rate: 74 },
  { day: '25', rate: 78 },
  { day: '30', rate: 78 },
]

export const COMPLETION_STATS = {
  completed: 68,
  skipped: 18,
  missed: 14,
}
