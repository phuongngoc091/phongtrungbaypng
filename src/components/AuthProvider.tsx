import { useEffect } from 'react'
import { auth, db } from '../utils/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '../store/useAuthStore'
import type { UserProfile } from '../store/useAuthStore'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    let profileUnsub: any = null

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        // Fetch profile
        const docRef = doc(db, 'users', currentUser.uid)
        profileUnsub = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile)
          } else {
            setProfile(null)
          }
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
        if (profileUnsub) {
          profileUnsub()
          profileUnsub = null
        }
      }
    })
    return () => {
      unsub()
      if (profileUnsub) profileUnsub()
    }
  }, [setUser, setProfile, setLoading])

  return <>{children}</>
}
