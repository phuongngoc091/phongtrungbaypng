import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import type { ThemeType } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { ArrowLeft, Eye, User, ArrowUp, ArrowDown, CornerUpLeft, CornerUpRight, Gamepad2 } from 'lucide-react'
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
  const { setView, currentTheme, studentInfo, cameraView, setCameraView, setJoystickState } = useStore()
  const { profile } = useAuthStore()
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
        className={`absolute bottom-6 right-6 z-30 p-4 rounded-full shadow-2xl backdrop-blur-md border transition-all ${
          showJoystick 
            ? 'bg-pink-500/80 border-pink-400 text-white' 
            : 'bg-black/40 border-white/20 text-white/70 hover:bg-black/60 hover:text-white'
        }`}
        title="Bật/Tắt phím di chuyển"
      >
        <Gamepad2 className="w-8 h-8" />
      </button>

      {/* Mobile Controls (D-Pad) */}
      {showJoystick && (
        <div className="absolute bottom-24 right-6 z-20 flex flex-col items-center gap-2 opacity-80 animate-in slide-in-from-bottom-5">
          <button
            className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30 flex justify-center items-center active:bg-white/40"
            onPointerDown={() => setJoystickState({ forward: true })}
            onPointerUp={() => setJoystickState({ forward: false })}
            onPointerLeave={() => setJoystickState({ forward: false })}
          >
             <ArrowUp className="w-8 h-8 text-white" />
          </button>
          <div className="flex gap-14">
            <button
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30 flex justify-center items-center active:bg-white/40"
              onPointerDown={() => setJoystickState({ left: true })}
              onPointerUp={() => setJoystickState({ left: false })}
              onPointerLeave={() => setJoystickState({ left: false })}
            >
               <CornerUpLeft className="w-8 h-8 text-white" />
            </button>
            <button
              className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30 flex justify-center items-center active:bg-white/40"
              onPointerDown={() => setJoystickState({ right: true })}
              onPointerUp={() => setJoystickState({ right: false })}
              onPointerLeave={() => setJoystickState({ right: false })}
            >
               <CornerUpRight className="w-8 h-8 text-white" />
            </button>
          </div>
          <button
            className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full shadow-lg border border-white/30 flex justify-center items-center active:bg-white/40"
            onPointerDown={() => setJoystickState({ backward: true })}
            onPointerUp={() => setJoystickState({ backward: false })}
            onPointerLeave={() => setJoystickState({ backward: false })}
          >
             <ArrowDown className="w-8 h-8 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
