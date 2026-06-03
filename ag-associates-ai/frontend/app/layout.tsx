import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Adv. Aditya Gade | AI Systems Architect & LegalOps',
  description: 'Architecting autonomous AI workflows for legal and financial operations. Expert in multi-agent systems, RAG, and LegalOps automation.',
  keywords: ['Aditya Gade', 'Advocate', 'AI Systems Architect', 'LegalOps', 'Automation', 'LangGraph', 'Multi-Agent Systems'],
  openGraph: {
    title: 'Adv. Aditya Gade | AI Systems Architect & LegalOps',
    description: 'Architecting autonomous AI workflows for legal and financial operations.',
    url: 'https://advadiityagade.com',
    siteName: 'Adv. Aditya Gade',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Adv. Aditya Gade | AI Systems Architect & LegalOps',
    description: 'Architecting autonomous AI workflows for legal and financial operations.',
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
      <body className="min-h-screen bg-[#0a0a18]">{children}</body>
    </html>
  )
}
