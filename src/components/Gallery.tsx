import { Suspense, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import type { ThemeType } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { ArrowLeft, Eye, User, ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight, Gamepad2, MessageSquare } from 'lucide-react'
import { Player } from './Player'
import { Room } from './Room'
import { ArtFrames } from './ArtFrames'
import { Multiplayer } from './Multiplayer'

// Keyboard mapping for Drei's KeyboardControls
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
]

// Theme configuration for lights/fog
const themeSettings: Record<ThemeType, { bg: string; fog: string; light: string; ambientIntensity: number }> = {
  royal: { bg: '#2b1a10', fog: '#1a0d05', light: '#ffecb3', ambientIntensity: 0.8 },
  cute: { bg: '#ffd1dc', fog: '#ffb7b2', light: '#ffffff', ambientIntensity: 1.2 },
  galaxy: { bg: '#02000d', fog: '#050510', light: '#a78bfa', ambientIntensity: 0.4 },
  aquarium: { bg: '#00426b', fog: '#002244', light: '#8be9fd', ambientIntensity: 0.7 },
}

const LookJoystick = () => {
  const setJoystickState = useStore(s => s.setJoystickState)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const center = useRef({ x: 0, y: 0 })
  const lastTap = useRef(0)

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    
    // Check double tap
    const now = Date.now()
    if (now - lastTap.current < 300) {
      setJoystickState({ resetLook: true })
      setTimeout(() => setJoystickState({ resetLook: false }), 100)
    }
    lastTap.current = now;
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - center.current.x;
    const dy = e.clientY - center.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 40; // Max visual travel
    
    let nx = dx;
    let ny = dy;
    if (distance > maxDist) {
       nx = (dx / distance) * maxDist;
       ny = (dy / distance) * maxDist;
    }
    
    setPosition({ x: nx, y: ny });
    // Normalize to -1..1
    setJoystickState({ camPan: nx / maxDist, camTilt: ny / maxDist });
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setPosition({ x: 0, y: 0 });
    setJoystickState({ camPan: 0, camTilt: 0 });
  }

  return (
    <div 
      className="w-24 h-24 md:w-32 md:h-32 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center touch-none select-none relative"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-white/20 pointer-events-none" />
      <div 
        className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)] absolute pointer-events-none"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <div className="absolute inset-1.5 md:inset-2 rounded-full border border-white/30" />
      </div>
    </div>
  )
}

export const Gallery = () => {
  const setView = useStore(s => s.setView)
  const currentTheme = useStore(s => s.currentTheme)
  const studentInfo = useStore(s => s.studentInfo)
  const cameraView = useStore(s => s.cameraView)
  const setCameraView = useStore(s => s.setCameraView)
  const setJoystickState = useStore(s => s.setJoystickState)
  const setChatMessage = useStore(s => s.setChatMessage)

  const profile = useAuthStore(s => s.profile)
  const [isJoystickUIOpen, setIsJoystickUIOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) {
      setIsChatOpen(false)
      return;
    }
    setChatMessage(chatInput.trim())
    setChatInput('')
    setIsChatOpen(false)
  }
  
  const theme = themeSettings[currentTheme]

  const handleBack = () => {
    // If studentInfo is present, they joined as a student, so go home.
    // If no studentInfo, they must be a teacher previewing, so go to teacher.
    if (studentInfo) {
      setView('home')
    } else if (profile) {
      setView('teacher')
    } else {
      setView('home')
    }
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 md:gap-4 md:top-6 md:left-6">
        <button 
          onClick={handleBack}
          className="p-2 md:p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors text-white border border-white/20 shadow-lg flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        {studentInfo && (
          <div className="px-3 md:px-6 py-2 md:py-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20 flex flex-wrap items-center gap-2 md:gap-3 shadow-lg">
            <span className="font-bold text-sm md:text-lg whitespace-nowrap">{studentInfo.nickname}</span>
            <span className="text-[10px] md:text-sm opacity-80 backdrop: uppercase tracking-wider bg-white/10 px-1 md:px-2 py-0.5 rounded">
              {studentInfo.characterType}
            </span>
          </div>
        )}
      </div>

      {/* Action Controls Overlay (Right side) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 md:top-6 md:right-6">
        <button 
          onClick={() => setCameraView(cameraView === '1st' ? '3rd' : '1st')}
          className="px-3 py-2 md:px-4 md:py-3 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-xl transition-all border border-white/20 shadow-lg flex items-center gap-1 md:gap-2 text-xs md:text-base text-white"
        >
          {cameraView === '1st' ? <Eye className="w-4 h-4 md:w-5 md:h-5 text-pink-400" /> : <User className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />} 
          <span className="hidden sm:inline">
            Góc Nhìn: <strong className={cameraView === '1st' ? 'text-pink-400' : 'text-blue-400'}>{cameraView === '1st' ? 'Nhìn Gần' : 'Theo Dõi'}</strong>
          </span>
        </button>
        
        {/* Joystick Toggle Button */}
        <button 
          onClick={() => setIsJoystickUIOpen(!isJoystickUIOpen)}
          className={`px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-lg backdrop-blur-md border transition-all flex xl:hidden items-center gap-1 md:gap-2 text-xs md:text-base ${
            isJoystickUIOpen 
              ? 'bg-pink-500 text-white border-pink-400' 
              : 'bg-black/60 text-slate-300 border-white/20 hover:bg-black/80'
          }`}
          title="Bật/Tắt phím di chuyển"
        >
          <Gamepad2 className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">{isJoystickUIOpen ? 'Tắt Phím' : 'Bật Phím'}</span>
        </button>
      </div>

      {/* Desktop Chat Input */}
      <div className="hidden md:flex absolute bottom-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-md">
        <form onSubmit={handleSendChat} className="w-full relative">
          <input 
            type="text" 
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Nhập chat để ghim trên đầu nhân vật..."
            className="w-full bg-black/60 border border-white/20 rounded-full px-6 py-3 text-white placeholder:text-white/50 backdrop-blur-md focus:outline-none focus:border-pink-500 shadow-xl"
            maxLength={60}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-2 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/90 bg-black/60 px-8 py-3 rounded-full backdrop-blur-md pointer-events-none shadow-xl border border-white/10">
        Dùng phím <strong className="text-yellow-400">W A S D</strong> hoặc <strong className="text-yellow-400">Mũi Tên</strong> để di chuyển và xoay nhân vật.
      </div>

      {/* 3D Canvas */}
      <KeyboardControls map={keyboardMap}>
        <Canvas shadows camera={{ fov: 60, position: [0, 5, 10] }}>
          <color attach="background" args={[theme.bg]} />
          <fog attach="fog" args={[theme.fog, 15, 60]} />
          
          <ambientLight intensity={theme.ambientIntensity} color={theme.light} />
          
          <Suspense fallback={null}>
            <Room theme={currentTheme} />
            <ArtFrames />
            <Multiplayer galleryId={window.location.hash || 'default-room'} />
          </Suspense>
          <Player />
        </Canvas>
      </KeyboardControls>

      {/* Mobile Chat Button Component */}
      <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-pink-500 text-white px-5 py-2.5 rounded-full shadow-lg font-bold flex items-center gap-2 border border-pink-400 active:scale-95 transition-transform"
          >
            <MessageSquare className="w-4 h-4" /> Chat
          </button>
        ) : (
          <form onSubmit={handleSendChat} className="flex gap-2 w-[80vw] max-w-sm animate-in fade-in slide-in-from-bottom-2">
            <input 
              autoFocus
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onBlur={() => !chatInput && setIsChatOpen(false)}
              placeholder="Nhập chat..."
              className="flex-1 bg-black/80 border border-white/30 rounded-full px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pink-500 backdrop-blur-md"
              maxLength={60}
            />
            <button type="submit" className="bg-pink-500 text-white p-2.5 rounded-full shadow-lg border border-pink-400">
               <ArrowUp className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>

      {/* Mobile Controls (D-Pads) */}
      {isJoystickUIOpen && (
        <>
          {/* Look Controls (Left) */}
          <div className="fixed bottom-6 left-6 z-[999] animate-in slide-in-from-bottom-5">
            <LookJoystick />
            <div className="text-white/60 text-[10px] md:text-xs text-center mt-2 font-medium tracking-wide">Chạm đúp để Reset</div>
          </div>

          {/* Movement Controls (Right) */}
          <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-center gap-1 md:gap-2 animate-in slide-in-from-bottom-5">
          <button
            className="w-12 h-12 md:w-16 md:h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
            onPointerDown={(e) => { e.preventDefault(); setJoystickState({ forward: true }) }}
            onPointerUp={(e) => { e.preventDefault(); setJoystickState({ forward: false }) }}
            onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ forward: false }) }}
          >
             <ArrowUp className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </button>
          <div className="flex gap-10 md:gap-16">
            <button
              className="w-12 h-12 md:w-16 md:h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
              onPointerDown={(e) => { e.preventDefault(); setJoystickState({ left: true }) }}
              onPointerUp={(e) => { e.preventDefault(); setJoystickState({ left: false }) }}
              onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ left: false }) }}
            >
               <CornerUpLeft className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </button>
            <button
              className="w-12 h-12 md:w-16 md:h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
              onPointerDown={(e) => { e.preventDefault(); setJoystickState({ right: true }) }}
              onPointerUp={(e) => { e.preventDefault(); setJoystickState({ right: false }) }}
              onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ right: false }) }}
            >
               <CornerUpRight className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </button>
          </div>
          <button
            className="w-12 h-12 md:w-16 md:h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
            onPointerDown={(e) => { e.preventDefault(); setJoystickState({ backward: true }) }}
            onPointerUp={(e) => { e.preventDefault(); setJoystickState({ backward: false }) }}
            onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ backward: false }) }}
          >
             <ArrowDown className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </button>
        </div>
        </>
      )}
    </div>
  )
}
