import { Metadata, Viewport } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata = {
  title: 'Prithvi — Carbon Footprint Awareness',
  description: 'Track, understand, and reduce your carbon footprint across Indian cities. One habit, one badge, one better day at a time.',
  keywords: 'carbon footprint, India, sustainability, eco, climate, green',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Prithvi — Carbon Footprint Awareness',
    description: 'Know your impact. Heal the Earth.',
    type: 'website',
  },
}

export const viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0F1E' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Cabinet Grotesk via Fontshare CDN */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@800,700,500&f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
        {/* Noto Sans for Indic script fallback */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Prithvi" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        {/* SVG filters for colour-blindness simulation */}
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          <defs>
            <filter id="deuteranopia-filter">
              <feColorMatrix type="matrix" values="
                0.367  0.861 -0.228  0  0
                0.280  0.673  0.047  0  0
               -0.012  0.043  0.969  0  0
                0      0      0      1  0" />
            </filter>
            <filter id="protanopia-filter">
              <feColorMatrix type="matrix" values="
                0.152  1.053 -0.205  0  0
                0.115  0.786  0.099  0  0
               -0.004 -0.048  1.052  0  0
                0      0      0      1  0" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  )
}
