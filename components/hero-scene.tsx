"use client"

import { Suspense, useRef, useEffect, useState, useMemo, useLayoutEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Float, Html, OrbitControls } from '@react-three/drei'
import { HERO_MODEL_CONFIGS, type HeroModelId } from '@/lib/models'
import * as THREE from 'three'

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading 3D Model...</span>
      </div>
    </Html>
  )
}

function EquipmentModel({ url, position = [0, 0, 0], fitSize = 1, rotation = [0, 0, 0] }: {
  url: string
  position?: [number, number, number]
  fitSize?: number
  rotation?: [number, number, number]
}) {
  const { scene } = useGLTF(url)
  const meshRef = useRef<THREE.Group>(null)
  const modelScene = useMemo(() => scene.clone(), [scene])

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(modelScene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1
    const normalizedScale = fitSize / maxDimension

    modelScene.position.sub(center)
    modelScene.scale.setScalar(normalizedScale)
  }, [fitSize, modelScene])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <primitive 
        ref={meshRef}
        object={modelScene}
        position={position}
        rotation={rotation}
      />
    </Float>
  )
}

function Scene({ activeModel }: { activeModel: HeroModelId }) {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 0.4, 6.2)
    camera.lookAt(0, 0, 0)
  }, [camera])

  const config = HERO_MODEL_CONFIGS[activeModel] ?? HERO_MODEL_CONFIGS.motor

  return (
    <>
      <ambientLight intensity={1} />
      <hemisphereLight
        color="#f5f7eb"
        groundColor="#d7f3e5"
        intensity={1.05}
      />
      <directionalLight position={[4, 6, 6]} intensity={1.3} />
      <directionalLight position={[-5, 3, -4]} intensity={0.45} />
      <pointLight position={[0, 2, 5]} intensity={0.3} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]}>
        <circleGeometry args={[2.2, 48]} />
        <meshBasicMaterial color="#d8efe3" transparent opacity={0.5} />
      </mesh>
      
      <Suspense fallback={<LoadingSpinner />}>
        <EquipmentModel 
          key={config.url}
          url={config.url} 
          fitSize={config.fitSize}
          position={config.position}
          rotation={config.rotation}
        />
      </Suspense>
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        maxPolarAngle={Math.PI / 1.95}
        minPolarAngle={Math.PI / 2.6}
      />
    </>
  )
}

export function HeroScene({ activeModel = 'motor' }: { activeModel?: HeroModelId }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary/50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading 3D Scene...</span>
        </div>
      </div>
    )
  }

  return (
    <Canvas
      camera={{ position: [0, 0.4, 6.2], fov: 38 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene activeModel={activeModel} />
    </Canvas>
  )
}

Object.values(HERO_MODEL_CONFIGS).forEach(({ url }) => {
  useGLTF.preload(url)
})
