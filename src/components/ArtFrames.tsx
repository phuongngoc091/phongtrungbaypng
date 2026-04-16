import { useStore } from '../store/useStore'
import { useTexture, Text } from '@react-three/drei'
import * as THREE from 'three'
import { Suspense } from 'react'

export const ArtFrames = () => {
  const uploadedImages = useStore(s => s.uploadedImages)
  const currentTheme = useStore(s => s.currentTheme)
  const galleryBannerText = useStore(s => s.galleryBannerText)
  const galleryBannerImage = useStore(s => s.galleryBannerImage)
  
  if (uploadedImages.length === 0) return null

  const frameColor = 
    currentTheme === 'royal' ? '#ffd700' : 
    currentTheme === 'cute' ? '#ffffff' : 
    currentTheme === 'galaxy' ? '#ff00ff' : 
    '#00ffff'

  const positions: { pos: [number, number, number], rot: [number, number, number] }[] = []
  
  // For 60x60 Room, Wall goes from -30 to 30.
  const zWall = -29.4 // North Wall
  const xWallLeft = -29.4 // West Wall
  const xWallRight = 29.4 // East Wall

  // Maximum width for a frame layout to fit nicely: 5 frames on a 60 unit wall (available ~50 units to avoid corners)
  // Max width per frame ~= 8
  
  uploadedImages.forEach((_, idx) => {
    // We space 5 images per wall. Range: -20 to 20, step of 10.
    const spacing = 10
    
    if (idx < 5) {
      // North Wall
      const x = -20 + (idx * spacing)
      positions.push({ pos: [x, 4, zWall], rot: [0, 0, 0] })
    } else if (idx < 10) {
      // East Wall
      const z = -20 + ((idx - 5) * spacing)
      positions.push({ pos: [xWallRight, 4, z], rot: [0, -Math.PI / 2, 0] })
    } else {
      // West Wall
      const z = -20 + ((idx - 10) * spacing)
      positions.push({ pos: [xWallLeft, 4, z], rot: [0, Math.PI / 2, 0] })
    }
  })

  return (
    <group>
      {/* Banner Display above the door / center */}
      <Suspense fallback={null}>
        <group position={[0, 9, -29.1]}>
          <mesh>
            <planeGeometry args={[20, 5]} />
            <meshStandardMaterial color={currentTheme === 'royal' ? '#8b0000' : '#222'} />
          </mesh>
          {galleryBannerImage ? (
            <BannerImage src={galleryBannerImage} />
          ) : (
            <Text
              position={[0, 0, 0.1]}
              fontSize={1.5}
              color="white"
              anchorX="center"
              anchorY="middle"
              maxWidth={18}
              textAlign="center"
            >
              {galleryBannerText}
            </Text>
          )}
        </group>
      </Suspense>

      {/* Paintings */}
      {uploadedImages.map((img, index) => (
        <Frame 
          key={index} 
          src={img.src} 
          title={img.title}
          position={positions[index].pos} 
          rotation={positions[index].rot}
          frameColor={frameColor} 
        />
      ))}
    </group>
  )
}

function BannerImage({ src }: { src: string }) {
  const texture = useTexture(src)
  return (
    <mesh position={[0, 0, 0.1]}>
      <planeGeometry args={[19.6, 4.8]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  )
}

function Frame({ src, title, position, rotation, frameColor }: { 
  src: string; 
  title?: string;
  position: [number, number, number]; 
  rotation: [number, number, number];
  frameColor: string 
}) {
  const texture = useTexture(src)
  
  const image = texture.image as { width?: number; height?: number } | undefined
  const imgAspect = (image?.width && image?.height) ? image.width / image.height : 1
  
  // Base height, but if aspect ratio is too wide, constraint width instead to fit our 10 unit spacing.
  let height = 3.5
  let width = height * imgAspect
  
  if (width > 8) {
    width = 8
    height = width / imgAspect
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Frame Border */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.4, height + 0.4, 0.2]} />
        <meshStandardMaterial color={frameColor} roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Canvas Picture */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>

      {/* Title Panel */}
      {title && (
        <group position={[0, -height / 2 - 0.7, 0.1]}>
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[Math.min(width, 6) + 0.5, 0.7]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[Math.min(width, 6) + 0.6, 0.8]} />
            <meshStandardMaterial color={frameColor} />
          </mesh>
          <Text
            position={[0, 0, 0.05]}
            fontSize={0.28}
            color="white"
            anchorX="center"
            anchorY="middle"
            maxWidth={Math.min(width, 6) + 0.3}
            textAlign="center"
            font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf"
          >
            {title}
          </Text>
        </group>
      )}
    </group>
  )
}
