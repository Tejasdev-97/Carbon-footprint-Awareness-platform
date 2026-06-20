"use client"

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const Globe = dynamic(
  () => import('react-globe.gl'),
  {
    ssr: false,
    loading: () => null,
  }
)

/** City data points for the globe */
const CITY_POINTS = [
  { lat: 12.97, lng: 77.59, city: 'Bengaluru', score: 82 },
  { lat: 19.07, lng: 72.87, city: 'Mumbai', score: 54 },
  { lat: 28.61, lng: 77.20, city: 'Delhi', score: 31 },
  { lat: 13.08, lng: 80.27, city: 'Chennai', score: 76 },
  { lat: 17.38, lng: 78.48, city: 'Hyderabad', score: 47 },
  { lat: 22.57, lng: 88.36, city: 'Kolkata', score: 62 },
  { lat: 18.52, lng: 73.85, city: 'Pune', score: 71 },
  { lat: 23.03, lng: 72.58, city: 'Ahmedabad', score: 58 },
  { lat: 26.91, lng: 75.78, city: 'Jaipur', score: 68 },
  { lat: 22.72, lng: 75.86, city: 'Indore', score: 73 },
]

/**
 * Returns a hex color for the score band.
 * Green: 70+ | Amber: 40–69 | Red: <40
 * @param {number} score
 * @returns {string}
 */
function scoreColor(score) {
  if (score >= 70) return '#22C55E'
  if (score >= 40) return '#F59E0B'
  return '#EF4444'
}

/**
 * HeroGlobe — interactive 3D globe for the landing page hero.
 * Uses react-globe.gl to show Indian cities with colour-coded scores.
 * Respects prefers-reduced-motion.
 *
 * @param {Object} props
 * @param {number} [props.size=500] - Globe diameter in pixels
 */
export default function HeroGlobe({ size = 500 }) {
  const containerRef = useRef(null)
  const globeRef = useRef(null)
  const [prefersReduced, setPrefersReduced] = useState(false)

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const pointsData = CITY_POINTS.map((p) => ({
    ...p,
    color: scoreColor(p.score),
    radius: 0.4,
    altitude: 0.01,
  }))

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Interactive 3D globe showing carbon health scores of major Indian cities. Green indicates healthy, amber moderate, and red critical pollution levels."
      style={{ width: size, height: size, maxWidth: '100%', margin: '0 auto' }}
    >
      <Globe
        ref={globeRef}
        width={size}
        height={size}
        rendererConfig={{ antialias: true, alpha: true }}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        cloudsImageUrl="https://unpkg.com/three-globe/example/img/earth-clouds.png"
        showAtmosphere={true}
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="#4ADE80"
        atmosphereAltitude={0.28}
        // City score points
        pointsData={pointsData}
        pointColor="color"
        pointRadius="radius"
        pointAltitude="altitude"
        pointLabel={(d) => `<div style="background:rgba(0,0,0,0.8);color:white;padding:6px 10px;border-radius:8px;font-size:13px"><b>${d.city}</b><br/>Score: ${d.score}</div>`}
        // Auto-rotate (disabled if reduced motion)
        enablePointerInteraction={true}
        animateIn={!prefersReduced}
        // Focus on India
        onGlobeReady={() => {
          if (globeRef.current && !prefersReduced) {
            globeRef.current.pointOfView({ lat: 20.5, lng: 78.9, altitude: 1.8 }, 1000)
            globeRef.current.controls().autoRotate = true
            globeRef.current.controls().autoRotateSpeed = 0.8
          } else if (globeRef.current) {
            globeRef.current.pointOfView({ lat: 20.5, lng: 78.9, altitude: 1.8 }, 0)
          }
        }}
      />
    </div>
  )
}
