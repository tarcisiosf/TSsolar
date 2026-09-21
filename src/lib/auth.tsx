import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ADMIN_EMAIL, auth } from './firebase'

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, senha: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const value: AuthState = {
    user,
    loading,
    isAdmin: user?.email === ADMIN_EMAIL,
    signIn: async (email, senha) => {
      await signInWithEmailAndPassword(auth, email, senha)
    },
    signOut: async () => {
      await firebaseSignOut(auth)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
