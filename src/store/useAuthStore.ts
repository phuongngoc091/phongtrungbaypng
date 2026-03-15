import { create } from 'zustand'
import type { User } from 'firebase/auth'

export type UserRole = 'admin' | 'vip' | 'normal'

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  phone: string | null
  role: UserRole
  createdAt: number
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, profile: null })
}))
