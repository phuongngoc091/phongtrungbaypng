import { useEffect, useState } from 'react'
import { auth, db } from '../utils/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import type { UserRole } from '../store/useAuthStore'
import { ArrowLeft } from 'lucide-react'
import Swal from 'sweetalert2'

export const AuthView = () => {
  const { setView } = useStore()
  const { profile } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // Register specific fields
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile) {
      setView('teacher')
    }
  }, [profile, setView])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp!')
        }
        
        // Check uniqueness for username and phone
        const usersRef = collection(db, 'users')
        const snapshot = await getDocs(usersRef)
        const isFirstUser = snapshot.empty
        
        const existingUsername = snapshot.docs.find(d => d.data().displayName === username)
        if (existingUsername) throw new Error('Tên hiển thị này đã tồn tại!')
          
        const existingPhone = snapshot.docs.find(d => d.data().phone === phone)
        if (existingPhone) throw new Error('Số điện thoại này đã được sử dụng!')

        // 1. Create standard auth user (email uniqueness handled by Firebase automatically: auth/email-already-in-use)
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // 2. Determine if first user -> admin
        const role: UserRole = isFirstUser ? 'admin' : 'normal'

        // 3. Save profile to firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email,
          displayName: username,
          phone,
          role,
          createdAt: Date.now()
        })
        
        Swal.fire({ title: 'Thành công', text: 'Đăng ký thành công!', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false })
      }
    } catch (err: any) {
      console.error("Auth Error:", err)
      
      // Translate common Firebase errors
      if (err.code === 'auth/invalid-credential') setError('Tài khoản hoặc mật khẩu không chính xác!')
      else if (err.code === 'auth/email-already-in-use') setError('Email này đã được đăng ký!')
      else if (err.code === 'auth/weak-password') setError('Mật khẩu quá yếu (cần ít nhất 6 ký tự).')
      else if (err.code === 'auth/user-not-found') setError('Không tìm thấy tài khoản này!')
      else if (err.code === 'auth/wrong-password') setError('Sai mật khẩu!')
      else setError(err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full relative bg-slate-900 text-white">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      
      <div className="relative min-h-[100dvh] w-full flex flex-col items-center py-12 px-6 z-10">
        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl relative my-auto">
        <button 
          onClick={() => setView('home')}
          className="absolute -top-4 -left-4 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 border border-slate-600 shadow-lg transition-transform hover:scale-105"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          {isLogin ? 'Đăng Nhập Quản Lý' : 'Đăng Ký Tài Khoản'}
        </h2>

        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tên hiển thị</label>
                <input 
                  type="text" required value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Cô Ngọc..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Số điện thoại</label>
                <input 
                  type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="09..."
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mật khẩu</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Xác nhận mật khẩu</label>
              <input 
                type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg mt-6 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] transition-all flex justify-center disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
