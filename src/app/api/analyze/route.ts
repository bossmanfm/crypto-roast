import { NextRequest, NextResponse } from 'next/server'

// ─── Chain config ──────────────────────────────────────────────────────────
export const CHAINS: Record<string, { id: number; name: string; emoji: string; color: string }> = {
  base:      { id: 8453,   name: 'Base',      emoji: '🔵', color: '#0052FF' },
  arbitrum:  { id: 42161,  name: 'Arbitrum',  emoji: '🔷', color: '#28A0F0' },
  optimism:  { id: 10,     name: 'Optimism',  emoji: '🔴', color: '#FF0420' },
  linea:     { id: 59144,  name: 'Linea',     emoji: '⬛', color: '#61DFFF' },
  scroll:    { id: 534352, name: 'Scroll',    emoji: '📜', color: '#FFEEDA' },
  polygon:   { id: 137,    name: 'Polygon',   emoji: '🟣', color: '#8247E5' },
  berachain: { id: 80094,  name: 'Berachain', emoji: '🐻', color: '#D4A843' },
  monad:     { id: 143,    name: 'Monad',     emoji: '🟪', color: '#836EF9' },
}

// Chains covered by Etherscan V2 free tier
export const FREE_CHAINS = ['arbitrum', 'linea', 'scroll', 'polygon', 'berachain', 'monad']
// Chains that need paid Etherscan OR separate API (Alchemy)
export const PAID_CHAINS = ['base', 'optimism']

// ─── Types ─────────────────────────────────────────────────────────────────
export interface ChainData {
  chainKey: string
  chainName: string
  emoji: string
  txCount: number
  failedTxs: number
  failedRatio: number
  uniqueContracts: number
  walletAgeDays: number
  firstTxDate: string | null
  avgTxPerDay: number
  contractDiversity: number
  status: 'ok' | 'empty' | 'error' | 'no_key'
}

export interface WalletAnalysis {
  address: string
  ethBalance: number
  // Chain breakdown
  chains: ChainData[]
  // Aggregated (best chain = most activity)
  txCount: number
  failedTxs: number
  failedRatio: number
  uniqueContracts: number
  walletAgedays: number
  firstTxDate: string | null
  avgTxPerDay: number
  contractDiversity: number
  activeChains: number
  // Alchemy (Base-specific, optional)
  nftCount: number
  erc20Count: number
  // Computed
  degenScore: number
  category: string
  primaryChain: string
}

// ─── Etherscan V2 fetch ────────────────────────────────────────────────────
async function fetchChainTxs(
  address: string,
  chainId: number,
  apiKey: string
): Promise<{ txCount: number; failedTxs: number; uniqueContracts: number; walletAgeDays: number; firstTxDate: string | null }> {
  try {
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=10000&apikey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return { txCount: 0, failedTxs: 0, uniqueContracts: 0, walletAgeDays: 0, firstTxDate: null }
    }

    const txs = data.result
    const txCount = txs.length
    const failedTxs = txs.filter((tx: Record<string, string>) => tx.isError === '1').length

    const contracts = new Set(
      txs
        .filter((tx: Record<string, string>) => tx.to && tx.input && tx.input !== '0x')
        .map((tx: Record<string, string>) => tx.to.toLowerCase())
    )
    const uniqueContracts = contracts.size

    let walletAgeDays = 0
    let firstTxDate = null
    if (txs.length > 0) {
      const firstTs = parseInt(txs[0].timeStamp) * 1000
      firstTxDate = new Date(firstTs).toISOString().split('T')[0]
      walletAgeDays = Math.max(1, Math.floor((Date.now() - firstTs) / 86400000))
    }

    return { txCount, failedTxs, uniqueContracts, walletAgeDays, firstTxDate }
  } catch {
    return { txCount: 0, failedTxs: 0, uniqueContracts: 0, walletAgeDays: 0, firstTxDate: null }
  }
}

// ─── Alchemy fetch (Base NFTs + tokens) ────────────────────────────────────
async function fetchAlchemy(address: string, apiKey: string): Promise<{ nftCount: number; erc20Count: number }> {
  if (!apiKey) return { nftCount: 0, erc20Count: 0 }
  try {
    const [nftRes, tokenRes] = await Promise.all([
      fetch(`https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${address}&withMetadata=false`, { next: { revalidate: 300 } }),
      fetch(`https://base-mainnet.g.alchemy.com/v2/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getTokenBalances', params: [address, 'erc20'] }),
        next: { revalidate: 300 },
      }),
    ])
    const nftData = await nftRes.json()
    const tokenData = await tokenRes.json()
    const nftCount = nftData.totalCount || 0
    const erc20Count = tokenData.result?.tokenBalances?.filter(
      (t: { tokenBalance: string }) => t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    ).length || 0
    return { nftCount, erc20Count }
  } catch {
    return { nftCount: 0, erc20Count: 0 }
  }
}

// ─── Scoring ───────────────────────────────────────────────────────────────
function computeDegenScore(p: {
  txCount: number; failedRatio: number; uniqueContracts: number; nftCount: number
  erc20Count: number; walletAgeDays: number; ethBalance: number; avgTxPerDay: number
  contractDiversity: number; activeChains: number
}): number {
  let score = 0

  // Activity volume (0-20)
  if (p.txCount > 500) score += 20
  else if (p.txCount > 200) score += 15
  else if (p.txCount > 100) score += 10
  else if (p.txCount > 50) score += 6
  else if (p.txCount > 10) score += 3

  // Frequency (0-15)
  if (p.avgTxPerDay > 10) score += 15
  else if (p.avgTxPerDay > 5) score += 10
  else if (p.avgTxPerDay > 2) score += 6
  else if (p.avgTxPerDay > 0.5) score += 3

  // Fail rate (min 20 tx sample) (0-20)
  if (p.txCount >= 20) {
    if (p.failedRatio > 0.25) score += 20
    else if (p.failedRatio > 0.15) score += 14
    else if (p.failedRatio > 0.08) score += 8
  }

  // Contract exploration (0-12)
  if (p.contractDiversity > 0.4) score += 12
  else if (p.contractDiversity > 0.2) score += 8
  else if (p.contractDiversity > 0.1) score += 4

  // NFTs (0-8)
  if (p.nftCount > 50) score += 8
  else if (p.nftCount > 20) score += 5
  else if (p.nftCount > 5) score += 2

  // Shitcoin portfolio (0-8)
  if (p.erc20Count > 30) score += 8
  else if (p.erc20Count > 15) score += 5
  else if (p.erc20Count > 5) score += 3

  // Multi-chain activity (0-10)
  if (p.activeChains >= 5) score += 10
  else if (p.activeChains >= 3) score += 7
  else if (p.activeChains >= 2) score += 4

  // Wallet age (0-4)
  if (p.walletAgeDays < 30) score += 4
  else if (p.walletAgeDays < 90) score += 2

  // Poor but active (0-3)
  if (p.ethBalance < 0.01 && p.txCount > 20) score += 3
  else if (p.ethBalance < 0.1 && p.txCount > 10) score += 1

  return Math.min(100, score)
}

function classifyWallet(p: {
  txCount: number; failedRatio: number; uniqueContracts: number; nftCount: number
  walletAgeDays: number; ethBalance: number; degenScore: number; avgTxPerDay: number
  contractDiversity: number; activeChains: number
}): string {
  const { txCount, failedRatio, uniqueContracts, nftCount, ethBalance, walletAgeDays, degenScore, avgTxPerDay, contractDiversity, activeChains } = p

  if (ethBalance > 5) return txCount < 10 ? 'silent_whale' : 'active_whale'
  if (txCount === 0 && walletAgeDays === 0) return 'ghost'
  if (walletAgeDays < 30 && txCount < 5) return 'crypto_newbie'
  if (walletAgeDays > 90 && txCount < 5 && ethBalance < 0.1) return 'paper_hands'
  if (failedRatio > 0.15 && txCount >= 20) return 'gas_waster'
  if (nftCount > 15) return 'jpeg_degen'

  // Airdrop hunter: shallow activity on many chains OR repetitive spam
  const isChainHopper = activeChains >= 4 && txCount > 50 && contractDiversity < 0.1
  const isRepetitiveSpammer = txCount > 80 && uniqueContracts <= 5
  const isShallowHighVolume = avgTxPerDay > 5 && contractDiversity < 0.08
  if (isChainHopper || isRepetitiveSpammer || isShallowHighVolume) return 'airdrop_hunter'

  if (degenScore >= 65 || txCount > 300) return 'certified_degen'
  if (ethBalance > 1) return 'silent_whale'
  return 'mid_degen'
}

// ─── Handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  const etherscanKey = process.env.ETHERSCAN_API_KEY || ''
  const alchemyKey = process.env.ALCHEMY_API_KEY || ''
  const ethBalance = parseFloat(req.nextUrl.searchParams.get('balance') || '0') || 0

  // Fetch all free chains in parallel
  const chainKeys = FREE_CHAINS
  const chainResults = await Promise.all(
    chainKeys.map(async (key): Promise<ChainData> => {
      const chain = CHAINS[key]
      if (!etherscanKey) {
        return { chainKey: key, chainName: chain.name, emoji: chain.emoji, txCount: 0, failedTxs: 0, failedRatio: 0, uniqueContracts: 0, walletAgeDays: 0, firstTxDate: null, avgTxPerDay: 0, contractDiversity: 0, status: 'no_key' }
      }
      const d = await fetchChainTxs(address, chain.id, etherscanKey)
      const failedRatio = d.txCount > 0 ? d.failedTxs / d.txCount : 0
      const avgTxPerDay = d.walletAgeDays > 0 ? d.txCount / d.walletAgeDays : d.txCount
      const contractDiversity = d.txCount > 0 ? d.uniqueContracts / d.txCount : 0
      return {
        chainKey: key,
        chainName: chain.name,
        emoji: chain.emoji,
        ...d,
        failedRatio,
        avgTxPerDay,
        contractDiversity,
        status: d.txCount > 0 ? 'ok' : 'empty',
      }
    })
  )

  // Alchemy for Base NFTs + tokens (if key available)
  const { nftCount, erc20Count } = await fetchAlchemy(address, alchemyKey)

  // Aggregate: sum across all chains for scoring
  const totalTxCount = chainResults.reduce((s, c) => s + c.txCount, 0)
  const totalFailed = chainResults.reduce((s, c) => s + c.failedTxs, 0)
  const totalContracts = chainResults.reduce((s, c) => s + c.uniqueContracts, 0)
  const activeChains = chainResults.filter(c => c.txCount > 0).length

  // Best chain = most transactions (for age/frequency calcs)
  const bestChain = chainResults.reduce((a, b) => a.txCount >= b.txCount ? a : b)
  const walletAgeDays = bestChain.walletAgeDays || 0
  const firstTxDate = bestChain.firstTxDate

  const failedRatio = totalTxCount > 0 ? totalFailed / totalTxCount : 0
  const avgTxPerDay = walletAgeDays > 0 ? totalTxCount / walletAgeDays : totalTxCount
  const contractDiversity = totalTxCount > 0 ? totalContracts / totalTxCount : 0

  const degenScore = computeDegenScore({
    txCount: totalTxCount, failedRatio, uniqueContracts: totalContracts,
    nftCount, erc20Count, walletAgeDays, ethBalance, avgTxPerDay,
    contractDiversity, activeChains,
  })

  const category = classifyWallet({
    txCount: totalTxCount, failedRatio, uniqueContracts: totalContracts,
    nftCount, walletAgeDays, ethBalance, degenScore, avgTxPerDay,
    contractDiversity, activeChains,
  })

  const result: WalletAnalysis = {
    address,
    ethBalance,
    chains: chainResults,
    txCount: totalTxCount,
    failedTxs: totalFailed,
    failedRatio,
    uniqueContracts: totalContracts,
    walletAgedays: walletAgeDays,
    firstTxDate,
    avgTxPerDay,
    contractDiversity,
    activeChains,
    nftCount,
    erc20Count,
    degenScore,
    category,
    primaryChain: bestChain.chainKey,
  }

  return NextResponse.json(result)
}
