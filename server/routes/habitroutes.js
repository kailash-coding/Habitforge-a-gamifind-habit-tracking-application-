const express = require('express');
const router = express.Router();

let habits = [
  {
    id: 'water',
    name: 'Drink Water',
    icon: '💧',
    category: 'Health',
    color: '#448AFF',
    glow: 'rgba(68, 138, 255, 0.45)',
    streak: 8,
    xp: 10,
    frequency: 'daily',
    completed: false,
    week: [true, true, true, true, true, false, false],
    completedDates: [],
  },
  {
    id: 'read',
    name: 'Read 30 mins',
    icon: '📚',
    category: 'Growth',
    color: '#7C4DFF',
    glow: 'rgba(124, 77, 255, 0.45)',
    streak: 5,
    xp: 15,
    frequency: 'daily',
    completed: true,
    week: [true, true, false, true, true, true, false],
    completedDates: [],
  },
  {
    id: 'meditate',
    name: 'Meditate',
    icon: '🧘',
    category: 'Mindfulness',
    color: '#26C6DA',
    glow: 'rgba(38, 198, 218, 0.45)',
    streak: 3,
    xp: 12,
    frequency: 'daily',
    completed: false,
    week: [true, false, true, false, true, false, false],
    completedDates: [],
  },
  {
    id: 'exercise',
    name: 'Morning Run',
    icon: '🏃',
    category: 'Fitness',
    color: '#FF7043',
    glow: 'rgba(255, 112, 67, 0.45)',
    streak: 6,
    xp: 20,
    frequency: 'daily',
    completed: false,
    week: [true, true, true, true, false, true, false],
    completedDates: [],
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: '📝',
    category: 'Growth',
    color: '#EC4899',
    glow: 'rgba(236, 72, 153, 0.45)',
    streak: 4,
    xp: 10,
    frequency: 'weekly',
    completed: false,
    week: [false, true, false, true, true, false, false],
    completedDates: [],
  },
];

const getToday = () => new Date().toISOString().split('T')[0];

router.get('/', (req, res) => {
  res.json(habits);
});

router.get('/:id', (req, res) => {
  const habit = habits.find((item) => item.id === req.params.id);
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }
  res.json(habit);
});

const getCurrentStreak = (completedDates = []) => {
  const dates = [...new Set(completedDates)];
  const today = new Date();
  let streak = 0;

  for (let offset = 0; ; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().split('T')[0];
    if (!dates.includes(key)) break;
    streak += 1;
  }

  return streak;
};

router.patch('/:id/toggle', (req, res) => {
  const habit = habits.find((item) => item.id === req.params.id);
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  const today = getToday();
  const completedDates = [...(habit.completedDates || [])];
  const todayIndex = completedDates.indexOf(today);

  if (todayIndex > -1) {
    completedDates.splice(todayIndex, 1);
  } else {
    completedDates.push(today);
  }

  habit.completedDates = completedDates;
  habit.streak = getCurrentStreak(completedDates);
  habit.completed = completedDates.includes(today);

  res.json(habit);
});

router.patch('/:id', (req, res) => {
  const habit = habits.find((item) => item.id === req.params.id);
  if (!habit) {
    return res.status(404).json({ message: 'Habit not found' });
  }

  Object.assign(habit, req.body);

  const today = getToday();
  if (req.body.markComplete === true && !habit.completedDates.includes(today)) {
    habit.completedDates.push(today);
    habit.streak = getCurrentStreak(habit.completedDates);
    habit.completed = true;
  }

  res.json(habit);
});

router.post('/', (req, res) => {
  const newHabit = {
    id: req.body.id || Date.now().toString(),
    name: req.body.name || 'New Habit',
    icon: req.body.icon || '📝',
    category: req.body.category || 'General',
    color: req.body.color || '#888',
    glow: req.body.glow || 'rgba(0,0,0,0.1)',
    streak: req.body.streak || 0,
    xp: req.body.xp || 0,
    frequency: req.body.frequency || 'daily',
    completed: req.body.completed || false,
    week: req.body.week || [false, false, false, false, false, false, false],
    completedDates: req.body.completedDates || [],
  };

  habits.push(newHabit);
  res.status(201).json(newHabit);
});

module.exports = router;
