import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { HabitProvider } from './context/HabitContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Sign from './pages/Sign'
import Home from './pages/Home'
import Habits from './pages/Habits'
import NewHabit from './pages/NewHabit'
import HabitDetail from './pages/HabitDetail'
import Analytics from './pages/Analytics'
import Badges from './pages/Badges'
import Profile from './pages/Profile'
import Upgrade from './pages/Upgrade'

export default function App() {
  return (
    <AuthProvider>
      <HabitProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sign" element={<Sign />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="habits" element={<Habits />} />
              <Route path="habits/new" element={<NewHabit />} />
              <Route path="habits/:id" element={<HabitDetail />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="badges" element={<Badges />} />
              <Route path="profile" element={<Profile />} />
              <Route path="upgrade" element={<Upgrade />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HabitProvider>
    </AuthProvider>
  )
}
