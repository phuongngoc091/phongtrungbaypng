import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, Text, Billboard } from '@react-three/drei'
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
  ry: 0
}

export const Player = () => {
  const [, getKeys] = useKeyboardControls()
  const playerRef = useRef<THREE.Group>(null)
  const { studentInfo, cameraView } = useStore()
  
  const pointerDelta = useRef({ x: 0, y: 0 })
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
    
    const isMoving = forward || backward || left || right
    
    // Tank controls setup
    if (left) playerRef.current.rotation.y += ROTATION_SPEED * delta
    if (right) playerRef.current.rotation.y -= ROTATION_SPEED * delta
    
    const direction = new THREE.Vector3(0, 0, (Number(backward) - Number(forward)))
    direction.applyQuaternion(playerRef.current.quaternion)
    direction.normalize().multiplyScalar(MOVE_SPEED * delta)
    
    if (forward || backward) {
      playerRef.current.position.add(direction)
    }

    // Update Shared State for Multiplayer 
    MY_PLAYER_STATE.x = playerRef.current.position.x
    MY_PLAYER_STATE.y = playerRef.current.position.y
    MY_PLAYER_STATE.z = playerRef.current.position.z
    MY_PLAYER_STATE.ry = playerRef.current.rotation.y

    // Smooth 3rd person camera follow
    let idealCameraOffset: THREE.Vector3
    let idealLookAt: THREE.Vector3

    if (cameraView === '1st') {
      idealCameraOffset = new THREE.Vector3(0, 1.8, 0)
      
      if (isPointerDown.current) {
        // Orbit looking from head
        const orbitOffset = new THREE.Vector3(0, 0, -1)
        orbitOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pointerDelta.current.y)
        orbitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), pointerDelta.current.x)
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
      if (isPointerDown.current) {
        idealCameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pointerDelta.current.y)
        idealCameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), pointerDelta.current.x)
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

  return (
    <group ref={playerRef} position={[0, 0, 0]}>
      {/* Floating Nickname */}
      <Billboard position={[0, 2.5, 0]} follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.4} color="white" outlineColor="black" outlineWidth={0.02} anchorX="center" anchorY="bottom">
          {studentInfo?.nickname || 'Khách'}
        </Text>
      </Billboard>

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
