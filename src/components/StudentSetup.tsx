import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Home, User, Play, Hash } from 'lucide-react'
import { db } from '../utils/firebase'
import { doc, getDoc, getDocs, collection, query } from 'firebase/firestore'

const characters = [
  { id: 'boy', name: 'Học Sinh Nam', icon: '👦', bg: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400 text-blue-100' },
  { id: 'girl', name: 'Học Sinh Nữ', icon: '👧', bg: 'bg-pink-500/20 hover:bg-pink-500/30 border-pink-400 text-pink-100' },
  { id: 'robot', name: 'Rô Bốt', icon: '🤖', bg: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400 text-purple-100' },
] as const

export const StudentSetup = () => {
  const { setView, setStudentInfo, setCurrentTheme, setBannerText, setBannerImage, resetGalleryState, addUploadedImage } = useStore()
  const [nickname, setNickname] = useState(`Khách ${Math.floor(Math.random() * 1000)}`)
  const [galleryCode, setGalleryCode] = useState('')
  const [selectedChar, setSelectedChar] = useState<'boy' | 'girl' | 'robot'>('boy')
  const [loading, setLoading] = useState(false)

  const [autoJoin, setAutoJoin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const auto = params.get('auto')
    if (code) {
      setGalleryCode(code)
    }
    if (auto === 'true') {
      setAutoJoin(true)
    }
    
    // Clear the URL so if the user clicks "Home" they don't get trapped by App.tsx redirect
    if (code || auto) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const handleEnterGallery = async () => {
    if (!nickname.trim()) {
      alert("Vui lòng nhập tên của bạn nhé!")
      return
    }
    
    if (!galleryCode.trim()) {
      alert("Vui lòng nhập Mã Phòng Trưng Bày để vào!")
      return
    }

    setLoading(true)
    try {
      const docRef = doc(db, 'galleries', galleryCode.trim())
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        resetGalleryState()
        
        // Restore Gallery State from DB
        setCurrentTheme(data.theme)
        setBannerText(data.bannerText || 'phuongngoc091')
        setBannerImage(data.bannerImage || null)
        
        // Fetch images array from subcollection if data is stored in the new chunked format
        let projectImages = data.images || [];
        if (!data.images && data.imageCount > 0) {
           const imgsQuery = query(collection(db, 'galleries', galleryCode.trim(), 'images'));
           const imgsSnap = await getDocs(imgsQuery);
           const fetchedImgs: any[] = [];
           imgsSnap.forEach(d => fetchedImgs.push(d.data()));
           fetchedImgs.sort((a,b) => a.index - b.index);
           projectImages = fetchedImgs;
        }

        if (projectImages) {
          projectImages.forEach((img: any) => addUploadedImage(img))
        }

        setStudentInfo({ nickname, characterType: selectedChar })
        setView('gallery')
      } else {
        alert("Mã Phòng không hợp lệ hoặc phòng không tồn tại!")
      }
    } catch (error) {
      console.error(error)
      alert("Lỗi khi tải phòng tranh!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full relative bg-slate-900 text-white">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
      
      <div className="relative min-h-[100dvh] w-full flex flex-col items-center py-12 px-6 md:px-12 z-10">
        <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700 p-8 md:p-12 shadow-2xl relative my-auto">
        <button 
          onClick={(e) => {
            e.preventDefault()
            setView('home')
          }}
          className="absolute top-8 left-8 p-3 bg-slate-700/50 rounded-full hover:bg-slate-600 transition-colors z-50 cursor-pointer"
        >
          <Home className="w-6 h-6" />
        </button>

        <div className="text-center mb-10 mt-6 md:mt-2">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-3 drop-shadow-sm">
            Tạo Nhân Vật
          </h1>
          <p className="text-slate-400 text-lg">Chuẩn bị bước vào phòng trưng bày nào!</p>
        </div>

        <div className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nickname Input (Always show now, even for AutoJoin so they can change name) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> Tên của bạn là gì?
              </label>
              <input 
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="Ví dụ: Khách 123, Tom, Bún, Kẹo..."
                className="w-full bg-slate-900/80 border border-slate-600 rounded-2xl px-5 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner placeholder-slate-500"
              />
            </div>

            {/* Room Code - Hide if autoJoin */}
            {!autoJoin ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-amber-400" /> Mã Phòng Nhập Tại Đây
                </label>
                <input 
                  type="text"
                  value={galleryCode}
                  onChange={(e) => setGalleryCode(e.target.value)}
                  placeholder="Dán mã code phòng..."
                  className="w-full bg-slate-900/80 border border-amber-600/50 rounded-2xl px-5 py-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-inner text-amber-400 placeholder-slate-500 font-mono"
                />
              </div>
            ) : (
               <div className="text-center py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col justify-center">
                 <p className="text-emerald-400 font-medium">✨ Chào mừng bạn khám phá phòng tranh Demo! ✨</p>
                 <p className="text-slate-400 text-sm mt-1">Đã kết nối mã phòng tự động.</p>
               </div>
            )}
          </div>

          {/* Character Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              Chọn một nhân vật:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedChar(char.id)}
                  className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all duration-300 group ${char.bg} ${
                    selectedChar === char.id 
                      ? 'scale-[1.05] shadow-[0_0_25px_rgba(255,255,255,0.15)] border-opacity-100 bg-opacity-40' 
                      : 'border-opacity-30 opacity-70 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  <div className="w-24 h-24 mb-4 transform transition-transform group-hover:scale-110 flex items-center justify-center">
                     {char.id === 'boy' && <img src="/boy-model.png" alt="Boy" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display='none'} />}
                     {char.id === 'girl' && <img src="/girl-model.png" alt="Girl" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display='none'} />}
                     {char.id === 'robot' && <img src="/robot-model.png" alt="Robot" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display='none'} />}
                     {/* Fallback emoji if no image */}
                     <span className="text-5xl absolute -z-10 opacity-30">{char.icon}</span>
                  </div>
                  <span className={`font-bold text-sm md:text-base ${selectedChar === char.id ? 'text-white' : ''}`}>
                    {char.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Enter Button */}
          <div className="pt-6 border-t border-slate-700/50">
            <button 
              onClick={handleEnterGallery}
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-blue-500 hover:from-blue-400 to-cyan-500 hover:to-cyan-400 rounded-2xl text-white font-bold text-xl uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang vào phòng...' : <><Play className="w-6 h-6 group-hover:translate-x-1 transition-transform" /> Vào Phòng Trưng Bày</>}
            </button>
          </div>
        </div>
        
        <div className="absolute -bottom-10 left-0 w-full flex flex-col items-center justify-center gap-1 text-xs">
          <p className="text-slate-300 font-medium tracking-wide">Tác giả: Phạm Phương Ngọc & Võ Thị Lệ Thu</p>
          <p className="text-slate-500 tracking-wider uppercase text-[10px]">Trường Tiểu học Nguyễn Duy Trinh</p>
        </div>
        </div>
      </div>
    </div>
  )
}
