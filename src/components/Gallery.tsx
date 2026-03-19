import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import type { ThemeType } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { ArrowLeft, Eye, User, ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight, Gamepad2, ArrowRight } from 'lucide-react'
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

export const Gallery = () => {
  const setView = useStore(s => s.setView)
  const currentTheme = useStore(s => s.currentTheme)
  const studentInfo = useStore(s => s.studentInfo)
  const cameraView = useStore(s => s.cameraView)
  const setCameraView = useStore(s => s.setCameraView)
  const setJoystickState = useStore(s => s.setJoystickState)

  const profile = useAuthStore(s => s.profile)
  const [showJoystick, setShowJoystick] = useState(false)
  
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
      <div className="absolute top-6 left-6 z-10 flex gap-4">
        <button 
          onClick={handleBack}
          className="p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors text-white border border-white/20 shadow-lg"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        {studentInfo && (
          <div className="px-6 py-3 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20 flex items-center gap-3 shadow-lg">
            <span className="font-bold text-lg">{studentInfo.nickname}</span>
            <span className="text-sm opacity-80 backdrop: uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">
              {studentInfo.characterType}
            </span>
          </div>
        )}
      </div>

      {/* Camera Controls Overlay */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
        <button 
          onClick={() => setCameraView('1st')}
          className={`px-4 py-3 backdrop-blur-md rounded-xl transition-all border shadow-lg flex items-center gap-2 ${
            cameraView === '1st' ? 'bg-pink-500 text-white border-pink-400' : 'bg-black/60 text-slate-300 border-white/20 hover:bg-black/80'
          }`}
        >
          <Eye className="w-5 h-5" /> Mắt Nhìn Gần
        </button>
        <button 
          onClick={() => setCameraView('3rd')}
          className={`px-4 py-3 backdrop-blur-md rounded-xl transition-all border shadow-lg flex items-center gap-2 ${
            cameraView === '3rd' ? 'bg-blue-500 text-white border-blue-400' : 'bg-black/60 text-slate-300 border-white/20 hover:bg-black/80'
          }`}
        >
          <User className="w-5 h-5" /> Theo Dõi
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/90 bg-black/60 px-8 py-3 rounded-full backdrop-blur-md pointer-events-none shadow-xl border border-white/10">
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

      {/* Joystick Toggle Button */}
      <button 
        onClick={() => setShowJoystick(!showJoystick)}
        className={`fixed bottom-[20px] right-[20px] z-[999] px-5 py-4 rounded-full shadow-2xl backdrop-blur-md border border-white/40 transition-all flex xl:hidden items-center gap-2 ${
          showJoystick 
            ? 'bg-pink-500 text-white border-pink-400' 
            : 'bg-black/60 text-white/90 hover:bg-black/80 hover:scale-105'
        }`}
        title="Bật/Tắt phím di chuyển cảm ứng"
      >
        <Gamepad2 className="w-7 h-7" />
        <span className="font-bold text-sm hidden md:inline">{showJoystick ? 'Tắt Điều Khiển' : 'Bật Điều Khiển'}</span>
      </button>

      {/* Mobile Controls (D-Pads) */}
      {showJoystick && (
        <>
          {/* Look Controls (Left) */}
          <div className="fixed bottom-[100px] left-[40px] z-[999] flex flex-col items-center gap-2 animate-in slide-in-from-bottom-5">
            <button
              className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
              onPointerDown={(e) => { e.preventDefault(); setJoystickState({ camUp: true }) }}
              onPointerUp={(e) => { e.preventDefault(); setJoystickState({ camUp: false }) }}
              onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ camUp: false }) }}
            >
               <ArrowUp className="w-10 h-10 text-pink-400" />
            </button>
            <div className="flex gap-16">
              <button
                className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
                onPointerDown={(e) => { e.preventDefault(); setJoystickState({ camLeft: true }) }}
                onPointerUp={(e) => { e.preventDefault(); setJoystickState({ camLeft: false }) }}
                onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ camLeft: false }) }}
              >
                 <ArrowLeft className="w-10 h-10 text-pink-400" />
              </button>
              <button
                className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
                onPointerDown={(e) => { e.preventDefault(); setJoystickState({ camRight: true }) }}
                onPointerUp={(e) => { e.preventDefault(); setJoystickState({ camRight: false }) }}
                onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ camRight: false }) }}
              >
                 <ArrowRight className="w-10 h-10 text-pink-400" />
              </button>
            </div>
            <button
              className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
              onPointerDown={(e) => { e.preventDefault(); setJoystickState({ camDown: true }) }}
              onPointerUp={(e) => { e.preventDefault(); setJoystickState({ camDown: false }) }}
              onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ camDown: false }) }}
            >
               <ArrowDown className="w-10 h-10 text-pink-400" />
            </button>
          </div>

          {/* Movement Controls (Right) */}
          <div className="fixed bottom-[100px] right-[40px] z-[999] flex flex-col items-center gap-2 animate-in slide-in-from-bottom-5">
          <button
            className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
            onPointerDown={(e) => { e.preventDefault(); setJoystickState({ forward: true }) }}
            onPointerUp={(e) => { e.preventDefault(); setJoystickState({ forward: false }) }}
            onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ forward: false }) }}
          >
             <ArrowUp className="w-10 h-10 text-white" />
          </button>
          <div className="flex gap-16">
            <button
              className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
              onPointerDown={(e) => { e.preventDefault(); setJoystickState({ left: true }) }}
              onPointerUp={(e) => { e.preventDefault(); setJoystickState({ left: false }) }}
              onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ left: false }) }}
            >
               <CornerUpLeft className="w-10 h-10 text-white" />
            </button>
            <button
              className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
              onPointerDown={(e) => { e.preventDefault(); setJoystickState({ right: true }) }}
              onPointerUp={(e) => { e.preventDefault(); setJoystickState({ right: false }) }}
              onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ right: false }) }}
            >
               <CornerUpRight className="w-10 h-10 text-white" />
            </button>
          </div>
          <button
            className="w-16 h-16 bg-black/40 backdrop-blur-md rounded-full shadow-lg border-2 border-white/50 flex justify-center items-center active:bg-white/40 touch-none select-none"
            onPointerDown={(e) => { e.preventDefault(); setJoystickState({ backward: true }) }}
            onPointerUp={(e) => { e.preventDefault(); setJoystickState({ backward: false }) }}
            onPointerLeave={(e) => { e.preventDefault(); setJoystickState({ backward: false }) }}
          >
             <ArrowDown className="w-10 h-10 text-white" />
          </button>
        </div>
        </>
      )}
    </div>
  )
}
