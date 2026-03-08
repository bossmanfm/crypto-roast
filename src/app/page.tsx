'use client'

import { useState, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { isAddress } from 'viem'
import { generateRoast, calculateDegenScore } from '../utils/roast'
import type { RoastResult } from '../utils/roast'

export default function Home() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balanceData } = useBalance({ address })
  const [roast, setRoast] = useState<RoastResult | null>(null)
  const [isRoasting, setIsRoasting] = useState(false)
  const [pastedAddress, setPastedAddress] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [mode, setMode] = useState<'connect' | 'paste'>('connect')
  const cardRef = useRef<HTMLDivElement>(null)

  // Active address: either connected wallet or pasted address
  const activeAddress = isConnected ? address : (pastedAddress || undefined)
  const { data: pastedBalanceData } = useBalance({
    address: (mode === 'paste' && isAddress(pastedAddress)) ? pastedAddress as `0x${string}` : undefined,
  })

  const activeBalance = isConnected
    ? balanceData?.formatted || '0'
    : pastedBalanceData?.formatted || '0'

  const handleRoastByAddress = async (addr: string) => {
    setIsRoasting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    const degenScore = calculateDegenScore(42, 3, 2, parseFloat(activeBalance))
    const result = generateRoast(addr, activeBalance, 42, 5, degenScore)
    setRoast(result)
    setIsRoasting(false)
  }

  const handleRoastConnected = async () => {
    if (!address) return
    await handleRoastByAddress(address)
  }

  const handleRoastPasted = async () => {
    if (!isAddress(pastedAddress)) {
      setPasteError('Invalid address format. Must start with 0x...')
      return
    }
    setPasteError('')
    await handleRoastByAddress(pastedAddress)
  }

  const downloadImage = async () => {
    if (!cardRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current)
      const link = document.createElement('a')
      link.download = `crypto-roast-${activeAddress?.slice(0, 6)}.png`
      link.href = dataUrl
      link.click()
    } catch {
      alert('Download failed. Try screenshotting manually!')
    }
  }

  const handleReset = () => {
    setRoast(null)
    setPastedAddress('')
    setPasteError('')
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

        {!roast ? (
          <div className="space-y-4">
            {/* Mode Tabs */}
            <div className="flex gap-2 bg-gray-900 p-1 rounded-xl">
              <button
                onClick={() => setMode('connect')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  mode === 'connect' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                🔗 Connect Wallet
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                  mode === 'paste' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                📋 Paste Address
              </button>
            </div>

            {/* Connect Wallet Mode */}
            {mode === 'connect' && (
              <div className="card text-center">
                {!isConnected ? (
                  <>
                    <p className="text-gray-300 mb-6">
                      We&apos;ll analyze your on-chain activity and roast you accordingly.
                      <br /><br />
                      No wallet is safe.
                    </p>
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <p className="text-sm text-gray-400 mb-2">Connected Wallet</p>
                      <p className="font-mono text-accent text-lg">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <p className="text-gray-400 mt-1">
                        Balance: {parseFloat(balanceData?.formatted || '0').toFixed(4)} ETH
                      </p>
                    </div>
                    <button
                      onClick={handleRoastConnected}
                      disabled={isRoasting}
                      className="btn-primary w-full text-lg mb-3"
                    >
                      {isRoasting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">🔥</span> Analyzing your bad decisions...
                        </span>
                      ) : (
                        'ROAST ME 🔥'
                      )}
                    </button>
                    {/* Disconnect Button */}
                    <button
                      onClick={() => disconnect()}
                      className="w-full text-sm text-gray-500 hover:text-red-400 transition-colors py-2"
                    >
                      🔌 Disconnect Wallet
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Paste Address Mode */}
            {mode === 'paste' && (
              <div className="card">
                <p className="text-gray-400 text-sm mb-4 text-center">
                  Roast any wallet — even your enemy&apos;s 😈
                </p>
                <input
                  type="text"
                  value={pastedAddress}
                  onChange={(e) => {
                    setPastedAddress(e.target.value)
                    setPasteError('')
                  }}
                  placeholder="0x... paste wallet address here"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-sm mb-3 focus:outline-none focus:border-accent"
                />
                {pasteError && (
                  <p className="text-red-400 text-sm mb-3">{pasteError}</p>
                )}
                <button
                  onClick={handleRoastPasted}
                  disabled={isRoasting || !pastedAddress}
                  className="btn-primary w-full text-lg"
                >
                  {isRoasting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔥</span> Roasting this wallet...
                    </span>
                  ) : (
                    'ROAST THIS WALLET 🔥'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Roast Result */
          <div className="space-y-6">
            <div ref={cardRef} className="roast-card">
              <div className="relative z-10">
                <div className="text-6xl mb-4">{roast.emoji}</div>
                <h2 className="text-2xl font-black text-roast mb-2">{roast.title}</h2>
                <div
                  className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-4 ${
                    roast.severity === 'savage'
                      ? 'bg-red-600'
                      : roast.severity === 'spicy'
                      ? 'bg-orange-600'
                      : 'bg-yellow-600'
                  }`}
                >
                  {roast.severity.toUpperCase()}
                </div>
                <p className="text-xl font-bold text-white mb-4">
                  &ldquo;{roast.roast}&rdquo;
                </p>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">Classification</p>
                  <p className="text-accent font-bold">{roast.type}</p>
                </div>
                <div className="mt-2 text-xs text-gray-500 font-mono">
                  {activeAddress?.slice(0, 6)}...{activeAddress?.slice(-4)}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                  crypto-roast.vercel.app
                </div>
              </div>
            </div>

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
              onClick={handleReset}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors"
            >
              🔄 Roast Another Wallet
            </button>
          </div>
        )}

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Built on Base • Share the pain</p>
        </footer>
      </div>
    </main>
  )
}
