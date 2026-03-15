import { useEffect } from 'react'
import { auth, db } from '../utils/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthStore } from '../store/useAuthStore'
import type { UserProfile } from '../store/useAuthStore'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Fetch profile
        const docRef = doc(db, 'users', currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile)
        } else {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [setUser, setProfile, setLoading])

  return <>{children}</>
}
