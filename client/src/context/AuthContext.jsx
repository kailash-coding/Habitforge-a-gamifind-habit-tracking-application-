import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const SESSION_KEY = 'habits_app_session'
const LOCAL_USERS_KEY = 'habits_app_users'
const LOCAL_OTP_KEY = 'habits_app_otp'
const API_BASE = 'http://localhost:5000/api/auth'

const isValidGmail = (email) => /^[^\s@]+@gmail\.com$/i.test(email.trim().toLowerCase())

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

const upsertLocalUser = (email, password, name) => {
  const users = loadLocalUsers()
  let user = users.find((u) => u.email === email)
  if (!user) {
    user = {
      id: `user_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      password: String(password),
    }
    users.push(user)
  } else {
    user.password = String(password)
    if (name) user.name = name
  }
  saveLocalUsers(users)
  return user
}

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
    if (!isValidGmail(trimmedEmail)) throw new Error('Email must end with @gmail.com')
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

      const account = upsertLocalUser(
        trimmedEmail,
        '',
        name?.trim() || stored.name,
      )
      localStorage.removeItem(LOCAL_OTP_KEY)
      const session = { id: account.id, name: account.name, email: account.email }
      saveSession(session)
      setUser(session)
      setPendingOtp(null)
      return session
    }
  }, [])

  const signUp = useCallback(async ({ name, email, password }) => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || password === undefined || password === '') {
      throw new Error('Enter email and password.')
    }
    if (!isValidGmail(trimmedEmail)) {
      throw new Error('Email must end with @gmail.com')
    }

    try {
      const { data } = await axios.post(`${API_BASE}/register`, {
        name: (name || trimmedEmail.split('@')[0]).trim(),
        email: trimmedEmail,
        password,
      })
      saveSession(data.user)
      setUser(data.user)
      return data.user
    } catch (err) {
      const message = err.response?.data?.message
      if (message) throw new Error(message)

      const account = upsertLocalUser(trimmedEmail, password, name?.trim())
      const session = { id: account.id, name: account.name, email: account.email }
      saveSession(session)
      setUser(session)
      return session
    }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || password === undefined || password === '') {
      throw new Error('Enter email and password.')
    }
    if (!isValidGmail(trimmedEmail)) {
      throw new Error('Email must end with @gmail.com')
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

      const account = upsertLocalUser(trimmedEmail, password)
      const session = { id: account.id, name: account.name, email: account.email }
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
