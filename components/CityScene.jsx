"use client"

import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Sun, Moon, Info, Play, Pause, RefreshCw } from 'lucide-react'

// ── COLOR GRADIENTS & PRESETS ──────────────────────────────────────────────

const critical = {
  sky: new THREE.Color('#381b0d'),      // Smoggy burnt orange/brown
  fog: new THREE.Color('#220e06'),      // Dense dark soot fog
  fogNear: 1,
  fogFar: 9,
  ground: new THREE.Color('#4c433e'),   // Dry cracked brown-grey mud
  river: new THREE.Color('#1f150e'),    // Muddy, toxic dark brown sludge
  ambient: new THREE.Color('#5c301a'),  // Industrial orange glow
  ambientInt: 0.4,
  dir: new THREE.Color('#ef4444'),      // Angry red sun
  dirInt: 0.5,
  particleColor: new THREE.Color('#ef4444'), // Burning ember sparks
  particleSpeed: 0.6,
  particleScale: 0.12,
  cloudColor: new THREE.Color('#2b221d'), // Dirty smoke cloud
}

const stressed = {
  sky: new THREE.Color('#64748b'),      // Hazy greyish blue
  fog: new THREE.Color('#94a3b8'),      // Soft smog fog
  fogNear: 5,
  fogFar: 18,
  ground: new THREE.Color('#8a9485'),   // Dusty dry green
  river: new THREE.Color('#43575c'),    // Turbid grey-green water
  ambient: new THREE.Color('#94a3b8'),  // Dull white light
  ambientInt: 0.6,
  dir: new THREE.Color('#f5f5e6'),      // Pale yellow sun
  dirInt: 0.8,
  particleColor: new THREE.Color('#d1d5db'), // Grey ash dust
  particleSpeed: 0.25,
  particleScale: 0.06,
  cloudColor: new THREE.Color('#64748b'), // Grey cloud
}

const healthy = {
  sky: new THREE.Color('#bae6fd'),      // Bright sky blue
  fog: new THREE.Color('#e0f2fe'),      // Light clean moisture mist
  fogNear: 14,
  fogFar: 30,
  ground: new THREE.Color('#22c55e'),   // Vibrant lush green lawn
  river: new THREE.Color('#0ea5e9'),    // Sparkling clear blue river
  ambient: new THREE.Color('#ffffff'),  // Crisp white ambient
  ambientInt: 0.9,
  dir: new THREE.Color('#fef08a'),      // Warm golden sunshine
  dirInt: 1.4,
  particleColor: new THREE.Color('#4ade80'), // Floating green leaves & pollen sparkles
  particleSpeed: 0.2,
  particleScale: 0.08,
  cloudColor: new THREE.Color('#ffffff'), // Fluffy white cloud
}

const currentVisuals = {
  sky: new THREE.Color(),
  fogColor: new THREE.Color(),
  fogNear: 0,
  fogFar: 0,
  ground: new THREE.Color(),
  river: new THREE.Color(),
  ambient: new THREE.Color(),
  ambientInt: 0,
  dir: new THREE.Color(),
  dirInt: 0,
  particleColor: new THREE.Color(),
  particleSpeed: 0,
  particleScale: 0,
  cloudColor: new THREE.Color(),
}

/** Interpolates variables dynamically between Critical, Stressed, and Healthy presets */
function updateVisuals(score) {
  let t = 0
  let start = critical
  let end = stressed

  if (score <= 50) {
    t = score / 50
    start = critical
    end = stressed
  } else {
    t = (score - 50) / 50
    start = stressed
    end = healthy
  }

  currentVisuals.sky.lerpColors(start.sky, end.sky, t)
  currentVisuals.fogColor.lerpColors(start.fog, end.fog, t)
  currentVisuals.fogNear = THREE.MathUtils.lerp(start.fogNear, end.fogNear, t)
  currentVisuals.fogFar = THREE.MathUtils.lerp(start.fogFar, end.fogFar, t)
  currentVisuals.ground.lerpColors(start.ground, end.ground, t)
  currentVisuals.river.lerpColors(start.river, end.river, t)
  currentVisuals.ambient.lerpColors(start.ambient, end.ambient, t)
  currentVisuals.ambientInt = THREE.MathUtils.lerp(start.ambientInt, end.ambientInt, t)
  currentVisuals.dir.lerpColors(start.dir, end.dir, t)
  currentVisuals.dirInt = THREE.MathUtils.lerp(start.dirInt, end.dirInt, t)
  currentVisuals.particleColor.lerpColors(start.particleColor, end.particleColor, t)
  currentVisuals.particleSpeed = THREE.MathUtils.lerp(start.particleSpeed, end.particleSpeed, t)
  currentVisuals.particleScale = THREE.MathUtils.lerp(start.particleScale, end.particleScale, t)
  currentVisuals.cloudColor.lerpColors(start.cloudColor, end.cloudColor, t)
}

// ── SUB-COMPONENTS (3D GEOMETRY) ───────────────────────────────────────────

/** Windmills Component: Appears and spins based on score */
function Windmill({ position, transitionScoreRef }) {
  const groupRef = useRef()
  const bladesRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current || !bladesRef.current) return
    const score = transitionScoreRef.current
    
    // Scale wind turbines out of ground as score becomes healthy (> 45)
    const targetScale = Math.max(0, Math.min(1, (score - 45) / 15))
    groupRef.current.scale.setScalar(targetScale)
    
    // Spin faster when healthy
    const speed = Math.max(0, (score - 45) / 55) * 3
    bladesRef.current.rotation.z += delta * speed
  })

  return (
    <group position={position} ref={groupRef} castShadow receiveShadow>
      {/* Tower */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 2.4, 6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      {/* Rotor & Blades */}
      <group position={[0, 2.4, 0.08]} ref={bladesRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0.02]} castShadow>
            <boxGeometry args={[0.06, 0.9, 0.015]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Smoke Particles Component: Emits soot/ash for low scores */
function SmokeParticles({ position, transitionScoreRef, count = 12 }) {
  const groupRef = useRef()
  
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 0.15,
        y: Math.random() * 1.5,
        z: (Math.random() - 0.5) * 0.15,
        scale: 0.04 + Math.random() * 0.08,
        speed: 0.3 + Math.random() * 0.4,
      })
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const score = transitionScoreRef.current
    
    // Scale intensity of smoke based on score
    const intensity = Math.max(0, Math.min(1, (65 - score) / 25))
    
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]
      p.y += delta * p.speed
      if (p.y > 1.5) {
        p.y = 0
        p.x = (Math.random() - 0.5) * 0.15
        p.z = (Math.random() - 0.5) * 0.15
      }
      child.position.set(p.x, p.y, p.z)
      
      const currentScale = p.scale * (1 + p.y * 1.2) * intensity
      child.scale.setScalar(currentScale)
      if (child.material) {
        child.material.opacity = Math.max(0, 0.3 * (1 - p.y / 1.5) * intensity)
      }
    })
  })

  return (
    <group position={position} ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.3, 4, 4]} />
          <meshBasicMaterial color="#374151" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Factory Chimneys / Smoke Stacks: Grows and lights up when score is critical/stressed */
function FactoryChimney({ position, transitionScoreRef }) {
  const groupRef = useRef()
  const lightMatRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const score = transitionScoreRef.current
    
    // Scale chimneys out/in depending on industrial activity
    const targetScale = Math.max(0, Math.min(1, (65 - score) / 25))
    groupRef.current.scale.setScalar(targetScale)
    
    // Flicker red warning lights if critical
    if (lightMatRef.current) {
      const flicker = Math.sin(state.clock.elapsedTime * 15) > 0 && score < 45
      lightMatRef.current.color.set(flicker ? '#ef4444' : '#1e293b')
      lightMatRef.current.emissive = flicker ? new THREE.Color('#ef4444') : new THREE.Color('#000000')
    }
  })

  return (
    <group position={position} ref={groupRef} castShadow receiveShadow>
      {/* Factory Base */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      {/* Tall Chimney Cylinder */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.8, 6]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      {/* Red blinking warning light */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.05, 4, 4]} />
        <meshStandardMaterial ref={lightMatRef} color="#1e293b" roughness={0.2} />
      </mesh>
      {/* Animated Smoke Particles */}
      <SmokeParticles position={[0, 2.2, 0]} transitionScoreRef={transitionScoreRef} />
    </group>
  )
}

/** Tree Component: Grows/turns green, or wilts and sheds foliage based on score */
function SimTree({ position, transitionScoreRef }) {
  const foliageRef = useRef()
  const foliageMatRef = useRef()

  useFrame((state, delta) => {
    if (!foliageRef.current || !foliageMatRef.current) return
    const score = transitionScoreRef.current

    // Scale leaves to 0 if score < 25 (bare trunks)
    const leafScale = Math.max(0, Math.min(1, (score - 25) / 35))
    foliageRef.current.scale.setScalar(leafScale)

    // Color transition: Brown -> Orange/Yellow -> Lush Green
    let leafColor = new THREE.Color()
    if (score < 40) {
      leafColor.set('#78350f') // dead wood brown
    } else if (score < 70) {
      const t = (score - 40) / 30
      leafColor.set('#b45309').lerp(new THREE.Color('#d97706'), t)
    } else {
      const t = (score - 70) / 30
      leafColor.set('#d97706').lerp(new THREE.Color('#15803d'), t)
    }
    foliageMatRef.current.color.copy(leafColor)
  })

  return (
    <group position={position} castShadow>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.07, 0.8, 5]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      {/* Foliage Canopy */}
      <mesh position={[0, 0.9, 0]} ref={foliageRef} castShadow>
        <sphereGeometry args={[0.38, 6, 6]} />
        <meshStandardMaterial ref={foliageMatRef} color="#d97706" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Rooftop Solar Panels: Spawns on high scores */
function SolarPanels({ position, transitionScoreRef }) {
  const groupRef = useRef()

  useFrame(() => {
    if (!groupRef.current) return
    const score = transitionScoreRef.current
    
    // Scale up as score becomes healthy (> 60)
    const scale = Math.max(0, Math.min(1, (score - 60) / 20))
    groupRef.current.scale.set(scale, scale, scale)
  })

  return (
    <group position={position} rotation={[-Math.PI / 6, Math.PI / 4, 0]} ref={groupRef}>
      {/* Panel Plate */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.25, 0.02]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Support Stand */}
      <mesh position={[0, 0, -0.05]} castShadow>
        <boxGeometry args={[0.03, 0.03, 0.1]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  )
}

/** Building: Multi-styled low-poly building with window highlights and optional solar panels */
function SimBuilding({ position, size, color, windowColor, transitionScoreRef, hasSolar = false }) {
  const windowMatRef = useRef()
  
  useFrame((state) => {
    if (!windowMatRef.current) return
    const score = transitionScoreRef.current
    
    // Windows flicker or glow yellow under critical state / nighttime vibe
    if (score < 45) {
      const flicker = Math.sin(state.clock.elapsedTime * 6 + position[0]) > 0.3
      windowMatRef.current.color.set(flicker ? '#fef08a' : '#1e293b')
      windowMatRef.current.emissive = flicker ? new THREE.Color('#b58e22') : new THREE.Color('#000000')
    } else {
      // Steady soft window lights
      windowMatRef.current.color.set('#fef08a')
      windowMatRef.current.emissive = new THREE.Color('#3a3a10')
    }
  })

  return (
    <group position={position} castShadow receiveShadow>
      {/* Structure block */}
      <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>

      {/* Stylized Windows */}
      <mesh position={[0, size[1] / 2, size[2] / 2 + 0.01]} castShadow>
        <planeGeometry args={[size[0] * 0.7, size[1] * 0.7]} />
        <meshStandardMaterial ref={windowMatRef} color="#cbd5e1" roughness={0.1} />
      </mesh>

      {/* Solar Panel Spawn (On Rooftops) */}
      {hasSolar && (
        <SolarPanels 
          position={[0, size[1] + 0.05, 0]} 
          transitionScoreRef={transitionScoreRef} 
        />
      )}
    </group>
  )
}

/** Animated Vehicles: Drives along roads, turns green (EVs) on high scores */
function SimVehicle({ startPos, endPos, axis = 'z', speed = 2.0, transitionScoreRef }) {
  const carRef = useRef()
  const matRef = useRef()

  useFrame((state, delta) => {
    if (!carRef.current || !matRef.current) return
    const score = transitionScoreRef.current
    
    // Update position
    let val = carRef.current.position[axis]
    const dir = endPos > startPos ? 1 : -1
    val += delta * speed * dir
    
    if (dir > 0 ? val > endPos : val < endPos) {
      val = startPos
    }
    carRef.current.position[axis] = val

    // Color: Green/Blue (Clean EV) for high score, dirty grey/red for low score
    let carColor = new THREE.Color()
    if (score >= 70) {
      carColor.set('#10b981') // Bright green EV
    } else if (score >= 40) {
      carColor.set('#3b82f6') // Blue petrol
    } else {
      carColor.set('#64748b') // Grey exhaust-car
    }
    matRef.current.color.copy(carColor)
  })

  return (
    <group ref={carRef} position={[startPos, 0.08, startPos]} castShadow>
      {/* Car Base body */}
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.12, 0.4]} />
        <meshStandardMaterial ref={matRef} color="#3b82f6" roughness={0.3} />
      </mesh>
      {/* Roof structure */}
      <mesh position={[0, 0.1, -0.05]} castShadow>
        <boxGeometry args={[0.2, 0.08, 0.22]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  )
}

/** Low-poly clouds floating overhead */
function SimCloud({ position, speed = 0.5, transitionScoreRef }) {
  const ref = useRef()
  const matRef1 = useRef()
  const matRef2 = useRef()
  const matRef3 = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.position.x += delta * speed
    if (ref.current.position.x > 15) {
      ref.current.position.x = -15
    }
    
    // Smoothly transition cloud colors dynamically
    if (matRef1.current) matRef1.current.color.copy(currentVisuals.cloudColor)
    if (matRef2.current) matRef2.current.color.copy(currentVisuals.cloudColor)
    if (matRef3.current) matRef3.current.color.copy(currentVisuals.cloudColor)
  })

  return (
    <group position={position} ref={ref}>
      {/* Main cloud mass (3 overlapping spheres) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 5, 5]} />
        <meshStandardMaterial ref={matRef1} roughness={0.9} transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.4, -0.1, 0.1]}>
        <sphereGeometry args={[0.35, 5, 5]} />
        <meshStandardMaterial ref={matRef2} roughness={0.9} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.4, -0.1, -0.1]}>
        <sphereGeometry args={[0.35, 5, 5]} />
        <meshStandardMaterial ref={matRef3} roughness={0.9} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}


/** Flapping Birds Component: circular flight above city, scales to 0 when score is stressed/critical */
function SimBird({ center = [0, 4, 0], radius = 4, speed = 1.0, index = 0, transitionScoreRef }) {
  const birdRef = useRef()
  const wingL = useRef()
  const wingR = useRef()

  useFrame((state, delta) => {
    if (!birdRef.current || !wingL.current || !wingR.current) return
    const score = transitionScoreRef.current

    // Only render birds if healthy (> 65)
    const scale = Math.max(0, Math.min(1, (score - 65) / 15))
    birdRef.current.scale.setScalar(scale)

    // Fly in circles
    const angle = state.clock.elapsedTime * speed + index * (Math.PI * 0.6)
    birdRef.current.position.set(
      center[0] + Math.cos(angle) * radius,
      center[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2, // up and down wobble
      center[2] + Math.sin(angle) * radius
    )
    
    // Rotate to face trajectory
    birdRef.current.rotation.y = -angle + Math.PI

    // Wing flap animation
    const flap = Math.sin(state.clock.elapsedTime * 12 + index * 2) * 0.6
    wingL.current.rotation.z = flap
    wingR.current.rotation.z = -flap
  })

  return (
    <group ref={birdRef}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.05, 0.22]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      {/* Left Wing */}
      <mesh position={[-0.14, 0, 0]} ref={wingL}>
        <boxGeometry args={[0.2, 0.01, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
      {/* Right Wing */}
      <mesh position={[0.14, 0, 0]} ref={wingR}>
        <boxGeometry args={[0.2, 0.01, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>
    </group>
  )
}

/** Environmental Particles: Floating sparkles/leaves (Healthy) or ash/embers (Critical) */
function EnvironmentalParticles({ transitionScoreRef, count = 35 }) {
  const groupRef = useRef()

  const particleData = useMemo(() => {
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 16,
        y: Math.random() * 5 + 0.5,
        z: (Math.random() - 0.5) * 16,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: 0.1 + Math.random() * 0.25,
        speedZ: (Math.random() - 0.5) * 0.2,
        scale: 0.04 + Math.random() * 0.07,
      })
    }
    return arr
  }, [count])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const score = transitionScoreRef.current
    const speedMultiplier = currentVisuals.particleSpeed

    groupRef.current.children.forEach((mesh, i) => {
      const p = particleData[i]
      p.y += delta * p.speedY * speedMultiplier
      p.x += delta * p.speedX
      p.z += delta * p.speedZ

      // Wrap around bounds
      if (p.y > 6.0) {
        p.y = 0.2
        p.x = (Math.random() - 0.5) * 16
        p.z = (Math.random() - 0.5) * 16
      }

      mesh.position.set(p.x, p.y, p.z)
      mesh.scale.setScalar(p.scale * currentVisuals.particleScale * 15)
      
      // Update color and material qualities
      if (mesh.material) {
        mesh.material.color.copy(currentVisuals.particleColor)
        // Glow embers if score is critical
        mesh.material.emissive = score < 40 ? currentVisuals.particleColor : new THREE.Color('#000000')
      }
    })
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.08, 4, 4]} />
          <meshStandardMaterial roughness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

// ── INNER 3D SCENE CORE ───────────────────────────────────────────────────

function CityInnerScene({ targetScore, autoOrbit }) {
  const { scene } = useThree()
  const transitionScore = useRef(targetScore)

  const groundMatRef = useRef()
  const riverMatRef = useRef()
  const roadMatRef = useRef()
  const bridgeMatRef = useRef()
  const ambientLightRef = useRef()
  const dirLightRef = useRef()

  // City layout coordinates
  const buildingLayout = useMemo(() => [
    // Residential Zone (Right Side, X > 2)
    { pos: [3.5, 0, -5], size: [1.2, 3.2, 1.2], color: '#cbd5e1', windows: '#fef08a', hasSolar: true },
    { pos: [5.2, 0, -3.2], size: [0.9, 2.2, 0.9], color: '#94a3b8', windows: '#cbd5e1', hasSolar: true },
    { pos: [4.0, 0, -1.5], size: [1.0, 1.8, 1.0], color: '#e2e8f0', windows: '#ffffff', hasSolar: false },
    { pos: [5.5, 0, 1.5], size: [1.1, 2.8, 1.1], color: '#94a3b8', windows: '#fef08a', hasSolar: true },
    { pos: [3.8, 0, 3.8], size: [1.0, 2.0, 1.0], color: '#cbd5e1', windows: '#cbd5e1', hasSolar: false },
    { pos: [5.0, 0, 5.5], size: [0.8, 1.5, 0.8], color: '#e2e8f0', windows: '#ffffff', hasSolar: false },
    
    // Industrial Zone (Left-Back, X < -2, Z < 0)
    { pos: [-4.8, 0, -4.5], size: [1.4, 1.2, 1.4], color: '#475569', windows: '#1e293b', hasSolar: false },
    { pos: [-3.2, 0, -5.2], size: [1.0, 1.0, 1.0], color: '#334155', windows: '#1e293b', hasSolar: false },
  ], [])

  const treeLayout = useMemo(() => [
    // Nature Park (Left-Front, X < -2, Z > 0)
    [-4.5, 0, 2.2], [-3.2, 0, 2.8], [-5.5, 0, 3.8], [-4.0, 0, 4.8], [-5.0, 0, 5.8],
    // Riverbanks and dividers
    [-1.2, 0, -8], [1.2, 0, -8], [-1.2, 0, -1], [1.2, 0, -1],
    [-1.2, 0, 8], [1.2, 0, 8], [-1.2, 0, 2.5], [1.2, 0, 2.5],
  ], [])

  const windmillLayout = useMemo(() => [
    // Placed in park/industrial boundary
    [-3.0, 0, -1.8], [-5.5, 0, -1.0], [-2.5, 0, 1.5]
  ], [])

  const factoryLayout = useMemo(() => [
    // Industrial chimneys
    [-4.5, 0, -5.5], [-3.0, 0, -4.0], [-5.8, 0, -3.2]
  ], [])

  useFrame((state, delta) => {
    // 1. Lerp actual score
    transitionScore.current = THREE.MathUtils.lerp(transitionScore.current, targetScore, delta * 1.5)
    const score = transitionScore.current

    // 2. Set presets interpolation
    updateVisuals(score)

    // 3. Mutate scene background & fog
    scene.background = currentVisuals.sky
    if (scene.fog) {
      scene.fog.color = currentVisuals.fogColor
      scene.fog.near = currentVisuals.fogNear
      scene.fog.far = currentVisuals.fogFar
    }

    // 4. Update material colors in place
    if (groundMatRef.current) groundMatRef.current.color.copy(currentVisuals.ground)
    if (riverMatRef.current) riverMatRef.current.color.copy(currentVisuals.river)

    // 5. Update Lights
    if (ambientLightRef.current) {
      ambientLightRef.current.color.copy(currentVisuals.ambient)
      ambientLightRef.current.intensity = currentVisuals.ambientInt
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.copy(currentVisuals.dir)
      dirLightRef.current.intensity = currentVisuals.dirInt
      // Shift sun position slightly based on health (depressed = lower sun)
      const sunHeight = THREE.MathUtils.lerp(4, 13, score / 100)
      dirLightRef.current.position.set(6, sunHeight, 6)
    }
  })

  return (
    <>
      {/* Background attach color & fog skeletons */}
      <color attach="background" args={['#bae6fd']} />
      <fog attach="fog" args={['#e0f2fe', 12, 30]} />

      {/* Ambient and Dynamic Directional light with shadows */}
      <ambientLight ref={ambientLightRef} />
      <directionalLight
        ref={dirLightRef}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />

      {/* Grid Ground Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial ref={groundMatRef} roughness={0.9} />
      </mesh>

      {/* Canal River: runs straight through the city center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[1.6, 16]} />
        <meshStandardMaterial ref={riverMatRef} roughness={0.1} metalness={0.4} />
      </mesh>

      {/* Roads (slate grey paths) */}
      {/* Main road left */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.3, 0.012, 0]} receiveShadow>
        <planeGeometry args={[0.9, 16]} />
        <meshStandardMaterial ref={roadMatRef} color="#334155" roughness={0.7} />
      </mesh>
      {/* Main road right */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.3, 0.012, 0]} receiveShadow>
        <planeGeometry args={[0.9, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Cross roads linking across river bridges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, -4]} receiveShadow>
        <planeGeometry args={[16, 0.8]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 4]} receiveShadow>
        <planeGeometry args={[16, 0.8]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Bridges spanning the river */}
      {[-4, 4].map((zPos) => (
        <group key={zPos} position={[0, 0.05, zPos]} castShadow receiveShadow>
          {/* Bridge Roadway */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.08, 0.9]} />
            <meshStandardMaterial ref={bridgeMatRef} color="#475569" roughness={0.6} />
          </mesh>
          {/* Support Columns */}
          <mesh position={[-0.85, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0.85, -0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Safety Rails */}
          <mesh position={[0, 0.15, -0.42]} castShadow>
            <boxGeometry args={[1.8, 0.15, 0.03]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0, 0.15, 0.42]} castShadow>
            <boxGeometry args={[1.8, 0.15, 0.03]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        </group>
      ))}

      {/* Residential & Industrial Buildings */}
      {buildingLayout.map((b, idx) => (
        <SimBuilding
          key={idx}
          position={b.pos}
          size={b.size}
          color={b.color}
          windowColor={b.windows}
          hasSolar={b.hasSolar}
          transitionScoreRef={transitionScore}
        />
      ))}

      {/* Park and landscape trees */}
      {treeLayout.map((pos, idx) => (
        <SimTree key={idx} position={pos} transitionScoreRef={transitionScore} />
      ))}

      {/* Clean Windmills */}
      {windmillLayout.map((pos, idx) => (
        <Windmill key={idx} position={pos} transitionScoreRef={transitionScore} />
      ))}

      {/* Factories and chimneys */}
      {factoryLayout.map((pos, idx) => (
        <FactoryChimney key={idx} position={pos} transitionScoreRef={transitionScore} />
      ))}

      {/* Moving Cars */}
      <SimVehicle startPos={-8} endPos={8} axis="z" speed={2.5} transitionScoreRef={transitionScore} />
      <SimVehicle startPos={8} endPos={-8} axis="z" speed={1.8} transitionScoreRef={transitionScore} />
      <SimVehicle startPos={-8} endPos={8} axis="x" speed={3.0} transitionScoreRef={transitionScore} />

      {/* Environment Particles */}
      <EnvironmentalParticles transitionScoreRef={transitionScore} />

      {/* Atmospheric elements: Clouds */}
      <SimCloud position={[-10, 4.5, -4]} speed={0.4} transitionScoreRef={transitionScore} />
      <SimCloud position={[2, 5.0, 3]} speed={0.2} transitionScoreRef={transitionScore} />
      <SimCloud position={[-4, 4.0, 6]} speed={0.3} transitionScoreRef={transitionScore} />

      {/* Birds */}
      <SimBird center={[0, 3.8, 3]} radius={3.2} speed={1.2} index={0} transitionScoreRef={transitionScore} />
      <SimBird center={[-4, 4.2, 4]} radius={2.5} speed={0.9} index={1} transitionScoreRef={transitionScore} />
      <SimBird center={[3, 4.0, -2]} radius={3.0} speed={1.5} index={2} transitionScoreRef={transitionScore} />
    </>
  )
}

// ── MAIN CITY SCENE ────────────────────────────────────────────────────────

export default function CityScene({ score = 75 }) {
  const [overrideScore, setOverrideScore] = useState(null)
  const [autoOrbit, setAutoOrbit] = useState(false)
  const activeScore = overrideScore !== null ? overrideScore : score

  // Sync back to db score if target changes (e.g. database updates)
  useEffect(() => {
    setOverrideScore(null)
  }, [score])

  return (
    <div className="relative w-full h-full">
      {/* 3D WebGL Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 7, 11], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <CityInnerScene targetScore={activeScore} autoOrbit={autoOrbit} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={autoOrbit}
          autoRotateSpeed={1.0}
        />
      </Canvas>

      {/* Bottom Panel Overlay: Presets, auto-orbit, details */}
      <div className="absolute inset-x-4 bottom-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-background/85 dark:bg-card/85 backdrop-blur-md border border-border shadow-lg z-10 pointer-events-auto">
        {/* Left: Score indicator details */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary">
            {activeScore >= 70 ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Simulation Score</span>
            <span className="text-base font-bold text-foreground">
              {Math.round(activeScore)} / 100{' '}
              {overrideScore !== null && (
                <span className="text-xs text-primary font-medium animate-pulse ml-1">(Demo Mode)</span>
              )}
            </span>
          </div>
        </div>

        {/* Center: Live controller actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOverrideScore(20)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              overrideScore === 20
                ? 'bg-red-500 border-red-600 text-white'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Critical (20)
          </button>
          <button
            type="button"
            onClick={() => setOverrideScore(55)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              overrideScore === 55
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Stressed (55)
          </button>
          <button
            type="button"
            onClick={() => setOverrideScore(95)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              overrideScore === 95
                ? 'bg-emerald-500 border-emerald-600 text-white'
                : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Healthy (95)
          </button>
          {overrideScore !== null && (
            <button
              type="button"
              onClick={() => setOverrideScore(null)}
              title="Reset to database score"
              className="flex items-center justify-center size-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors border border-primary/20"
            >
              <RefreshCw className="size-4" />
            </button>
          )}
        </div>

        {/* Right: Camera Rotation Option */}
        <button
          type="button"
          onClick={() => setAutoOrbit((o) => !o)}
          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
            autoOrbit
              ? 'bg-primary/20 border-primary/45 text-primary'
              : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {autoOrbit ? (
            <>
              <Pause className="size-3.5" />
              <span>Orbiting</span>
            </>
          ) : (
            <>
              <Play className="size-3.5" />
              <span>Auto Orbit</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
