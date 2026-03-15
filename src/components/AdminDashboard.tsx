import { useEffect, useState } from 'react'
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { useAuthStore } from '../store/useAuthStore'
import type { UserProfile } from '../store/useAuthStore'
import { useStore } from '../store/useStore'
import { ArrowLeft, ShieldCheck, KeyRound, Star, User } from 'lucide-react'
import Swal from 'sweetalert2'

export const AdminDashboard = () => {
  const { profile } = useAuthStore()
  const { setView } = useStore()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setView('home')
      return
    }
    fetchUsers()
  }, [profile]) // eslint-disable-line

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'users'))
      const snapshot = await getDocs(q)
      const data: UserProfile[] = []
      snapshot.forEach(doc => {
        data.push(doc.data() as UserProfile)
      })
      // sort by newest
      setUsers(data.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveVip = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: 'vip'
      })
      // Optimistic update
      setUsers(users.map(u => u.uid === uid ? { ...u, role: 'vip' } : u))
      Swal.fire({ title: 'Thành công', text: 'Đã cập nhật tài khoản thành VIP!', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false })
    } catch (error) {
      console.error(error)
      Swal.fire('Lỗi', 'Lỗi cập nhật.', 'error')
    }
  }

  const handleRevokeVip = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: 'normal'
      })
      setUsers(users.map(u => u.uid === uid ? { ...u, role: 'normal' } : u))
      Swal.fire({ title: 'Thành công', text: 'Đã thu hồi VIP.', icon: 'success', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false })
    } catch (error) {
      console.error(error)
    }
  }

  const handleResetPassword = () => {
    // In a real app, you would probably trigger a Cloud Function
    // because Firebase Client SDK cannot arbitrarily reset passwords without email verification flows or Admin SDK.
    Swal.fire('Thông báo', 'Tính năng Reset Mật Khẩu Hàng Loạt cần cấu hình Firebase Admin SDK (Cloud Functions) để gửi email khôi phục. Hiện tại chỉ là giao diện Demo.', 'info')
  }

  if (loading) return <div className="text-white text-center mt-20">Đang tải dữ liệu...</div>

  const normalUsers = users.filter(u => u.role === 'normal')
  const vipUsers = users.filter(u => u.role === 'vip')

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('teacher')}
              className="p-3 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShieldCheck className="text-green-400 w-8 h-8" /> Quản Trị Hệ Thống
              </h1>
              <p className="text-slate-400 mt-1">Xin chào Admin {profile?.displayName}</p>
            </div>
          </div>
          
          <button 
            onClick={handleResetPassword}
            className="flex items-center gap-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 px-5 py-3 rounded-xl transition-colors font-medium"
          >
            <KeyRound className="w-5 h-5" /> Đặt lại mật khẩu tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New / Normal Users */}
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-slate-200">
              <User className="text-blue-400" /> Tài Khoản Thường ({normalUsers.length})
            </h2>
            <div className="space-y-4">
              {normalUsers.map(u => (
                <div key={u.uid} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{u.displayName || 'Chưa đặt tên'}</p>
                    <p className="text-sm text-slate-400">{u.email} • {u.phone}</p>
                  </div>
                  <button 
                    onClick={() => handleApproveVip(u.uid)}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white rounded-lg text-sm font-medium shadow-lg transition-all"
                  >
                    Duyệt VIP
                  </button>
                </div>
              ))}
              {normalUsers.length === 0 && <p className="text-slate-500 text-center py-8">Không có tài khoản thường nào.</p>}
            </div>
          </div>

          {/* VIP Users */}
          <div className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-yellow-400">
              <Star className="text-yellow-400" /> Tài Khoản VIP Đã Duyệt ({vipUsers.length})
            </h2>
            <div className="space-y-4">
              {vipUsers.map(u => (
                <div key={u.uid} className="bg-slate-800 p-4 rounded-xl border border-yellow-500/30 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-bl-full pointer-events-none"></div>
                  <div>
                    <p className="font-medium text-yellow-100 flex items-center gap-2">
                      {u.displayName}
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/20">VIP</span>
                    </p>
                    <p className="text-sm text-slate-400">{u.email} • {u.phone}</p>
                  </div>
                  <button 
                    onClick={() => handleRevokeVip(u.uid)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors border border-slate-600"
                  >
                    Hủy VIP
                  </button>
                </div>
              ))}
              {vipUsers.length === 0 && <p className="text-slate-500 text-center py-8">Chưa có tài khoản VIP nào.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
