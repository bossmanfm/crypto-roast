import type { Metadata } from 'next'
import './globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Providers } from '../components/Providers'

export const metadata: Metadata = {
  title: 'Crypto Roast 🔥 — Get destroyed on-chain',
  description: 'Connect your wallet. Get roasted based on your on-chain activity. Share the pain.',
  openGraph: {
    title: 'Crypto Roast 🔥',
    description: 'Get roasted based on your on-chain activity',
    images: ['/og.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
