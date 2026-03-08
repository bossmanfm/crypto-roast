'use client'

import { useState, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance, useDisconnect } from 'wagmi'
import { isAddress } from 'viem'
import { generateRoast, calculateDegenScore } from '../utils/roast'
import type { RoastResult } from '../utils/roast'

const ROAST_MESSAGES = [
  "Scanning your terrible decisions...",
  "Counting your rug pulls...",
  "Calculating your degen score...",
  "Analyzing your buy-high sell-low history...",
  "Consulting the blockchain gods...",
]

export default function Home() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balanceData } = useBalance({ address })
  const [roast, setRoast] = useState<RoastResult | null>(null)
  const [isRoasting, setIsRoasting] = useState(false)
  const [pastedAddress, setPastedAddress] = useState('')
  const [pasteError, setPasteError] = useState('')
  const [mode, setMode] = useState<'connect' | 'paste'>('connect')
  const [roastMsg, setRoastMsg] = useState(ROAST_MESSAGES[0])
  const cardRef = useRef<HTMLDivElement>(null)

  const { data: pastedBalanceData } = useBalance({
    address: (mode === 'paste' && isAddress(pastedAddress)) ? pastedAddress as `0x${string}` : undefined,
  })

  const activeBalance = isConnected
    ? balanceData?.formatted || '0'
    : pastedBalanceData?.formatted || '0'

  const activeAddress = isConnected ? address : pastedAddress

  const runRoast = async (addr: string) => {
    setIsRoasting(true)
    // Cycle through funny messages
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % ROAST_MESSAGES.length
      setRoastMsg(ROAST_MESSAGES[i])
    }, 600)
    await new Promise(resolve => setTimeout(resolve, 2000))
    clearInterval(interval)
    const degenScore = calculateDegenScore(42, 3, 2, parseFloat(activeBalance))
    const result = generateRoast(addr, activeBalance, 42, 5, degenScore)
    setRoast(result)
    setIsRoasting(false)
  }

  const handleRoastConnected = async () => {
    if (!address) return
    await runRoast(address)
  }

  const handleRoastPasted = async () => {
    if (!isAddress(pastedAddress)) {
      setPasteError('❌ Invalid address. Must start with 0x and be 42 chars.')
      return
    }
    setPasteError('')
    await runRoast(pastedAddress)
  }

  const downloadImage = async () => {
    if (!cardRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `crypto-roast-${activeAddress?.slice(0, 6)}.png`
      link.href = dataUrl
      link.click()
    } catch {
      alert('Screenshot manually instead!')
    }
  }

  const handleReset = () => {
    setRoast(null)
    setPastedAddress('')
    setPasteError('')
  }

  const shareText = roast
    ? `🔥 I got roasted on Crypto Roast:\n\n"${roast.roast}"\n\n— ${roast.title}\n\nGet roasted: crypto-roast.vercel.app`
    : ''

  return (
    <div className="bg-grid min-h-screen relative">
      {/* Ambient glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none" />
      {/* Ambient glow bottom */}
      <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-orange-600/5 blur-[100px] pointer-events-none" />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* ── HEADER ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 text-red-400 text-xs font-semibold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              Built on Base
            </div>
            <h1 className="text-6xl font-black tracking-tight mb-3">
              <span className="flame-icon">🔥</span>{' '}
              <span className="text-gradient">CRYPTO</span>
              <br />
              <span className="text-white">ROAST</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Connect wallet. Get <span className="text-red-400 font-semibold">destroyed</span>.
            </p>
          </div>

          {!roast ? (
            <div className="space-y-4 slide-up">
              {/* ── TABS ── */}
              <div className="flex gap-2 p-1 rounded-2xl" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <button
                  onClick={() => setMode('connect')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    mode === 'connect'
                      ? 'tab-active border border-transparent'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  🔗 My Wallet
                </button>
                <button
                  onClick={() => setMode('paste')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    mode === 'paste'
                      ? 'tab-active border border-transparent'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  😈 Roast Anyone
                </button>
              </div>

              {/* ── CONNECT WALLET ── */}
              {mode === 'connect' && (
                <div className="card-glass p-6">
                  {!isConnected ? (
                    <div className="text-center">
                      <div className="text-5xl mb-4">👛</div>
                      <p className="text-gray-300 mb-2 font-semibold">Ready to face the truth?</p>
                      <p className="text-gray-500 text-sm mb-6">
                        We&apos;ll analyze your on-chain activity and roast you mercilessly.
                      </p>
                      <div className="flex justify-center">
                        <ConnectButton />
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Wallet info */}
                      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.04)'}}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-white font-bold text-sm">
                            {address?.slice(0, 8)}...{address?.slice(-6)}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {parseFloat(balanceData?.formatted || '0').toFixed(4)} ETH on Base
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 text-xs font-medium">Live</span>
                        </div>
                      </div>

                      <button
                        onClick={handleRoastConnected}
                        disabled={isRoasting}
                        className="btn-fire w-full py-4 text-lg mb-3"
                      >
                        {isRoasting ? (
                          <span className="flex items-center justify-center gap-3">
                            <span className="flex gap-1">
                              <span className="dot" />
                              <span className="dot" />
                              <span className="dot" />
                            </span>
                            <span className="text-sm font-normal">{roastMsg}</span>
                          </span>
                        ) : (
                          <span>ROAST ME 🔥</span>
                        )}
                      </button>

                      <button
                        onClick={() => disconnect()}
                        className="w-full text-xs text-gray-600 hover:text-red-400 transition-colors py-2 flex items-center justify-center gap-1"
                      >
                        <span>🔌</span> Disconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── PASTE ADDRESS ── */}
              {mode === 'paste' && (
                <div className="card-glass p-6">
                  <div className="text-center mb-5">
                    <div className="text-4xl mb-2">😈</div>
                    <p className="text-white font-bold">Roast Anyone&apos;s Wallet</p>
                    <p className="text-gray-500 text-sm">No connection needed. Pure chaos.</p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={pastedAddress}
                      onChange={(e) => {
                        setPastedAddress(e.target.value.trim())
                        setPasteError('')
                      }}
                      placeholder="0x... paste any wallet address"
                      className="input-field"
                    />
                    {pasteError && (
                      <p className="text-red-400 text-xs px-1">{pasteError}</p>
                    )}
                    <button
                      onClick={handleRoastPasted}
                      disabled={isRoasting || !pastedAddress}
                      className="btn-fire w-full py-4 text-base"
                    >
                      {isRoasting ? (
                        <span className="flex items-center justify-center gap-3">
                          <span className="flex gap-1">
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                          </span>
                          <span className="text-sm font-normal">{roastMsg}</span>
                        </span>
                      ) : (
                        <span>ROAST THIS WALLET 🔥</span>
                      )}
                    </button>
                  </div>

                  <p className="text-gray-600 text-xs text-center mt-4">
                    Works with any Ethereum/Base address
                  </p>
                </div>
              )}

              {/* ── STATS BAR ── */}
              <div className="card-glass p-4">
                <div className="flex justify-between text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
                  <span>Wallets Roasted Today</span>
                  <span className="text-red-400">🔥 1,337</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Degens', value: '420', color: 'text-red-400' },
                    { label: 'Whales', value: '69', color: 'text-blue-400' },
                    { label: 'Paper Hands', value: '848', color: 'text-yellow-400' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-2" style={{background: 'rgba(255,255,255,0.03)'}}>
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                      <p className="text-gray-600 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── ROAST RESULT ── */
            <div className="space-y-4 slide-up">
              <div ref={cardRef} className="roast-result-card shine-effect p-8">
                <div className="relative z-10 text-center">
                  {/* Big emoji */}
                  <div className="text-7xl mb-4 block">{roast.emoji}</div>

                  {/* Severity badge */}
                  <span className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 severity-${roast.severity}`}>
                    ⚡ {roast.severity} roast
                  </span>

                  {/* Title */}
                  <h2 className="text-3xl font-black text-white mb-2">{roast.title}</h2>

                  {/* Classification */}
                  <p className="text-red-400 font-bold text-sm mb-6 uppercase tracking-wider">
                    {roast.type}
                  </p>

                  {/* Roast text */}
                  <div className="rounded-2xl p-5 mb-6" style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)'}}>
                    <p className="text-xl font-bold text-white leading-relaxed">
                      &ldquo;{roast.roast}&rdquo;
                    </p>
                  </div>

                  {/* Address */}
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-mono">
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                    {activeAddress?.slice(0, 8)}...{activeAddress?.slice(-6)}
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
                  </div>

                  {/* Watermark */}
                  <p className="text-gray-700 text-xs mt-4 font-mono">crypto-roast.vercel.app</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadImage}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105"
                  style={{background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white'}}
                >
                  💾 Save Card
                </button>
                <a
                  href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 text-white"
                  style={{background: 'linear-gradient(135deg, #7c3aed, #6d28d9)'}}
                >
                  🚀 Share on Farcaster
                </a>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400 hover:text-white transition-all"
                style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)'}}
              >
                🔄 Roast Another Wallet
              </button>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-10 text-center">
            <p className="text-gray-700 text-xs">
              Built on Base • No financial advice • Just vibes
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}
