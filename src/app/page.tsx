'use client'

import { useState, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { generateRoast, calculateDegenScore, type RoastResult } from '@/utils/roast'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { data: balanceData } = useBalance({ address })
  const [roast, setRoast] = useState<RoastResult | null>(null)
  const [isRoasting, setIsRoasting] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleRoast = async () => {
    if (!address) return
    setIsRoasting(true)
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generate mock metrics (in real app, fetch from API)
    const balance = balanceData?.formatted || '0'
    const txCount = 42 // Would come from API
    const nfts = 5 // Would come from API
    const degenScore = calculateDegenScore(42, 3, 2, parseFloat(balance))
    
    const result = generateRoast(address, balance, txCount, nfts, degenScore)
    setRoast(result)
    setIsRoasting(false)
  }

  const downloadImage = async () => {
    if (!cardRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current)
      const link = document.createElement('a')
      link.download = `crypto-roast-${address?.slice(0, 6)}.png`
      link.href = dataUrl
      link.click()
    } catch {
      alert('Download failed. Try screenshotting manually!')
    }
  }

  const shareText = roast 
    ? `🔥 ${roast.title}\n\n"${roast.roast}"\n\nGet roasted at crypto-roast.vercel.app`
    : ''

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2">
            <span className="flame inline-block">🔥</span> CRYPTO ROAST
          </h1>
          <p className="text-gray-400">Connect your wallet. Get destroyed.</p>
        </div>

        {!isConnected ? (
          <div className="card text-center">
            <p className="text-gray-300 mb-6">
              We&apos;ll analyze your on-chain activity and roast you accordingly.
              <br /><br />
              No wallet is safe.
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            {!roast ? (
              <div className="card text-center">
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Connected Wallet</p>
                  <p className="font-mono text-accent">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                  <p className="text-gray-400 mt-2">
                    Balance: {parseFloat(balanceData?.formatted || '0').toFixed(4)} ETH
                  </p>
                </div>
                
                <button
                  onClick={handleRoast}
                  disabled={isRoasting}
                  className="btn-primary w-full text-lg"
                >
                  {isRoasting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔥</span> Analyzing your bad decisions...
                    </span>
                  ) : (
                    'ROAST ME 🔥'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Roast Card */}
                <div 
                  ref={cardRef}
                  className="roast-card"
                >
                  <div className="relative z-10">
                    <div className="text-6xl mb-4">{roast.emoji}</div>
                    <h2 className="text-2xl font-black text-roast mb-2">{roast.title}</h2>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${
                      roast.severity === 'savage' ? 'bg-red-600' :
                      roast.severity === 'spicy' ? 'bg-orange-600' : 'bg-yellow-600'
                    }`}>
                      {roast.severity.toUpperCase()}
                    </div>
                    <p className="text-xl font-bold text-white mb-4">
                      &ldquo;{roast.roast}&rdquo;
                    </p>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-400">Classification</p>
                      <p className="text-accent font-bold">{roast.type}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                      crypto-roast.vercel.app
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={downloadImage}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                  >
                    💾 Save Image
                  </button>
                  <a
                    href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors text-center"
                  >
                    🚀 Share to Farcaster
                  </a>
                </div>

                <button
                  onClick={() => setRoast(null)}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors"
                >
                  Roast Another Wallet
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Built on Base • Share the pain</p>
        </footer>
      </div>
    </main>
  )
}
