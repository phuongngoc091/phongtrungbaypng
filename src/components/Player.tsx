import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, Text, Billboard, Html } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

const MOVE_SPEED = 6.0
const ROTATION_SPEED = 3.0

// Extremely fast unsynchronized state block for multiplayer sync
export const MY_PLAYER_STATE = {
  x: 0,
  y: 0,
  z: 0,
  ry: 0,
  chatMessage: '',
  chatTimestamp: 0
}

export const Player = () => {
  const [, getKeys] = useKeyboardControls()
  const playerRef = useRef<THREE.Group>(null)
  
  const studentInfo = useStore(s => s.studentInfo)
  const cameraView = useStore(s => s.cameraView)
  const setView = useStore(s => s.setView)
  
  // AFK Tracker
  const lastMoveTime = useRef(Date.now())
  
  const pointerDelta = useRef({ x: 0, y: 0 })
  const camTilt = useRef(0)
  const isPointerDown = useRef(false)

  useEffect(() => {
    const onPointerDown = () => {
      isPointerDown.current = true
    }
    const onPointerUp = () => {
      isPointerDown.current = false
      pointerDelta.current = { x: 0, y: 0 }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (isPointerDown.current) {
        pointerDelta.current.x -= e.movementX * 0.01
        pointerDelta.current.y -= e.movementY * 0.01
        // Clamp vertical to prevent flipping
        pointerDelta.current.y = Math.max(-Math.PI/3, Math.min(Math.PI/3, pointerDelta.current.y))
      }
    }
    
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointermove', onPointerMove)
    
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])
  
  const color = studentInfo?.characterType === 'girl' ? '#ec4899' : studentInfo?.characterType === 'boy' ? '#3b82f6' : '#a855f7'

  useFrame((state, delta) => {
    if (!playerRef.current) return
    
    // If not in gallery (e.g. paused), we could disable this
    const { forward, backward, left, right } = getKeys()
    const { joystickState } = useStore.getState()
    
    const f = forward || joystickState.forward
    const b = backward || joystickState.backward
    const l = left || joystickState.left
    const r = right || joystickState.right
    
    const isMoving = f || b || l || r
    
    // Tank controls setup
    if (l) playerRef.current.rotation.y += ROTATION_SPEED * delta
    if (r) playerRef.current.rotation.y -= ROTATION_SPEED * delta

    // Analog Camera Look
    if (joystickState.camPan !== 0) {
      playerRef.current.rotation.y -= joystickState.camPan * ROTATION_SPEED * delta * 0.8;
    }
    
    // Camera Tilt (Vertical Look)
    if (joystickState.camTilt !== 0) {
      // joystickState.camTilt is negative when dragged UP
      camTilt.current -= joystickState.camTilt * 1.5 * delta;
    }
    
    if (joystickState.resetLook) {
      camTilt.current = 0;
    }
    
    camTilt.current = Math.max(-Math.PI/3, Math.min(Math.PI/3, camTilt.current));
    
    // Auto-center camTilt if not actively looking up/down via joystick or pointer
    if (joystickState.camTilt === 0 && !isPointerDown.current) {
      camTilt.current = THREE.MathUtils.lerp(camTilt.current, 0, 0.05);
    }
    
    // AFK Kick Check
    const now = Date.now();
    if (isMoving || isPointerDown.current || joystickState.camPan !== 0 || joystickState.camTilt !== 0) {
      lastMoveTime.current = now;
    }
    // Check if chat updated recently
    const storeState = useStore.getState()
    if (storeState.chatTimestamp > lastMoveTime.current) {
      lastMoveTime.current = storeState.chatTimestamp
    }
    
    if (now - lastMoveTime.current > 30000) {
      // 30 seconds idle kick
      setView('home')
      return;
    }

    const direction = new THREE.Vector3(0, 0, (Number(b) - Number(f)))
    direction.applyQuaternion(playerRef.current.quaternion)
    direction.normalize().multiplyScalar(MOVE_SPEED * delta)
    
    if (f || b) {
      playerRef.current.position.add(direction)
    }

    // Update Shared State for Multiplayer 
    MY_PLAYER_STATE.x = playerRef.current.position.x
    MY_PLAYER_STATE.y = playerRef.current.position.y
    MY_PLAYER_STATE.z = playerRef.current.position.z
    MY_PLAYER_STATE.ry = playerRef.current.rotation.y
    MY_PLAYER_STATE.chatMessage = storeState.chatMessage
    MY_PLAYER_STATE.chatTimestamp = storeState.chatTimestamp

    // Smooth 3rd person camera follow
    let idealCameraOffset: THREE.Vector3
    let idealLookAt: THREE.Vector3

    if (cameraView === '1st') {
      idealCameraOffset = new THREE.Vector3(0, 1.8, 0)
      
      const activeTilt = isPointerDown.current ? pointerDelta.current.y : camTilt.current;
      const activePan = isPointerDown.current ? pointerDelta.current.x : 0;
      
      if (isPointerDown.current || Math.abs(camTilt.current) > 0.01) {
        // Orbit looking from head
        const orbitOffset = new THREE.Vector3(0, 0, -1)
        orbitOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), activeTilt)
        orbitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), activePan)
        orbitOffset.applyQuaternion(playerRef.current.quaternion)
        idealLookAt = orbitOffset.add(playerRef.current.position).add(new THREE.Vector3(0, 1.8, 0))
      } else {
        // Look straightforward
        idealLookAt = new THREE.Vector3(0, 1.8, -5)
        idealLookAt.applyQuaternion(playerRef.current.quaternion)
        idealLookAt.add(playerRef.current.position)
      }
    } else {
      // 3rd Person
      idealCameraOffset = new THREE.Vector3(0, 3, 6)
      const activeTilt = isPointerDown.current ? pointerDelta.current.y : camTilt.current;
      const activePan = isPointerDown.current ? pointerDelta.current.x : 0;
      if (isPointerDown.current || Math.abs(camTilt.current) > 0.01) {
        idealCameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), activeTilt)
        idealCameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), activePan)
      }
      idealLookAt = new THREE.Vector3(0, 1.5, 0).add(playerRef.current.position)
    }
    
    idealCameraOffset.applyQuaternion(playerRef.current.quaternion)
    idealCameraOffset.add(playerRef.current.position)
    
    // Lerp fast when snapping back, smooth when following
    state.camera.position.lerp(idealCameraOffset, isPointerDown.current ? 0.3 : 0.1)
    state.camera.lookAt(idealLookAt)
    
    // Walking bobbing effect
    if (isMoving) {
      playerRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 12)) * 0.15
    } else {
      playerRef.current.position.y = THREE.MathUtils.lerp(playerRef.current.position.y, 0, 0.1)
    }
  })

  const characterType = studentInfo?.characterType || 'robot'

  const chatMessage = useStore(s => s.chatMessage)
  const chatTimestamp = useStore(s => s.chatTimestamp)
  const showChat = Date.now() - chatTimestamp < 5000 && chatMessage

  return (
    <group ref={playerRef} position={[0, 0, 0]}>
      {/* Floating Nickname */}
      <Billboard position={[0, 2.5, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.4} color="white" outlineColor="black" outlineWidth={0.02} anchorX="center" anchorY="bottom">
          {studentInfo?.nickname || 'Khách'}
        </Text>
      </Billboard>

      {/* Local Player Chat Bubble */}
      {showChat && (
        <Html position={[0, 3.2, 0]} center sprite={false} zIndexRange={[100, 0]}>
          <div className="bg-white text-black px-4 py-2 rounded-2xl shadow-xl max-w-[200px] text-center font-medium animate-in zoom-in-50 duration-200 border-2 border-slate-200 break-words pointer-events-none text-sm">
            {chatMessage}
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
