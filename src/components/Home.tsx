import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { db } from '../utils/firebase'
import { collection, query, where, limit, getDocs } from 'firebase/firestore'
import { Play } from 'lucide-react'

export const Home = () => {
  const { setView } = useStore()
  const { profile } = useAuthStore()
  const [demoProject, setDemoProject] = useState<any>(null)
  
  useEffect(() => {
    const fetchDemo = async () => {
      try {
        const q = query(
          collection(db, 'galleries'),
          where('isAdmin', '==', true),
          // We can order by createdAt desc to get the latest, or just limit 1
          limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          const doc = snap.docs[0]
          setDemoProject({ id: doc.id, ...doc.data() })
        }
      } catch (err) {
         console.warn("Could not load demo project", err);
      }
    }
    fetchDemo()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full p-6 relative bg-slate-900 text-white overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl w-full z-10 flex flex-col items-center">
        {/* Intro Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-block px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-semibold mb-6 tracking-wide backdrop-blur-sm">
            Nền tảng triễn lãm tranh nghệ thuật 3D dành cho trường học
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 mb-6 drop-shadow-[0_0_25px_rgba(236,72,153,0.3)]">
            Phòng Trưng Bày 3D
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Nơi trưng bày các tác phẩm nghệ thuật kỹ thuật số một cách sống động. 
            Khám phá không gian tương tác đa chiều, hỗ trợ nhiều chủ đề ấn tượng giúp nuôi dưỡng tâm hồn nghệ thuật của học sinh.
          </p>
        </div>

        {/* Action Cards */}
        <div className={`grid grid-cols-1 gap-8 w-full px-4 ${demoProject ? 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl' : 'md:grid-cols-2 max-w-4xl'}`}>
          
          {/* Teacher Card */}
          <div className="group relative flex flex-col items-center p-8 md:p-10 bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-700/50 hover:border-purple-400/80 hover:bg-slate-800/80 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-purple-500/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 z-10">
              <span className="text-5xl drop-shadow-lg">👩‍🏫</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-white tracking-wide z-10">Dành Cho Giáo Viên</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 flex-1 z-10">
              Đăng nhập hoặc Đăng ký để tạo phòng tranh. Tải ảnh, chọn chủ đề và gửi Mã Phòng nhanh chóng cho học sinh.
            </p>
            
            <button 
              onClick={() => setView(profile ? 'teacher' : 'auth')}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold text-lg text-white shadow-lg transition-colors z-10 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              {profile ? 'Vào Quản Lý' : 'Đăng Nhập Quản Lý'} <span className="text-xl">→</span>
            </button>
          </div>

          {/* Student Card */}
          <div className="group relative flex flex-col items-center p-8 md:p-10 bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-700/50 hover:border-cyan-400/80 hover:bg-slate-800/80 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.3)] text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-cyan-500/30 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 z-10">
              <span className="text-5xl drop-shadow-lg">🎮</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-white tracking-wide z-10">Dành Cho Học Sinh</h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 flex-1 z-10">
              Truy cập ẩn danh không cần tài khoản! Chỉ cần nhập Mã Phòng (Gallery Code) từ giáo viên để tham quan ngay.
            </p>
            
            <button 
              onClick={() => setView('student-setup')}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-bold text-lg text-white shadow-lg transition-colors z-10 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              Vào Phòng Tranh Bằng Mã <span className="text-xl">🔑</span>
            </button>
          </div>

          {/* Demo Project Form */}
          {demoProject && (
            <div className="group relative flex flex-col items-center p-8 md:p-10 bg-slate-800/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-700/50 hover:border-green-400/80 hover:bg-slate-800/80 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.3)] text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="w-full flex-1 flex flex-col items-center justify-center z-10 mb-8 border border-slate-700 rounded-2xl bg-slate-900 overflow-hidden relative">
                 {/* Try to show banner or first image */}
                 {demoProject.bannerImage || demoProject.images?.[0] ? (
                   <img src={demoProject.bannerImage || demoProject.images[0]} alt="Demo" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                 ) : (
                   <div className="absolute inset-0 flex items-center justify-center bg-slate-800 group-hover:scale-105 transition-transform duration-700">
                     <span className="text-6xl">🎨</span>
                   </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                 
                 <div className="relative z-10 mt-auto p-4 w-full">
                   <h2 className="text-2xl font-bold text-white drop-shadow-md truncate">
                     {demoProject.projectName || 'Dự Án Mẫu'}
                   </h2>
                   <p className="text-green-400 text-sm font-medium mt-1">
                     Mã: {demoProject.id}
                   </p>
                 </div>
              </div>
              
              <button 
                onClick={() => {
                  window.history.pushState({}, '', `?code=${demoProject.id}&auto=true`)
                  setView('student-setup')
                }}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-2xl font-bold text-lg text-white shadow-lg transition-colors z-10 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                <Play className="w-5 h-5"/> Vào Xem Thử Ngay
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full text-center text-slate-500/80 text-sm font-medium z-10 tracking-widest uppercase">
        © @phuongngoc091 | 0932468218
      </div>
    </div>
  )
}
