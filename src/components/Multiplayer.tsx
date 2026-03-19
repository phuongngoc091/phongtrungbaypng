import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { rtdb } from '../utils/firebase'
import { ref as refDb, onValue, set, onDisconnect } from 'firebase/database'
import { useStore } from '../store/useStore'
import { useAuthStore } from '../store/useAuthStore'
import { MY_PLAYER_STATE } from './Player'
import * as THREE from 'three'
import { Text, Billboard, Html } from '@react-three/drei'

interface PlayerData {
  x: number
  y: number
  z: number
  ry: number
  nickname: string
  characterType: string
  color: string
  chatMessage?: string
  chatTimestamp?: number
  lastActive?: number
}

export const Multiplayer = ({ galleryId }: { galleryId: string }) => {
  const studentInfo = useStore(s => s.studentInfo)
  const profile = useAuthStore(s => s.profile)
  const [players, setPlayers] = useState<Record<string, PlayerData>>({})
  
  // Decide my unique ID ONCE per mount to avoid disconnect loops on render
  const [myId] = useState(() => profile?.uid || `guest_${Math.random().toString(36).substring(7)}`)
  
  const lastSync = useRef(0)

  useEffect(() => {
    if (!galleryId) return
    const roomRef = refDb(rtdb, `rooms/${galleryId}/players`)
    
    // Listen for everyone
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        // Remove myself from the remote list so I don't draw a ghost of myself
        const others = { ...data }
        delete others[myId]
        setPlayers(others)
      } else {
        setPlayers({})
      }
    })

    // Auto cleanup on disconnect
    const meRef = refDb(rtdb, `rooms/${galleryId}/players/${myId}`)
    onDisconnect(meRef).remove()

    return () => {
      unsubscribe()
      // Manually remove me when component unmounts
      set(meRef, null)
    }
  }, [galleryId, myId])

  // Sync my camera/player center to remote
  useFrame(() => {
    if (!galleryId) return
    const now = Date.now()
    if (now - lastSync.current < 50) return // Max 20fps sync (save quota)
    lastSync.current = now

    // Push my current explicit player state to RTDB
    const meRef = refDb(rtdb, `rooms/${galleryId}/players/${myId}`)
    
    // Use update to only patch my specific properties without overwriting if not needed, 
    // or set if we just want to ensure it's there. 
    set(meRef, {
      x: MY_PLAYER_STATE.x,
      y: MY_PLAYER_STATE.y,
      z: MY_PLAYER_STATE.z,
      ry: MY_PLAYER_STATE.ry,
      nickname: studentInfo?.nickname || profile?.displayName || 'Khách',
      characterType: studentInfo?.characterType || 'robot',
      color: studentInfo ? (studentInfo.characterType === 'girl' ? '#ec4899' : studentInfo.characterType === 'boy' ? '#3b82f6' : '#a855f7') : '#f59e0b',
      lastActive: now
    })
  })

  return (
    <group>
      {Object.entries(players).map(([id, p]) => (
        <RemoteCharacter key={id} id={id} galleryId={galleryId} data={p} />
      ))}
    </group>
  )
}

function RemoteCharacter({ id, galleryId, data }: { id: string, galleryId: string, data: PlayerData }) {
  const ref = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (!ref.current) return
    
    // Ghost cleanup: if player is inactive for > 15 seconds, hide them and remove from DB
    if (data.lastActive && Date.now() - data.lastActive > 15000) {
      ref.current.visible = false
      // Clean up zombie nodes in RTDB to prevent DB growth
      set(refDb(rtdb, `rooms/${galleryId}/players/${id}`), null).catch(() => {})
      return
    } else {
      ref.current.visible = true
    }

    // Smooth interpolation (lerp) towards the target network position
    ref.current.position.lerp(new THREE.Vector3(data.x, data.y, data.z), 0.2)
    
    // Simple rotation snap or slerp
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, data.ry, 0))
    ref.current.quaternion.slerp(targetQuat, 0.2)
  })

  const characterType = data.characterType || 'robot'
  const color = data.color || '#a855f7'
  
  const showChat = data.chatTimestamp && (Date.now() - data.chatTimestamp < 5000) && data.chatMessage

  return (
    <group ref={ref} position={[data.x, data.y, data.z]}>
      {/* Floating Nickname */}
      <Billboard position={[0, 2.5, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.4} color="white" outlineColor="black" outlineWidth={0.02} anchorX="center" anchorY="bottom">
          {data.nickname}
        </Text>
      </Billboard>

      {/* Remote Player Chat Bubble */}
      {showChat && (
        <Html position={[0, 3.2, 0]} center sprite={false} zIndexRange={[100, 0]}>
          <div className="bg-white text-black px-4 py-2 rounded-2xl shadow-xl max-w-[200px] text-center font-medium animate-in zoom-in-50 duration-200 border-2 border-slate-200 break-words pointer-events-none text-sm">
            {data.chatMessage}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r-2 border-b-2 border-slate-200 pointer-events-none"></div>
          </div>
        </Html>
      )}

      {/* Render Character Model based on Type */}
      <group position={[0, 0, 0]}>
        {characterType === 'robot' && (
          <group>
            {/* Body */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <boxGeometry args={[0.7, 1.0, 0.5]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.45, 0]} castShadow>
              <boxGeometry args={[0.5, 0.4, 0.4]} />
              <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Visor / Eyes */}
            <mesh position={[0, 1.45, -0.21]} castShadow>
              <boxGeometry args={[0.4, 0.1, 0.05]} />
              <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1} />
            </mesh>
            {/* Antenna */}
            <mesh position={[0, 1.75, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.2]} />
              <meshStandardMaterial color="gray" />
            </mesh>
            <mesh position={[0, 1.85, 0]}>
              <sphereGeometry args={[0.08]} />
              <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
            </mesh>
          </group>
        )}

        {characterType === 'boy' && (
          <group>
            {/* Torso */}
            <mesh position={[0, 0.7, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.3, 0.8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.35, 0]} castShadow>
              <sphereGeometry args={[0.25]} />
              <meshStandardMaterial color="#ffccaa" /> {/* Skin tone */}
            </mesh>
            {/* Hair */}
            <mesh position={[0, 1.45, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
              <sphereGeometry args={[0.26, 16, 16, Math.PI/2, Math.PI, 0, Math.PI]} />
              <meshStandardMaterial color="#4a3018" />
            </mesh>
            {/* Face/Eyes direction indicator */}
            <mesh position={[0, 1.35, -0.23]} castShadow>
              <boxGeometry args={[0.2, 0.08, 0.05]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            {/* Legs */}
            <mesh position={[-0.15, 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.3]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.15, 0.15, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.1, 0.3]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        )}

        {characterType === 'girl' && (
          <group>
            {/* Torso/Dress */}
            <mesh position={[0, 0.6, 0]} castShadow>
              <coneGeometry args={[0.45, 0.9]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 1.25, 0]} castShadow>
              <sphereGeometry args={[0.22]} />
              <meshStandardMaterial color="#ffccaa" /> {/* Skin tone */}
            </mesh>
            {/* Hair base */}
            <mesh position={[0, 1.3, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
              <sphereGeometry args={[0.23, 16, 16, Math.PI/2, Math.PI, 0, Math.PI]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Hair Buns */}
            <mesh position={[-0.2, 1.4, 0]} castShadow>
              <sphereGeometry args={[0.1]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            <mesh position={[0.2, 1.4, 0]} castShadow>
              <sphereGeometry args={[0.1]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            {/* Face indicator */}
            <mesh position={[0, 1.25, -0.2]} castShadow>
              <boxGeometry args={[0.2, 0.08, 0.05]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
}
