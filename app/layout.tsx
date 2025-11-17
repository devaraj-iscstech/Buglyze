import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Buglyze - Enterprise-Grade Autonomous AI Testing Platform',
  description: 'Let AI test your website before your users do. Comprehensive testing, visual regression, accessibility, performance, and security analysis powered by AI.',
  keywords: ['testing', 'QA', 'automation', 'AI', 'visual regression', 'accessibility', 'performance', 'security'],
  authors: [{ name: 'Buglyze Team' }],
  openGraph: {
    title: 'Buglyze - AI-Powered Website Testing',
    description: 'Autonomous testing platform that revolutionizes quality assurance',
    url: 'https://buglyze.com',
    siteName: 'Buglyze',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buglyze - AI-Powered Website Testing',
    description: 'Let AI test your website before your users do',
    images: ['/images/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
