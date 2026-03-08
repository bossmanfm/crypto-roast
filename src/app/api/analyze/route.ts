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
    const url = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return { txCount: 0, failedTxs: 0, uniqueContracts: 0, walletAgeDays: 0, firstTxDate: null }
    }

    const txs = data.result
    const txCount = txs.length
    const failedTxs = txs.filter((tx: Record<string, string>) => tx.isError === '1').length

    // Unique contracts interacted with
    const contracts = new Set(
      txs
        .filter((tx: Record<string, string>) => tx.to && tx.to !== '' && tx.input !== '0x')
        .map((tx: Record<string, string>) => tx.to.toLowerCase())
    )
    const uniqueContracts = contracts.size

    // Wallet age
    let walletAgeDays = 0
    let firstTxDate = null
    if (txs.length > 0) {
      const firstTimestamp = parseInt(txs[0].timeStamp) * 1000
      firstTxDate = new Date(firstTimestamp).toISOString().split('T')[0]
      walletAgeDays = Math.floor((Date.now() - firstTimestamp) / (1000 * 60 * 60 * 24))
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
    // NFTs on Base
    const nftUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}/getNFTsForOwner?owner=${address}&withMetadata=false`
    const nftRes = await fetch(nftUrl, { next: { revalidate: 300 } })
    const nftData = await nftRes.json()
    const nftCount = nftData.totalCount || 0

    // ERC20 token balances
    const tokenUrl = `https://base-mainnet.g.alchemy.com/v2/${apiKey}`
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address, 'erc20'],
      }),
      next: { revalidate: 300 },
    })
    const tokenData = await tokenRes.json()
    const erc20Count = tokenData.result?.tokenBalances?.filter(
      (t: { tokenBalance: string }) => t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000'
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
}): number {
  const { txCount, failedRatio, uniqueContracts, nftCount, erc20Count, walletAgeDays, ethBalance } = params
  let score = 0

  // Activity (0-30)
  if (txCount > 500) score += 30
  else if (txCount > 200) score += 22
  else if (txCount > 100) score += 15
  else if (txCount > 50) score += 8
  else if (txCount > 10) score += 4

  // Risk behavior (0-25)
  if (failedRatio > 0.2) score += 25
  else if (failedRatio > 0.1) score += 15
  else if (failedRatio > 0.05) score += 8

  // Diversification (0-20)
  if (uniqueContracts > 50) score += 5  // too spread = airdrop farmer
  else if (uniqueContracts > 20) score += 15
  else if (uniqueContracts > 10) score += 20
  else score += 10

  // NFT obsession (0-15)
  if (nftCount > 50) score += 15
  else if (nftCount > 20) score += 10
  else if (nftCount > 5) score += 5

  // Shitcoin exposure (0-10)
  if (erc20Count > 30) score += 10
  else if (erc20Count > 15) score += 7
  else if (erc20Count > 5) score += 4

  // Age penalty (newer wallet = more degen)
  if (walletAgeDays < 30) score += 10
  else if (walletAgeDays < 90) score += 5

  // Poor (0-10)
  if (ethBalance < 0.01) score += 10
  else if (ethBalance < 0.1) score += 5

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
}): string {
  const { txCount, failedRatio, uniqueContracts, nftCount, ethBalance, walletAgeDays, degenScore } = params

  // Priority-ordered classification
  if (ethBalance > 5) return 'sad_whale'
  if (txCount < 5) return 'paper_hands'
  if (txCount === 0 && walletAgeDays === 0) return 'ghost'

  // Gas waster: high failed ratio
  if (failedRatio > 0.15 && txCount > 10) return 'gas_waster'

  // JPEG degen: many NFTs
  if (nftCount > 15) return 'jpeg_degen'

  // Airdrop farmer: many txs but few unique contracts OR many unique contracts but low diversity
  const isAirdropFarmer =
    (txCount > 100 && uniqueContracts < 5) ||
    (txCount > 80 && uniqueContracts > 60)
  if (isAirdropFarmer) return 'airdrop_hunter'

  // Certified degen: extreme activity or extreme failures
  if (degenScore > 70 || txCount > 300) return 'certified_degen'

  // Whale check (smaller)
  if (ethBalance > 1) return 'sad_whale'

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

  const degenScore = computeDegenScore({
    txCount, failedRatio, uniqueContracts, nftCount, erc20Count, walletAgeDays, ethBalance,
  })

  const category = classifyWallet({
    txCount, failedTxs, failedRatio, uniqueContracts, nftCount, erc20Count, walletAgeDays, ethBalance, degenScore,
  })

  const result: WalletAnalysis = {
    address,
    ethBalance,
    txCount,
    failedTxs,
    failedRatio,
    uniqueContracts,
    walletAgeDays,
    firstTxDate,
    nftCount,
    erc20Count,
    degenScore,
    category,
  }

  return NextResponse.json(result)
}
