import withPWAInit from 'next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Silence the webpack-config-vs-Turbopack error from next-pwa
  // (Turbopack is the default in Next 16; next-pwa adds a webpack config)
  turbopack: {},
  images: {
    unoptimized: true,
  },
  // Allow Three.js / WebGL packages to be bundled on client
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'react-globe.gl'],
}

export default withPWA(nextConfig)
