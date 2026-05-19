import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const SESSION_KEY = 'habits_app_session'
const LOCAL_USERS_KEY = 'habits_app_users'
const LOCAL_OTP_KEY = 'habits_app_otp'
const API_BASE = 'http://localhost:5000/api/auth'

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saveSession = (user) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

const loadLocalUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveLocalUsers = (users) => {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

const saveLocalOtp = (payload) => {
  localStorage.setItem(
    LOCAL_OTP_KEY,
    JSON.stringify({ ...payload, expires: Date.now() + 5 * 60 * 1000 }),
  )
}

const getLocalOtp = (email, purpose) => {
  try {
    const raw = localStorage.getItem(LOCAL_OTP_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.email !== email || data.purpose !== purpose) return null
    if (Date.now() > data.expires) {
      localStorage.removeItem(LOCAL_OTP_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

const generateLocalOtp = () => String(Math.floor(100000 + Math.random() * 900000))

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession)
  const [loading, setLoading] = useState(true)
  const [pendingOtp, setPendingOtp] = useState(null)

  useEffect(() => {
    const checkStatus = async () => {
      const session = loadSession()
      if (!session) {
        setLoading(false)
        return
      }
      try {
        const { data } = await axios.get(`${API_BASE}/status`, {
          headers: { 'X-User-Id': session.id },
        })
        if (data.user) setUser(data.user)
      } catch {
        setUser(session)
      } finally {
        setLoading(false)
      }
    }
    checkStatus()
  }, [])

  const sendOtp = useCallback(async ({ email, purpose, name }) => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) throw new Error('Please enter your email.')
    if (purpose === 'signup' && !name?.trim()) {
      throw new Error('Please enter your name.')
    }

    try {
      const { data } = await axios.post(`${API_BASE}/otp/send`, {
        email: trimmedEmail,
        purpose,
        name: name?.trim(),
      })
      setPendingOtp({ email: trimmedEmail, purpose, name: name?.trim() })
      return data
    } catch (err) {
      const message = err.response?.data?.message
      if (message) throw new Error(message)

      const users = loadLocalUsers()
      if (purpose === 'signup' && users.some((u) => u.email === trimmedEmail)) {
        throw new Error('Email already registered. Sign in instead.')
      }
      if (purpose === 'signin' && !users.some((u) => u.email === trimmedEmail)) {
        throw new Error('No account found. Sign up first.')
      }

      const code = generateLocalOtp()
      saveLocalOtp({ email: trimmedEmail, purpose, name: name?.trim(), code })
      setPendingOtp({ email: trimmedEmail, purpose, name: name?.trim() })
      return {
        message: 'Verification code generated (offline mode).',
        devOtp: code,
        expiresIn: 300,
      }
    }
  }, [])

  const verifyOtp = useCallback(async ({ email, otp, purpose, name }) => {
    const trimmedEmail = email.trim().toLowerCase()
    const code = String(otp).trim()
    if (!code || code.length !== 6) {
      throw new Error('Enter the 6-digit code from your email.')
    }

    try {
      const { data } = await axios.post(`${API_BASE}/otp/verify`, {
        email: trimmedEmail,
        otp: code,
        purpose,
      })
      saveSession(data.user)
      setUser(data.user)
      setPendingOtp(null)
      return data.user
    } catch (err) {
      const message = err.response?.data?.message
      if (message) throw new Error(message)

      const stored = getLocalOtp(trimmedEmail, purpose)
      if (!stored || stored.code !== code) {
        throw new Error('Invalid or expired code.')
      }

      const users = loadLocalUsers()
      let account = users.find((u) => u.email === trimmedEmail)

      if (purpose === 'signup') {
        if (account) throw new Error('Email already registered.')
        account = {
          id: `user_${Date.now()}`,
          name: name?.trim() || stored.name,
          email: trimmedEmail,
        }
        users.push(account)
        saveLocalUsers(users)
      } else if (!account) {
        throw new Error('Account not found.')
      }

      localStorage.removeItem(LOCAL_OTP_KEY)
      const session = { id: account.id, name: account.name, email: account.email }
      saveSession(session)
      setUser(session)
      setPendingOtp(null)
      return session
    }
  }, [])

  const signUp = useCallback(async ({ name, email, password }) => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName || !trimmedEmail || !password) {
      throw new Error('Please fill in all fields.')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }

    try {
      const { data } = await axios.post(`${API_BASE}/register`, {
        name: trimmedName,
        email: trimmedEmail,
        password,
      })
      saveSession(data.user)
      setUser(data.user)
      return data.user
    } catch (err) {
      const message = err.response?.data?.message
      if (message) throw new Error(message)

      const users = loadLocalUsers()
      if (users.some((u) => u.email === trimmedEmail)) {
        throw new Error('Email already registered.')
      }
      const newUser = {
        id: `user_${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        password,
      }
      users.push(newUser)
      saveLocalUsers(users)
      const session = { id: newUser.id, name: newUser.name, email: newUser.email }
      saveSession(session)
      setUser(session)
      return session
    }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !password) {
      throw new Error('Please enter email and password.')
    }

    try {
      const { data } = await axios.post(`${API_BASE}/login`, {
        email: trimmedEmail,
        password,
      })
      saveSession(data.user)
      setUser(data.user)
      return data.user
    } catch (err) {
      const message = err.response?.data?.message
      if (message) throw new Error(message)

      const users = loadLocalUsers()
      const match = users.find((u) => u.email === trimmedEmail && u.password === password)
      if (!match) {
        const account = users.find((u) => u.email === trimmedEmail)
        throw new Error(
          account && !account.password
            ? 'This account uses email OTP. Switch to Email OTP to sign in.'
            : 'Invalid email or password.',
        )
      }

      const session = { id: match.id, name: match.name, email: match.email }
      saveSession(session)
      setUser(session)
      return session
    }
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setPendingOtp(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        loading,
        pendingOtp,
        sendOtp,
        verifyOtp,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
