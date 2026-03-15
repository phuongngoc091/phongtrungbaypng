import { useRef, useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { useStore } from '../store/useStore'
import type { ThemeType } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { ArrowLeft, Upload, Image as ImageIcon, CheckCircle, ShieldUser, LogOut, ChevronDown, ChevronRight, Trash2, Star } from 'lucide-react'
import { db } from '../utils/firebase'
import { collection, getDocs, query, where, setDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore'
import { ShareModal } from './ShareModal'

const generateShortCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // removed similar looking chars 1,I,O,0
  let code = ''
  for(let i=0; i<6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const themes: { id: ThemeType; name: string; icon: string; desc: string; colors: string }[] = [
  { id: 'royal', name: 'Cổ Điển Hoàng Gia', icon: '🏰', desc: 'Thảm nhung đỏ, khung vàng', colors: 'border-yellow-500 bg-yellow-950/30' },
  { id: 'cute', name: 'Dễ Thương', icon: '🦄', desc: 'Tone pastel ngọt ngào', colors: 'border-pink-400 bg-pink-950/30' },
  { id: 'galaxy', name: 'Khám Phá Galaxy', icon: '🚀', desc: 'Không gian vũ trụ lấp lánh', colors: 'border-purple-500 bg-purple-950/30' },
  { id: 'aquarium', name: 'Thủy Cung', icon: '🐠', desc: 'Mát mẻ dưới đáy đại dương', colors: 'border-blue-400 bg-blue-950/30' },
]

export const TeacherView = () => {
  const { setView, uploadedImages, addUploadedImage, currentTheme, setCurrentTheme, galleryBannerText, setBannerText, galleryBannerImage, setBannerImage, projectName, setProjectName, resetGalleryState } = useStore()
  const { profile, logout } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [showSavedProjects, setShowSavedProjects] = useState(true)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  
  useEffect(() => {
    if (!profile) {
      setView('auth')
      return
    }
    fetchSavedProjects()
  }, [profile]) // eslint-disable-line

  const [savedProjects, setSavedProjects] = useState<any[]>([])

  if (!profile) return null

  const isVip = profile.role === 'vip' || profile.role === 'admin'
  const maxImages = isVip ? 15 : 3

  const fetchSavedProjects = async () => {
    try {
      const q = query(collection(db, 'galleries'), where('ownerId', '==', profile.uid))
      const snap = await getDocs(q)
      const projects: any[] = []
      snap.forEach(doc => {
        projects.push({ id: doc.id, ...doc.data() })
      })
      // Sort newest first
      projects.sort((a,b) => b.createdAt - a.createdAt)
      setSavedProjects(projects)
    } catch(err) {
      console.error(err)
    }
  }

  const loadProjectInfo = (proj: any) => {
    resetGalleryState()
    setProjectName(proj.projectName || 'Dự án cũ')
    setCurrentTheme(proj.theme || 'aquarium')
    setBannerText(proj.bannerText || 'phuongngoc091')
    setBannerImage(proj.bannerImage || null)
    if (proj.images) {
      proj.images.forEach((img: string) => addUploadedImage(img))
    }
    alert(`Đã tải dự án: ${proj.projectName}`)
  }

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm("Bạn có chắc chắn muốn xoá dự án này không?")) return
    try {
      await deleteDoc(doc(db, 'galleries', id))
      fetchSavedProjects()
    } catch (err) {
      console.error(err)
      alert('Lỗi khi xoá dự án')
    }
  }

  const handleSetAsDemo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm("Đặt dự án này làm Demo để hiển thị ngoài trang chủ?")) return
    try {
      // First un-demo all existing ones
      const q = query(collection(db, 'galleries'), where('isAdmin', '==', true))
      const snap = await getDocs(q)
      const batch = writeBatch(db)
      snap.forEach(d => {
        batch.update(doc(db, 'galleries', d.id), { isAdmin: false })
      })
      // Set the new demo
      batch.update(doc(db, 'galleries', id), { isAdmin: true })
      await batch.commit()
      fetchSavedProjects()
      alert("Đã đặt làm Demo thành công!")
    } catch (err) {
      console.error(err)
      alert("Lỗi khi đặt làm Demo")
    }
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = maxImages - uploadedImages.length
    if (remainingSlots <= 0) {
      alert(`Bạn chỉ được tải tối đa ${maxImages} ảnh.`)
      return
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 800; // Compress to max 800px

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress to webp at 0.5 quality
            const compressedDataUrl = canvas.toDataURL('image/webp', 0.5);
            addUploadedImage(compressedDataUrl);
          };
          img.src = event.target.result as string;
        }
      }
      reader.readAsDataURL(file)
    })
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBannerUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    if (!isVip) {
      alert('Chức năng tải lên Banner tuỳ chỉnh chỉ dành cho tài khoản VIP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Set specific banner dimension 1024x256
          canvas.width = 1024;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Fill black background just in case of transparency
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1024, 256);
            
            // Calculate cover math
            const imgRatio = img.width / img.height;
            const targetRatio = 1024 / 256;
            
            let drawWidth = 1024;
            let drawHeight = 256;
            let offsetX = 0;
            let offsetY = 0;

            if (imgRatio > targetRatio) {
              drawWidth = 256 * imgRatio;
              offsetX = (1024 - drawWidth) / 2;
            } else {
              drawHeight = 1024 / imgRatio;
              offsetY = (256 - drawHeight) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);
            setBannerImage(compressedDataUrl);
          }
        };
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
  }

  const handleSaveDraft = async () => {
    if (!projectName.trim()) {
      alert("Vui lòng đặt Tên Dự Án để lưu lại nhé!")
      return
    }
    setPublishing(true)
    try {
      // For saving draft without sharing, we still use the short code approach 
      // so it can be restored exactly. If we wanted to track ID we could store current projectId in Zustand.
      // For this prototype, we'll just save a new document if there's no share code active yet.
      const code = generateShortCode()
      const galleryData = {
        ownerId: profile.uid,
        isAdmin: profile.role === 'admin',
        projectName: projectName,
        theme: currentTheme,
        bannerText: isVip ? galleryBannerText : 'phuongngoc091',
        bannerImage: isVip ? galleryBannerImage : null,
        images: uploadedImages,
        createdAt: Date.now()
      }
      await setDoc(doc(db, 'galleries', code), galleryData)
      alert(`Đã lưu Dự án "${projectName}" thành công!`)
      fetchSavedProjects() // Refresh list
    } catch (err) {
      console.error(err)
      alert('Lỗi khi lưu dự án')
    } finally {
      setPublishing(false)
    }
  }

  const handlePublish = async () => {
    if (uploadedImages.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 bức tranh!')
      return
    }

    setPublishing(true)
    setPublishError(null)
    try {
      const galleryData = {
        ownerId: profile.uid,
        isAdmin: profile.role === 'admin',
        projectName: projectName,
        theme: currentTheme,
        bannerText: isVip ? galleryBannerText : 'phuongngoc091',
        bannerImage: isVip ? galleryBannerImage : null,
        images: uploadedImages, // In production setup, upload these to Firebase Storage. Doing DataURL for prototype.
        createdAt: Date.now()
      }

      // Generate a short 6-letter code
      let code = generateShortCode()
      
      await setDoc(doc(db, 'galleries', code), galleryData)
      setShareCode(code)
      fetchSavedProjects() // Refresh list
    } catch (error: any) {
      console.error("Publish Error:", error)
      setPublishError(error.message || 'Lỗi kết nối máy chủ hoặc bị từ chối quyền truy cập (Permission Denied). Vui lòng thử lại.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <>
      <div className="w-full h-full overflow-y-auto bg-slate-900 text-white p-6 md:p-12 relative">
        <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-6rem)]">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('home')}
                className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Góc Quản Lý Của Giáo Viên
                </h1>
                <p className="text-slate-400 mt-1">Xin chào {profile.displayName || profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0">
              <div className="px-4 py-2 border border-slate-700 rounded-full bg-slate-800 flex items-center gap-2 whitespace-nowrap">
                <span className={isVip ? 'text-yellow-400 font-bold' : 'text-slate-400 font-bold'}>{isVip ? 'Tài Khoản VIP' : 'Tài Khoản Thường'}</span>
                <span className="text-slate-500">| Tối Đa {maxImages} Tranh</span>
              </div>
              
              {profile.role === 'admin' && (
                <button onClick={() => setView('admin')} className="p-2 bg-slate-800 border items-center justify-center flex border-blue-500 text-blue-400 rounded-full shrink-0">
                  <ShieldUser className="w-5 h-5" />
                </button>
              )}
              
              <button onClick={logout} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors shrink-0">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Settings */}
            <div className="lg:col-span-1 space-y-8">
              
              {/* Banner Details */}
              <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
                <h2 className="text-xl font-semibold mb-4">Thông Tin Quản Lý</h2>
                
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Tên Dự Án (Chỉ hiển thị với bạn)</label>
                  <input 
                    type="text" 
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    placeholder="VD: Tiết Mỹ Thuật Lớp 5A..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Chữ hiển thị trên Banner</label>
                    <input 
                      type="text" 
                      value={isVip ? galleryBannerText : 'phuongngoc091'}
                      onChange={e => setBannerText(e.target.value)}
                      disabled={!isVip}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Ảnh Banner Tuỳ Chỉnh (1024x256 px)</label>
                    <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={!isVip}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Tải Ảnh Lên
                      </button>
                      <input 
                        type="file" 
                        ref={bannerInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleBannerUpload} 
                      />
                      {galleryBannerImage && (
                        <div className="h-10 w-32 rounded bg-slate-900 border border-slate-700 overflow-hidden relative group">
                           <img src={galleryBannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                           <button 
                             onClick={() => setBannerImage(null)}
                             className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                           >Xóa</button>
                        </div>
                      )}
                      {!galleryBannerImage && <span className="text-sm text-slate-500">Chưa có ảnh</span>}
                    </div>
                    {!isVip && <p className="text-xs text-yellow-500 mt-2">Tính năng điều chỉnh Banner chỉ dành cho VIP.</p>}
                  </div>
                </div>
              </div>



              {/* Saved Projects (Collapsible) */}
              <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 transition-all duration-300">
                <button 
                  onClick={() => setShowSavedProjects(!showSavedProjects)}
                  className="w-full flex items-center justify-between text-xl font-semibold text-green-400 group focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💾</span> Dự Án Đã Lưu
                  </div>
                  {showSavedProjects ? <ChevronDown className="w-6 h-6 group-hover:text-green-300" /> : <ChevronRight className="w-6 h-6 group-hover:text-green-300" />}
                </button>
                
                {showSavedProjects && (
                  <div className="mt-6 flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    {savedProjects.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">Chưa có dự án nào được lưu.</p>
                    ) : (
                      savedProjects.map(proj => (
                        <div key={proj.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between group hover:border-green-500/50 transition-colors cursor-pointer" onClick={() => loadProjectInfo(proj)}>
                          <div className="overflow-hidden pr-2 flex-1">
                            <p className="font-medium text-slate-200 truncate flex items-center gap-2">
                              {proj.projectName || 'Dự án (Không tên)'} 
                              {proj.isAdmin && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded shadow-[0_0_5px_rgba(234,179,8,0.3)] border border-yellow-500/30">DEMO</span>}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Mã: <span className="text-amber-400 font-mono font-bold mr-1">{proj.id}</span>
                               • {new Date(proj.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity items-center">
                            {profile.role === 'admin' && !proj.isAdmin && (
                              <button onClick={(e) => handleSetAsDemo(proj.id, e)} className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg transition-colors" title="Đặt làm Demo">
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={(e) => handleDeleteProject(proj.id, e)} className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors" title="Xoá">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
            </div>

            {/* Right Column: Image Uploads */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-2xl border border-slate-700 h-full min-h-[500px] flex flex-col relative pb-32">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-pink-400" /> Các Bức Tranh
                  </h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleSaveDraft}
                      disabled={uploadedImages.length === 0}
                      className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 text-sm border border-slate-600"
                    >
                      <CheckCircle className="w-4 h-4"/> Lưu Dự Án
                    </button>
                    <span className={`px-4 py-2 border rounded-lg text-sm font-medium ${uploadedImages.length === maxImages ? 'border-orange-500 text-orange-400' : 'border-slate-600 text-slate-300 bg-slate-800'}`}>
                      {uploadedImages.length} / {maxImages} bức
                    </span>
                  </div>
                </div>

                {/* Upload Area - Made Smaller */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 mb-4 flex flex-row items-center justify-center gap-4 transition-colors group ${
                    uploadedImages.length >= maxImages 
                      ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed' 
                      : 'border-slate-600 bg-slate-800/30 hover:bg-slate-800/50 hover:border-pink-400 cursor-pointer'
                  }`}
                  onClick={() => uploadedImages.length < maxImages && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" ref={fileInputRef} className="hidden" multiple accept="image/*"
                    onChange={handleImageUpload} disabled={uploadedImages.length >= maxImages}
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    uploadedImages.length >= maxImages ? 'bg-slate-800' : 'bg-slate-700 group-hover:bg-pink-500/20'
                  }`}>
                    <Upload className={`w-6 h-6 ${uploadedImages.length >= maxImages ? 'text-slate-600' : 'text-slate-300 group-hover:text-pink-400'}`} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-slate-200 mb-0">
                      {uploadedImages.length >= maxImages ? 'Đã đạt giới hạn tranh' : 'Nhấn để tải tranh lên'}
                    </h3>
                    <p className="text-slate-400 text-sm">Hỗ trợ JPG, PNG, WEBP</p>
                  </div>
                </div>

                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto pr-2 pb-4 pt-2 custom-scrollbar min-h-[300px]">
                  {uploadedImages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                      <ImageIcon className="w-16 h-16 mb-4 opacity-30" />
                      <p>Chưa có bức tranh nào được tải lên</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {uploadedImages.map((src, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group bg-slate-800 border border-slate-700">
                           <img src={src} alt="Uploaded" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer inside the right column */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-slate-800/90 backdrop-blur-xl border-t border-slate-700 rounded-b-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-20">
                    {publishError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm text-center">{publishError}</div>}
                    <div className="flex gap-4 max-w-2xl mx-auto items-end relative">
                      
                      {/* Theme Dropdown */}
                      <div className="relative flex-1">
                        <label className="block text-xs text-slate-400 mb-1 ml-1 uppercase font-bold tracking-wider">Chủ đề</label>
                        <button 
                          onClick={() => setShowThemeMenu(!showThemeMenu)}
                          className="w-full py-4 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all border border-slate-600 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span>{themes.find(t => t.id === currentTheme)?.icon}</span>
                            <span className="truncate">{themes.find(t => t.id === currentTheme)?.name}</span>
                          </div>
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {showThemeMenu && (
                          <div className="absolute bottom-full left-0 mb-2 w-72 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                             {themes.map((theme) => (
                               <button
                                 key={theme.id}
                                 onClick={() => { setCurrentTheme(theme.id); setShowThemeMenu(false); }}
                                 className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                                   currentTheme === theme.id ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                                 }`}
                               >
                                 <div className="text-2xl">{theme.icon}</div>
                                 <div>
                                   <div className={`font-bold text-sm ${currentTheme === theme.id ? 'text-white' : 'text-slate-300'}`}>{theme.name}</div>
                                   <div className="text-xs text-slate-400 font-normal">{theme.desc}</div>
                                 </div>
                               </button>
                             ))}
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={handlePublish}
                        disabled={publishing || uploadedImages.length === 0}
                        className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                      >
                        {publishing ? 'Đang Xử Lý...' : 'Xuất Bản / Lấy Link'}
                      </button>
                      
                      <button 
                        onClick={() => setView('gallery')}
                        className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all border border-slate-600"
                      >
                        Vào Xem Phòng Chờ
                      </button>
                    </div>
                </div>

              </div>
            </div>

          </div>

          <div className="mt-auto pt-8 text-center text-slate-500 text-sm pb-4">
            © @phuongngoc091 | 0932468218
          </div>
        </div>
      </div>

      {shareCode && <ShareModal galleryCode={shareCode} onClose={() => setShareCode(null)} />}
    </>
  )
}
