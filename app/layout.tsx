import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fitsol - Energy Efficiency Assessment',
  description: 'Get smart equipment upgrade recommendations for motors, compressors, air conditioners, LED retrofit, and DG sets. Save energy, reduce costs, and lower emissions.',
  generator: 'Fitsol',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
