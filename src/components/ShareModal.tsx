import QRCode from 'react-qr-code'
import { X, Copy } from 'lucide-react'

interface ShareModalProps {
  galleryCode: string
  onClose: () => void
}

export const ShareModal = ({ galleryCode, onClose }: ShareModalProps) => {
  const joinUrl = `${window.location.origin}?code=${galleryCode}`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Đã copy!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-3xl max-w-md w-full border border-slate-700 shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-600 rounded-full transition-colors text-slate-300">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 pb-6 text-center">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
            Đã Xuất Bản Thành Công!
          </h2>
          <p className="text-slate-400 mb-6">Mời học sinh tham quan phòng tranh bằng các cách sau:</p>

          <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-sm">
            <QRCode value={joinUrl} size={180} />
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-left">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Mã Phòng</label>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold font-mono tracking-widest text-cyan-400">{galleryCode}</span>
                <button onClick={() => copyToClipboard(galleryCode)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-left">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Đường dẫn trực tiếp</label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-300 truncate font-mono">{joinUrl}</span>
                <button onClick={() => copyToClipboard(joinUrl)} className="p-2 text-slate-400 hover:text-white transition-colors flex-shrink-0">
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-800/80 border-t border-slate-700 text-center text-xs text-slate-500">
          © @phuongngoc091 | 0932468218
        </div>
      </div>
    </div>
  )
}
