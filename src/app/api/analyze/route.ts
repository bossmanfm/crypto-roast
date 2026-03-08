import { NextRequest, NextResponse } from 'next/server'

export interface WalletAnalysis {
  address: string
  // Balance
  ethBalance: number
  // Basescan
  txCount: number
  failedTxs: number
  failedRatio: number
  uniqueContracts: number
  walletAgedays: number
  firstTxDate: string | null
  // Alchemy
  nftCount: number
  erc20Count: number
  // Derived signals
  avgTxPerDay: number
  contractDiversity: number // uniqueContracts / txCount ratio
  // Computed
  degenScore: number
  category: string
}

async function fetchBasescan(address: string, apiKey: string): Promise<{
  txCount: number
  failedTxs: number
  uniqueContracts: number
  walletAgeDays: number
  firstTxDate: string | null
}> {
  try {
    // Fetch up to 10000 txs (max per call)
    const url = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&page=1&offset=10000&apikey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return { txCount: 0, failedTxs: 0, uniqueContracts: 0, walletAgeDays: 0, firstTxDate: null }
    }

    const txs = data.result
    const txCount = txs.length
    const failedTxs = txs.filter((tx: Record<string, string>) => tx.isError === '1').length

    // Unique contracts interacted with (exclude plain ETH sends)
    const contracts = new Set(
      txs
        .filter((tx: Record<string, string>) => tx.to && tx.to !== '' && tx.input && tx.input !== '0x')
        .map((tx: Record<string, string>) => tx.to.toLowerCase())
    )
    const uniqueContracts = contracts.size

    // Wallet age from first tx
    let walletAgeDays = 0
    let firstTxDate = null
    if (txs.length > 0) {
      const firstTimestamp = parseInt(txs[0].timeStamp) * 1000
      firstTxDate = new Date(firstTimestamp).toISOString().split('T')[0]
      walletAgeDays = Math.max(1, Math.floor((Date.now() - firstTimestamp) / (1000 * 60 * 60 * 24)))
    }

    return { txCount, failedTxs, uniqueContracts, walletAgeDays, firstTxDate }
  } catch {
    return { txCount: 0, failedTxs: 0, uniqueContracts: 0, walletAgeDays: 0, firstTxDate: null }
  }
}

async function fetchAlchemy(address: string, apiKey: string): Promise<{
  nftCount: number
  erc20Count: number
}> {
  try {
    const [nftRes, tokenRes] = await Promise.all([
      fetch(
        `https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${address}&withMetadata=false`,
        { next: { revalidate: 300 } }
      ),
      fetch(`https://base-mainnet.g.alchemy.com/v2/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'alchemy_getTokenBalances',
          params: [address, 'erc20'],
        }),
        next: { revalidate: 300 },
      }),
    ])

    const nftData = await nftRes.json()
    const tokenData = await tokenRes.json()

    const nftCount = nftData.totalCount || 0
    const erc20Count = tokenData.result?.tokenBalances?.filter(
      (t: { tokenBalance: string }) =>
        t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
    ).length || 0

    return { nftCount, erc20Count }
  } catch {
    return { nftCount: 0, erc20Count: 0 }
  }
}

function computeDegenScore(params: {
  txCount: number
  failedRatio: number
  uniqueContracts: number
  nftCount: number
  erc20Count: number
  walletAgeDays: number
  ethBalance: number
  avgTxPerDay: number
  contractDiversity: number
}): number {
  const {
    txCount, failedRatio, nftCount, erc20Count,
    walletAgeDays, ethBalance, avgTxPerDay, contractDiversity,
  } = params
  let score = 0

  // Activity volume (0-25)
  if (txCount > 500) score += 25
  else if (txCount > 200) score += 18
  else if (txCount > 100) score += 12
  else if (txCount > 50) score += 7
  else if (txCount > 10) score += 3

  // Activity frequency (0-15) — how aggressive relative to age
  if (avgTxPerDay > 10) score += 15
  else if (avgTxPerDay > 5) score += 10
  else if (avgTxPerDay > 2) score += 6
  else if (avgTxPerDay > 0.5) score += 3

  // Risk: failed txs (min 20 tx sample to be reliable) (0-20)
  if (txCount >= 20) {
    if (failedRatio > 0.25) score += 20
    else if (failedRatio > 0.15) score += 14
    else if (failedRatio > 0.08) score += 8
  }

  // Contract diversity (0-15)
  // Low diversity + high tx = airdrop farmer behavior (not "degen"), skip score boost
  // High diversity = explorer = degen
  if (contractDiversity > 0.4) score += 15       // uses many different contracts
  else if (contractDiversity > 0.2) score += 10
  else if (contractDiversity > 0.1) score += 5

  // NFT obsession (0-10)
  if (nftCount > 50) score += 10
  else if (nftCount > 20) score += 7
  else if (nftCount > 5) score += 3

  // Shitcoin exposure (0-10)
  if (erc20Count > 30) score += 10
  else if (erc20Count > 15) score += 7
  else if (erc20Count > 5) score += 4

  // Wallet age bonus: newer = less battle-tested = riskier (0-5)
  if (walletAgeDays < 30) score += 5
  else if (walletAgeDays < 90) score += 2

  // Poverty signal (0-5): poor AND active = true degen
  if (ethBalance < 0.01 && txCount > 20) score += 5
  else if (ethBalance < 0.1 && txCount > 10) score += 2

  return Math.min(100, score)
}

function classifyWallet(params: {
  txCount: number
  failedTxs: number
  failedRatio: number
  uniqueContracts: number
  nftCount: number
  erc20Count: number
  walletAgeDays: number
  ethBalance: number
  degenScore: number
  avgTxPerDay: number
  contractDiversity: number
}): string {
  const {
    txCount, failedRatio, uniqueContracts, nftCount,
    ethBalance, walletAgeDays, degenScore, avgTxPerDay, contractDiversity,
  } = params

  // --- WHALE tier (balance-first, then activity context) ---
  if (ethBalance > 5) {
    // Silent whale: just sitting on money, barely active on Base
    if (txCount < 10) return 'silent_whale'
    // Active whale: rich AND busy
    return 'active_whale'
  }

  // --- GHOST: never used on Base ---
  if (txCount === 0 && walletAgeDays === 0) return 'ghost'

  // --- CRYPTO NEWBIE: fresh + barely active ---
  // Wallet < 30 days old AND < 5 txs — could be new user, not paper hands
  if (walletAgeDays < 30 && txCount < 5) return 'crypto_newbie'

  // --- TRUE PAPER HANDS: old wallet, dormant, broke ---
  // Has been around a while but does nothing — confirmed lazy/scared
  if (walletAgeDays > 90 && txCount < 5 && ethBalance < 0.1) return 'paper_hands'

  // --- GAS WASTER: high fail ratio with enough sample (min 20 txs) ---
  if (failedRatio > 0.15 && txCount >= 20) return 'gas_waster'

  // --- JPEG DEGEN: heavy NFT collector ---
  if (nftCount > 15) return 'jpeg_degen'

  // --- AIRDROP HUNTER: high tx volume but very shallow contract usage ---
  // Signature: spams txs but only hits 1-5 contracts repeatedly
  // OR: insanely high tx volume with very low diversity ratio
  const isRepetitiveSpammer = txCount > 80 && uniqueContracts <= 5
  const isShallowHighVolume = avgTxPerDay > 5 && contractDiversity < 0.08
  if (isRepetitiveSpammer || isShallowHighVolume) return 'airdrop_hunter'

  // --- CERTIFIED DEGEN: high score OR extreme activity ---
  if (degenScore >= 68 || txCount > 300) return 'certified_degen'

  // --- Smaller whale (1–5 ETH range) ---
  if (ethBalance > 1) return 'silent_whale'

  return 'mid_degen'
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')
  if (!address) return NextResponse.json({ error: 'Address required' }, { status: 400 })

  const basescanKey = process.env.BASESCAN_API_KEY || ''
  const alchemyKey = process.env.ALCHEMY_API_KEY || ''
  const ethBalanceRaw = req.nextUrl.searchParams.get('balance') || '0'
  const ethBalance = parseFloat(ethBalanceRaw) || 0

  // Parallel fetch
  const [basescanData, alchemyData] = await Promise.all([
    fetchBasescan(address, basescanKey),
    fetchAlchemy(address, alchemyKey),
  ])

  const { txCount, failedTxs, uniqueContracts, walletAgeDays, firstTxDate } = basescanData
  const { nftCount, erc20Count } = alchemyData

  const failedRatio = txCount > 0 ? failedTxs / txCount : 0
  const avgTxPerDay = walletAgeDays > 0 ? txCount / walletAgeDays : txCount
  const contractDiversity = txCount > 0 ? uniqueContracts / txCount : 0

  const degenScore = computeDegenScore({
    txCount, failedRatio, uniqueContracts, nftCount,
    erc20Count, walletAgeDays, ethBalance, avgTxPerDay, contractDiversity,
  })

  const category = classifyWallet({
    txCount, failedTxs, failedRatio, uniqueContracts, nftCount,
    erc20Count, walletAgeDays, ethBalance, degenScore, avgTxPerDay, contractDiversity,
  })

  const result: WalletAnalysis = {
    address,
    ethBalance,
    txCount,
    failedTxs,
    failedRatio,
    uniqueContracts,
    walletAgedays: walletAgeDays,
    firstTxDate,
    nftCount,
    erc20Count,
    avgTxPerDay,
    contractDiversity,
    degenScore,
    category,
  }

  return NextResponse.json(result)
}
