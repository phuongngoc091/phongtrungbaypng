import { useMemo, useRef } from 'react'
import type { ThemeType } from '../store/useStore'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const generateDamaskTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#b8860b' // Dark gold background
    ctx.fillRect(0, 0, 256, 256)
    ctx.strokeStyle = '#ffd700' // Bright gold pattern
    ctx.lineWidth = 4
    for (let i = 0; i < 4; i++) {
        for(let j = 0; j<4; j++) {
            const x = i * 64 + 32
            const y = j * 64 + 32
            ctx.beginPath()
            ctx.moveTo(x, y - 20)
            ctx.quadraticCurveTo(x + 20, y, x, y + 20)
            ctx.quadraticCurveTo(x - 20, y, x, y - 20)
            ctx.stroke()
        }
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(15, 4)
  return tex
}

export const Room = ({ theme }: { theme: ThemeType }) => {
  const damaskTex = useMemo(() => generateDamaskTexture(), [])

  const getWallMaterial = () => {
    switch(theme) {
      case 'royal': 
        return <meshStandardMaterial map={damaskTex} roughness={0.8} />
      case 'cute': 
        return <meshStandardMaterial color="#fff0f5" roughness={0.5} />
      case 'galaxy': 
        return <meshStandardMaterial color="#05051a" roughness={1} />
      case 'aquarium': 
        return (
          <meshPhysicalMaterial 
            color="#006994" 
            transmission={0.4} 
            transparent 
            opacity={0.8} 
            roughness={0.1}
            ior={1.4}
            thickness={0.5} 
          />
        )
    }
  }

  const getFloorMaterial = () => {
    switch(theme) {
      case 'royal': 
        return <meshStandardMaterial color="#600000" roughness={0.9} />
      case 'cute': 
        return <meshStandardMaterial color="#ffffff" roughness={0.3} />
      case 'galaxy': 
        return <meshStandardMaterial color="#000000" roughness={0.5} />
      case 'aquarium': 
        return <meshStandardMaterial color="#002b4d" roughness={0.8} />
    }
  }

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {getFloorMaterial()}
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {getWallMaterial()}
      </mesh>

      {/* Walls */}
      <mesh position={[0, 7.5, -30]} receiveShadow>
        <boxGeometry args={[60, 15, 1]} />
        {getWallMaterial()}
      </mesh>
      <mesh position={[0, 7.5, 30]} receiveShadow>
        <boxGeometry args={[60, 15, 1]} />
        {getWallMaterial()}
      </mesh>
      <mesh position={[30, 7.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[60, 15, 1]} />
        {getWallMaterial()}
      </mesh>
      <mesh position={[-30, 7.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[60, 15, 1]} />
        {getWallMaterial()}
      </mesh>

      {/* Theme specific decorations */}
      {theme === 'royal' && (
        <group>
          {/* Red Carpet */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[8, 60]} />
            <meshStandardMaterial color="#ba0000" roughness={1} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[9, 60]} />
            <meshStandardMaterial color="#ffd700" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      )}

      {theme === 'galaxy' && (
        <group>
          <NebulaSky />
          <SolarSystem position={[-10, 10, -20]} />
          <Spaceship position={[20, 12, -15]} />
          {Array.from({length: 5}).map((_, i) => <ShootingStar key={`star-${i}`} delay={i*2.5} />)}
          <FallingAsteroids count={40} />
        </group>
      )}
      
      {theme === 'aquarium' && (
        <group>
          {/* Water Caustics Illusion */}
          <Sparkles count={800} scale={60} size={15} speed={0.8} opacity={0.4} color="#00ffff" />
          <JellyfishSwarm count={35} />
          <CosmicSwarm />

          {/* Giant Seaweed */}
          {[-25, -15, 15, 25].map((x, i) => (
            <group key={i} position={[x, 0, -28]}>
              {Array.from({ length: 5 }).map((_, j) => (
                <mesh key={j} position={[0, j*2 + 1, Math.sin(j)*0.5]} rotation={[0, 0, Math.sin(j)*0.2]}>
                  <cylinderGeometry args={[0.2, 0.3, 2.5, 8]} />
                  <meshStandardMaterial color="#2e8b57" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      
      {theme === 'cute' && (
        <group>
          <Sparkles count={200} scale={60} size={20} speed={0.2} opacity={0.8} color="#ffb6c1" />
          
          {/* Clouds */}
          {[-20, 0, 20].map((x, i) => (
            <group key={i} position={[x, 12, -15 + i*5]} scale={[1.5, 1.5, 1.5]}>
              <mesh position={[0, 0, 0]} castShadow><sphereGeometry args={[2, 16, 16]} /><meshStandardMaterial color="white" roughness={1}/></mesh>
              <mesh position={[1.5, -0.5, 0]} castShadow><sphereGeometry args={[1.5, 16, 16]} /><meshStandardMaterial color="white" roughness={1}/></mesh>
              <mesh position={[-1.5, -0.5, 0]} castShadow><sphereGeometry args={[1.5, 16, 16]} /><meshStandardMaterial color="white" roughness={1}/></mesh>
              <mesh position={[0, -0.5, 1]} castShadow><sphereGeometry args={[1.5, 16, 16]} /><meshStandardMaterial color="white" roughness={1}/></mesh>
            </group>
          ))}

          {/* Flowers on the floor */}
          {Array.from({ length: 15 }).map((_, i) => {
            const fx = -25 + Math.random() * 50
            const fz = -25 + Math.random() * 50
            if (fx > -5 && fx < 5 && fz > -5 && fz < 5) return null
            return <Flower key={`flower-${i}`} position={[fx, 0, fz]} />
          })}
        </group>
      )}

      {/* Directional light to cast shadows */}
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
    </group>
  )
}

// Fireball Sun
function FireballSun({ size = 6 }: { size?: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#ffaa00") },
      uColor2: { value: new THREE.Color("#ff2200") },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      // Simplex 3D Noise 
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
      float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3  ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
      }
      
      void main() {
        float n = snoise(vPosition * 0.8 + uTime * 0.2);
        float n2 = snoise(vPosition * 1.5 - uTime * 0.3);
        float fire = smoothstep(-0.2, 0.8, n + n2 * 0.5);
        
        vec3 color = mix(uColor2, uColor1, fire);
        
        // Edge glow
        float rim = 1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0);
        color += vec3(1.0, 0.8, 0.4) * pow(rim, 3.0) * 1.5;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
  }), [])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group>
      {/* Sun Core */}
      <mesh material={material}>
        <sphereGeometry args={[size, 64, 64]} />
      </mesh>
      {/* Sun Glow/Aura */}
      <mesh>
        <sphereGeometry args={[size * 1.3, 32, 32]} />
        <meshPhysicalMaterial 
          color="#ff6600" 
          emissive="#ff3300"
          emissiveIntensity={2}
          transparent 
          opacity={0.3} 
          transmission={0.9} 
          roughness={0} 
          depthWrite={false} 
          side={THREE.BackSide} 
        />
      </mesh>
      <Sparkles count={400} scale={size * 4} size={40} color="#ff8800" speed={3} />
      <pointLight color="#ff8800" intensity={4} distance={100} decay={2} />
    </group>
  )
}

// Cinematic Blackhole/Sun core and Planets
function SolarSystem({ position }: { position: [number, number, number] }) {
  const systemGroup = useRef<THREE.Group>(null)
  
  // The entire solar system rotates together to simulate orbit
  useFrame(({ clock }) => {
    if (systemGroup.current) {
        systemGroup.current.rotation.y = clock.getElapsedTime() * 0.05
    }
  })
  
  return (
    <group position={position}>
      {/* FIERY SUN AT CENTER (does not orbit, just sits in center) */}
      <group position={[0, 0, 0]}>
         <FireballSun size={7} />
      </group>

      <group ref={systemGroup}>
        {/* 1. Mercury-like */}
        <group position={[12, 1, 0]}>
           <CinematicPlanet color="#888888" emissive="#aa6644" size={0.6} />
        </group>
        
        {/* 2. Venus-like */}
        <group position={[-16, -2, 8]}>
           <CinematicPlanet color="#ffccaa" emissive="#ff8844" size={0.9} />
        </group>

        {/* 3. Earth-like (Blue Planet with ring) */}
        <group position={[0, 4, 22]}>
          <CinematicPlanet color="#0088ff" emissive="#0022ff" size={2.5} />
          {/* Horizontal lens flare / ring */}
          <mesh rotation={[Math.PI/2 - 0.1, 0.1, 0]}>
            <ringGeometry args={[3, 4.5, 128]} />
            <meshPhysicalMaterial color="#ffffff" transmission={0.8} roughness={0.1} metalness={1} side={THREE.DoubleSide} transparent opacity={0.6} emissive="#0088ff" emissiveIntensity={2} />
          </mesh>
        </group>

        {/* 4. Mars-like (Red) */}
        <group position={[28, -5, -12]}>
           <CinematicPlanet color="#ff3300" emissive="#cc0000" size={1.5} />
        </group>

        {/* 5. Jupiter-like (Orange Gas Giant) */}
        <group position={[-32, 8, -25]}>
           <CinematicPlanet color="#ffaa00" emissive="#ff4400" size={4.5} />
           <Sparkles count={80} scale={10} size={20} color="#ffaa00" />
        </group>

        {/* 6. Planet 6 (Green/Cyan) */}
        <group position={[38, 3, 16]}>
           <CinematicPlanet color="#00ff55" emissive="#008822" size={1.8} />
        </group>
        
        {/* 7. Planet 7 (Purple/Pink) */}
        <group position={[-22, -8, -10]}>
           <CinematicPlanet color="#ff00ff" emissive="#8800ff" size={1.2} />
           <Sparkles count={40} scale={5} size={12} color="#ff00ff" />
        </group>
      </group>
    </group>
  )
}

function Spaceship({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = clock.getElapsedTime()
    group.current.position.y = position[1] + Math.sin(t*2)
    group.current.position.x = position[0] + Math.sin(t)*3
    group.current.position.z = position[2] + Math.cos(t)*3
    group.current.rotation.y = -t
    group.current.rotation.z = Math.sin(t*2)*0.2
  })
  return (
    <group position={position} ref={group} scale={[0.5, 0.5, 0.5]}>
      <mesh rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0, 2, 6, 8]} /><meshStandardMaterial color="#cccccc" metalness={0.8} /></mesh>
      <mesh position={[0, 1, 0]}><sphereGeometry args={[1, 16, 16]} /><meshStandardMaterial color="#00ffff" transparent opacity={0.5} /></mesh>
      <mesh position={[2, -1, 2]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.5, 1, 3, 8]} /><meshStandardMaterial color="#888888" /></mesh>
      <mesh position={[-2, -1, 2]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.5, 1, 3, 8]} /><meshStandardMaterial color="#888888" /></mesh>
    </group>
  )
}

function ShootingStar({ delay }: { delay: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (clock.getElapsedTime() + delay) % 8
    if (t < 2) {
      ref.current.position.set(-40 + t*50, 30 - t*10, -30 + t*20)
      ref.current.rotation.z = Math.PI / 4
      ref.current.visible = true
    } else {
      ref.current.visible = false
    }
  })
  return (
    <mesh ref={ref}>
      <capsuleGeometry args={[0.08, 6, 4, 8]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </mesh>
  )
}

// Asteroid Field with falling and rotating rocks
function FallingAsteroids({ count = 20 }: { count?: number }) {
  const asteroids = useMemo(() => Array.from({ length: count }).map(() => ({
    position: [
      -50 + Math.random() * 100,
      20 + Math.random() * 40,
      -50 + Math.random() * 100
    ] as [number, number, number],
    rotation: [
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    ] as [number, number, number],
    scale: 0.2 + Math.random() * 0.8,
    speed: 0.5 + Math.random() * 2,
    rotSpeed: [
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ]
  })), [count])

  return (
    <group>
      {asteroids.map((ast, i) => <Asteroid key={`ast-${i}`} config={ast} />)}
    </group>
  )
}

function Asteroid({ config }: { config: any }) {
  const ref = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    
    // Falling motion
    let y = config.position[1] - (t * config.speed) % 60
    if (y < -10) y = 50 - (-10 - y % 60) // Wrap around gracefully
    
    ref.current.position.set(config.position[0], y, config.position[2])
    
    // Rotating motion
    ref.current.rotation.x = config.rotation[0] + t * config.rotSpeed[0]
    ref.current.rotation.y = config.rotation[1] + t * config.rotSpeed[1]
    ref.current.rotation.z = config.rotation[2] + t * config.rotSpeed[2]
  })

  // Dodecahedron looks like a low-poly asteroid rock
  return (
    <mesh ref={ref} scale={config.scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#444455" roughness={0.9} metalness={0.1} />
    </mesh>
  )
}

// Jellyfish Swarm
function JellyfishSwarm({ count = 25 }: { count?: number }) {
  const jellies = useMemo(() => Array.from({ length: count }, () => {
    return {
      position: [
        -25 + Math.random() * 50,
        2 + Math.random() * 15,
        -25 + Math.random() * 50
      ] as [number, number, number],
      delay: Math.random() * Math.PI * 2,
      scale: 0.5 + Math.random() * 1.2,
      speed: 0.5 + Math.random() * 0.5
    }
  }), [count])

  return (
    <group>
      {jellies.map((j, i) => <Jellyfish key={`jelly-${i}`} {...j} />)}
    </group>
  )
}

function WavyTentacles({ count = 16, radius = 1.3 }: { count?: number, radius?: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#8a2be2') },
      uGlow: { value: new THREE.Color('#ffb6c1') }
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float waveDist = smoothstep(2.5, -2.5, pos.y); 
        pos.x += sin(pos.y * 3.0 + uTime * 2.0) * 0.5 * waveDist;
        pos.z += cos(pos.y * 2.0 + uTime * 3.0) * 0.5 * waveDist;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uGlow;
      varying vec2 vUv;
      void main() {
        vec3 col = mix(uColor, uGlow, vUv.y);
        gl_FragColor = vec4(col, 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), [])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  // Re-use geometry
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.02, 0.01, 5, 4, 16), [])

  return (
    <group position={[0, -2, 0]}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        return (
          <mesh 
            key={i} 
            position={[x, 0, z]} 
            geometry={geometry} 
            material={material} 
          />
        )
      })}
    </group>
  )
}

function OralArms() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ff1493') }
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float waveDist = smoothstep(1.5, -1.5, pos.y);
        pos.x += sin(pos.y * 4.0 + uTime * 3.0) * 0.2 * waveDist;
        pos.z += cos(pos.y * 3.0 + uTime * 2.0) * 0.2 * waveDist;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(uColor * (0.5 + 0.5 * vUv.y) * 2.0, 0.8); 
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), [])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  const geom = useMemo(() => new THREE.CylinderGeometry(0.2, 0.05, 3, 8, 16), [])

  return (
    <group position={[0, -1, 0]}>
      {Array.from({ length: 4 }).map((_, i) => {
        const x = Math.cos(i * Math.PI / 2) * 0.3
        const z = Math.sin(i * Math.PI / 2) * 0.3
        return <mesh key={i} position={[x, 0, z]} geometry={geom} material={material} />
      })}
    </group>
  )
}

function Jellyfish({ position, delay, scale, speed }: { position: [number, number, number], delay: number, scale: number, speed: number }) {
  const group = useRef<THREE.Group>(null)
  const bell = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!group.current || !bell.current) return
    const t = clock.getElapsedTime() * speed + delay
    
    // Swimming motion: Move forward/upward, then glide
    const bellScale = 1 + Math.sin(t * 3) * 0.1
    const bellPinch = 1 - Math.sin(t * 3) * 0.05
    bell.current.scale.set(bellPinch, bellScale, bellPinch)

    // Bob up and drift slowly
    group.current.position.y += Math.sin(t * 2) * 0.01 * speed
    group.current.position.x += Math.cos(t * 0.8) * 0.01 * speed
    group.current.position.z += Math.sin(t * 0.5) * 0.01 * speed
    
    // Wrap around boundaries
    const bounds = 30
    if (group.current.position.y > 20) group.current.position.y = 0
    if (group.current.position.y < -5) group.current.position.y = 20
    if (group.current.position.x > bounds) group.current.position.x = -bounds
    if (group.current.position.x < -bounds) group.current.position.x = bounds
    if (group.current.position.z > bounds) group.current.position.z = -bounds
    if (group.current.position.z < -bounds) group.current.position.z = bounds

    // Orient
    group.current.rotation.z = Math.sin(t * 1.5) * 0.1
    group.current.rotation.x = Math.cos(t * 1.2) * 0.1

    // Forward motion according to rotation + up
    const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(group.current.quaternion)
    const swimSpeed = (Math.sin(t * 3) * 0.5 + 0.5) * 0.03 * speed
    group.current.position.add(dir.multiplyScalar(swimSpeed))
  })

  return (
    <group position={position} ref={group} scale={scale}>
      {/* Dynamic Bell */}
      <group ref={bell}>
        {/* Main Dome */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[1.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial 
            color="#8a2be2" 
            emissive="#2b00ff" 
            emissiveIntensity={0.5} 
            transmission={0.9} 
            opacity={0.8} 
            transparent 
            roughness={0.1}
            ior={1.2}
            thickness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Glowing Rim */}
        <mesh position={[0, 0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[1.5, 0.04, 16, 64]} />
          <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={3} transparent opacity={0.8} />
        </mesh>

        {/* Inner Glowing Core */}
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.7, 32, 16]} />
          <meshPhysicalMaterial color="#ffb6c1" emissive="#ff1493" emissiveIntensity={2} transmission={0.5} opacity={0.6} transparent roughness={0.2} />
        </mesh>
      </group>

      {/* Tentacles */}
      <OralArms />
      <WavyTentacles count={24} radius={1.4} />
      <WavyTentacles count={12} radius={0.8} />
    </group>
  )
}

// --- Cosmic Sea Creatures ---

const cosmicVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const cosmicFragmentShader = `
  uniform float uTime;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }
  
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimPower = smoothstep(0.3, 1.0, rim);

    float n1 = noise(vUv * 8.0 + uTime * 0.1);
    float n2 = noise(vUv * 12.0 - uTime * 0.15);
    float pattern = noise(vec2(n1, n2) * 4.0);
    
    vec3 baseColor = mix(color1, color2, pattern);
    
    // stars
    float stars = pow(noise(vUv * 60.0 + uTime*0.02), 25.0) * 10.0;
    
    vec3 finalColor = baseColor + baseColor * rimPower * 1.5 + vec3(stars);
    gl_FragColor = vec4(finalColor, 0.85);
  }
`;

const createCosmicMat = (c1: string, c2: string) => new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
    color1: { value: new THREE.Color(c1) },
    color2: { value: new THREE.Color(c2) }
  },
  vertexShader: cosmicVertexShader,
  fragmentShader: cosmicFragmentShader
});

const whaleMat = createCosmicMat('#0044ff', '#00ffaa');
const angelfishMat = createCosmicMat('#0022ff', '#ff8800');
const pufferMat = createCosmicMat('#00aaff', '#ff00ff');
const dolphinMat = createCosmicMat('#00ffff', '#0044ff');

function CosmicMaterialUpdater() {
  useFrame(({ clock }) => {
     const t = clock.getElapsedTime();
     whaleMat.uniforms.uTime.value = t;
     angelfishMat.uniforms.uTime.value = t;
     pufferMat.uniforms.uTime.value = t;
     dolphinMat.uniforms.uTime.value = t;
  });
  return null;
}

function CosmicWhale() {
  const group = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime() * 0.2;
    group.current.position.x = Math.sin(t) * 15;
    group.current.position.z = Math.cos(t) * 15;
    group.current.position.y = 10 + Math.sin(t * 2) * 2;
    
    const nextX = Math.sin(t + 0.1) * 15;
    const nextZ = Math.cos(t + 0.1) * 15;
    const nextY = 10 + Math.sin((t + 0.1)*2) * 2;
    // Calculate direction manually or let lookAt handle it. Because default forward is Z+
    group.current.lookAt(nextX, nextY, nextZ);
  });

  return (
    <group ref={group} scale={[1.5, 1.5, 1.5]}>
      <mesh material={whaleMat} scale={[0.8, 1, 1.2]}><sphereGeometry args={[2, 32, 32]} /></mesh>
      {/* Flattened top shell */}
      <mesh material={whaleMat} position={[0, 0.5, 0]} scale={[0.6, 0.4, 1]}><sphereGeometry args={[2.5, 32, 32]} /></mesh>
      {/* Tail: 0 top, 2 bottom. Rotated X by 90deg places top at Z=0, bottom at Z=-4. */}
      <mesh material={whaleMat} position={[0, 0, -2]} rotation={[Math.PI/2, 0, 0]} scale={[1.5, 1, 0.1]}>
        <cylinderGeometry args={[0, 2, 4, 8]} />
      </mesh>
      {/* Pectoral Fins */}
      <mesh material={whaleMat} position={[1.5, -0.5, 1]} rotation={[0.5, 0.5, -0.5]} scale={[1.5, 0.1, 0.5]}><sphereGeometry args={[1, 16, 16]} /></mesh>
      <mesh material={whaleMat} position={[-1.5, -0.5, 1]} rotation={[-0.5, -0.5, -0.5]} scale={[1.5, 0.1, 0.5]}><sphereGeometry args={[1, 16, 16]} /></mesh>
      
      <Sparkles count={150} size={25} scale={[6, 3, 6]} color="#ffffff" opacity={0.6} />
    </group>
  );
}

function CosmicAngelfish({ config }: { config: any }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime() * config.speed + config.offset;
    group.current.position.x = config.center[0] + Math.sin(t) * config.radius;
    group.current.position.z = config.center[2] + Math.cos(t * 0.8) * config.radius;
    group.current.position.y = config.center[1] + Math.sin(t * 1.5) * 2;
    
    const nextX = config.center[0] + Math.sin(t + 0.1) * config.radius;
    const nextZ = config.center[2] + Math.cos((t + 0.1)*0.8) * config.radius;
    const nextY = config.center[1] + Math.sin((t + 0.1)*1.5) * 2;
    group.current.lookAt(nextX, nextY, nextZ);
  });

  return (
    <group ref={group} scale={config.scale}>
      <mesh material={angelfishMat} scale={[0.2, 1.2, 1]}><sphereGeometry args={[1, 32, 16]} /></mesh>
      <mesh material={angelfishMat} position={[0, 1, -0.5]} rotation={[0.5, 0, 0]} scale={[0.1, 1, 1]}><coneGeometry args={[0.5, 2, 8]} /></mesh>
      <mesh material={angelfishMat} position={[0, -1, -0.5]} rotation={[-0.5, 0, 0]} scale={[0.1, 1, 1]}><coneGeometry args={[0.5, 2, 8]} /></mesh>
      <mesh material={angelfishMat} position={[0, 0, -1.2]} rotation={[Math.PI/2, 0, 0]} scale={[0.1, 1, 0.8]}><cylinderGeometry args={[0.5, 0.1, 1, 8]} /></mesh>
    </group>
  );
}

function CosmicPuffer({ config }: { config: any }) {
  const group = useRef<THREE.Group>(null);
  
  const spikes = useMemo(() => Array.from({length: 25}).map((_, i) => {
    const phi = Math.acos(-1 + (2 * i) / 25);
    const theta = Math.sqrt(25 * Math.PI) * phi;
    const p = new THREE.Vector3(Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi));
    const obj = new THREE.Object3D();
    obj.position.copy(p);
    obj.lookAt(p.clone().multiplyScalar(2));
    return { position: [p.x, p.y, p.z] as [number,number,number], rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z] as [number,number,number] };
  }), []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime() * config.speed + config.offset;
    group.current.position.x = config.center[0] + Math.cos(t * 0.6) * config.radius;
    group.current.position.z = config.center[2] + Math.sin(t * 0.9) * config.radius;
    group.current.position.y = config.center[1] + Math.cos(t * 1.2) * 1.5;
    
    const nextX = config.center[0] + Math.cos((t + 0.1)*0.6) * config.radius;
    const nextZ = config.center[2] + Math.sin((t + 0.1)*0.9) * config.radius;
    const nextY = config.center[1] + Math.cos((t + 0.1)*1.2) * 1.5;
    group.current.lookAt(nextX, nextY, nextZ);
  });

  return (
    <group ref={group} scale={config.scale}>
      <mesh material={pufferMat} scale={[1, 0.9, 1.2]}><sphereGeometry args={[1, 16, 16]} /></mesh>
      <mesh material={pufferMat} position={[0, 0, -1.2]} rotation={[Math.PI/2, 0, 0]} scale={[0.2, 0.8, 0.5]}><cylinderGeometry args={[0.5, 0.1, 1, 8]} /></mesh>
      <mesh material={pufferMat} position={[0.8, 0, 0]} rotation={[0, 0, -Math.PI/2]} scale={[0.2, 0.5, 0.5]}><coneGeometry args={[1, 1, 8]} /></mesh>
      <mesh material={pufferMat} position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI/2]} scale={[0.2, 0.5, 0.5]}><coneGeometry args={[1, 1, 8]} /></mesh>
      {spikes.map((s, i) => (
        <mesh key={i} material={pufferMat} position={s.position} rotation={s.rotation}>
          <coneGeometry args={[0.08, 0.3, 4]} />
        </mesh>
      ))}
    </group>
  );
}

function CosmicDolphin({ config }: { config: any }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime() * config.speed + config.offset;
    group.current.position.x = config.center[0] + Math.sin(t) * config.radius;
    group.current.position.z = config.center[2] + Math.cos(t) * config.radius;
    group.current.position.y = config.center[1] + Math.sin(t * 2) * 3;
    
    const nextX = config.center[0] + Math.sin(t + 0.1) * config.radius;
    const nextZ = config.center[2] + Math.cos(t + 0.1) * config.radius;
    const nextY = config.center[1] + Math.sin((t+0.1) * 2) * 3;
    group.current.lookAt(nextX, nextY, nextZ);
    // Swim wiggle
    group.current.rotation.z += Math.sin(t * 8) * 0.1;
  });

  return (
    <group ref={group} scale={config.scale}>
      <mesh material={dolphinMat} scale={[0.5, 0.5, 1.5]}><sphereGeometry args={[1, 32, 16]} /></mesh>
      <mesh material={dolphinMat} position={[0, -0.1, 1.4]} scale={[0.15, 0.15, 0.4]}><sphereGeometry args={[1, 16, 16]} /></mesh>
      {/* Dorsal Fin: flat horizontally (X=0.1), tilted backward (rotX=-0.4) */}
      <mesh material={dolphinMat} position={[0, 0.5, -0.2]} rotation={[-0.4, 0, 0]} scale={[0.1, 0.6, 0.5]}><coneGeometry args={[1, 1.5, 8]} /></mesh>
      {/* Tail Fin: rotate Math.PI/2 makes local +Y point to +Z. So we flatten Z with Z=0.05. */}
      <mesh material={dolphinMat} position={[0, 0, -1.6]} rotation={[Math.PI/2, 0, 0]} scale={[0.8, 0.5, 0.05]}><coneGeometry args={[1, 1, 8]} /></mesh>
      {/* left/right fins */}
      <mesh material={dolphinMat} position={[0.4, -0.2, 0.5]} rotation={[0, 0, -0.5]} scale={[0.4, 0.05, 0.3]}><sphereGeometry args={[1, 16, 16]} /></mesh>
      <mesh material={dolphinMat} position={[-0.4, -0.2, 0.5]} rotation={[0, 0, 0.5]} scale={[0.4, 0.05, 0.3]}><sphereGeometry args={[1, 16, 16]} /></mesh>
    </group>
  );
}

function CosmicSwarm() {
  const fishes = useMemo(() => Array.from({length: 6}).map(() => ({
    scale: 0.3 + Math.random() * 0.5,
    speed: 0.6 + Math.random() * 0.4,
    offset: Math.random() * 100,
    radius: 10 + Math.random() * 12,
    center: [-5 + Math.random()*10, 4 + Math.random()*8, -5 + Math.random()*10]
  })), []);

  const puffers = useMemo(() => Array.from({length: 5}).map(() => ({
    scale: 0.4 + Math.random() * 0.6,
    speed: 0.4 + Math.random() * 0.3,
    offset: Math.random() * 100,
    radius: 8 + Math.random() * 10,
    center: [-10 + Math.random()*20, 3 + Math.random()*6, -10 + Math.random()*20]
  })), []);

  const dolphins = useMemo(() => Array.from({length: 4}).map((_, i) => ({
    scale: 0.8 + Math.random() * 0.4,
    speed: 1.2,
    offset: i * 0.8,
    radius: 18,
    center: [0, 8, 0]
  })), []);

  return (
    <group>
      <CosmicMaterialUpdater />
      <CosmicWhale />
      {fishes.map((f, i) => <CosmicAngelfish key={`fish-${i}`} config={f} />)}
      {puffers.map((p, i) => <CosmicPuffer key={`puffer-${i}`} config={p} />)}
      {dolphins.map((d, i) => <CosmicDolphin key={`dolphin-${i}`} config={d} />)}
    </group>
  );
}

// --- Cinematic Galaxy Sky and Planets ---
function NebulaSky() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec2 vUv;

      // Hash function for pseudo-random noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      // Bilinear interpolated noise
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                   mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
      }
      
      // Fractional Brownian Motion (fBM)
      float fbm(vec2 p) {
        float f = 0.0;
        float w = 0.5;
        for (int i = 0; i < 5; i++) {
          f += w * noise(p);
          p *= 2.0;
          w *= 0.5;
        }
        return f;
      }
      
      void main() {
        // Base starfield
        float stars = pow(noise(vUv * 150.0 + uTime * 0.05), 45.0) * 15.0;
        vec3 col = vec3(stars);
        
        // Dynamic, slowly shifting nebula clouds
        vec2 st = vUv * 2.0;
        
        // Create multiple fractal noise layers for deep volumetric look
        float q = fbm(st - uTime * 0.02);
        float r = fbm(st + q * 1.5 + uTime * 0.015);
        
        // Color stops (matching user image: Deep purples, blues, cyan)
        vec3 colorCyan = vec3(0.0, 0.8, 0.9);
        vec3 colorBlue = vec3(0.1, 0.2, 0.9);
        vec3 colorPurple = vec3(0.6, 0.1, 0.8);
        vec3 colorDark = vec3(0.02, 0.02, 0.1);
        
        // Mix colors based on fBM patterns
        vec3 nebulaColor = mix(colorDark, colorBlue, r * 1.5);
        nebulaColor = mix(nebulaColor, colorCyan, smoothstep(0.4, 0.8, q));
        nebulaColor = mix(nebulaColor, colorPurple, smoothstep(0.5, 1.0, fbm(st * 1.5 + r * 2.0)));
        
        // Add brightness to cores of nebulae
        nebulaColor += colorCyan * pow(fbm(st * 4.0 - uTime * 0.05), 4.0) * 0.5;
        
        // Combine stars and nebula
        col += nebulaColor;
        
        gl_FragColor = vec4(col, 1.0);
      }
    `
  }), []);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime * 0.5;
  });

  return (
    <mesh>
      {/* Large sphere enclosing the entire room */}
      <sphereGeometry args={[50, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CinematicPlanet({ color, emissive, size }: { color: string, emissive: string, size: number }) {
    const group = useRef<THREE.Group>(null);
    const material = useMemo(() => new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uGlow: { value: new THREE.Color(emissive) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPos.xyz;
            gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uGlow;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        // Noise functions (same as before)
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
            float f = 0.0; float w = 0.5;
            for (int i = 0; i < 4; i++) { f += w * noise(p); p *= 2.0; w *= 0.5; }
            return f;
        }

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            
            // Fresnel edge glow
            float rim = 1.0 - max(dot(viewDir, normal), 0.0);
            float rimPower = smoothstep(0.4, 1.0, rim);
            
            // Surface texture via fBM
            float n = fbm(vUv * 10.0 + uTime * 0.05);
            vec3 texColor = mix(uColor * 0.5, uColor, n);
            
            // Add bands like Jupiter
            float bands = sin(vUv.y * 20.0 + fbm(vUv * 5.0) * 2.0);
            texColor += uGlow * smoothstep(0.8, 1.0, bands) * 0.5;

            // Final Composition
            vec3 finalColor = texColor + uGlow * rimPower * 1.5;
            gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    }), [color, emissive]);

    useFrame((state) => {
        material.uniforms.uTime.value = state.clock.elapsedTime;
        if (group.current) {
            group.current.rotation.y = state.clock.elapsedTime * 0.15;
            group.current.rotation.x = state.clock.elapsedTime * 0.05;
        }
    });

    return (
        <group ref={group}>
            {/* Core planet */}
            <mesh material={material}>
                <sphereGeometry args={[size, 64, 64]} />
            </mesh>
            {/* Soft atmosphere halo */}
            <mesh>
                <sphereGeometry args={[size * 1.15, 32, 32]} />
                <meshPhysicalMaterial color={emissive} transmission={0.9} opacity={0.2} transparent roughness={0} depthWrite={false} side={THREE.BackSide} />
            </mesh>
        </group>
    )
}

function Flower({ position }: { position: [number, number, number] }) {
  const colors = ['#ff99c8', '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9']
  const color = colors[Math.floor(Math.random() * colors.length)]
  
  return (
    <group position={position} scale={0.5 + Math.random() * 0.5}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 2, 8]} />
        <meshStandardMaterial color="#2d6a4f" />
      </mesh>
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#fb8500" />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle)*0.6, 2, Math.sin(angle)*0.6]} rotation={[0, -angle, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}
