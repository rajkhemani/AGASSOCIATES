import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AG Associates | Premium Financial Advisory',
  description: 'India\'s premier financial advisory firm delivering strategic guidance for institutions and corporations. Portfolio management, risk mitigation, and corporate advisory services.',
  keywords: ['financial advisory', 'corporate finance', 'investment banking', 'portfolio management', 'risk advisory', 'AG Associates'],
  openGraph: {
    title: 'AG Associates | Premium Financial Advisory',
    description: 'Strategic financial guidance and investment advisory services for discerning institutions.',
    url: 'https://advadiityagade.com',
    siteName: 'AG Associates',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AG Associates | Premium Financial Advisory',
    description: 'Strategic financial guidance for institutions and corporations.',
  },
  metadataBase: new URL('https://advadiityagade.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased scroll-smooth">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
