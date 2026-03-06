export interface RoastResult {
  type: string
  title: string
  roast: string
  severity: 'mild' | 'spicy' | 'savage'
  emoji: string
}

export function generateRoast(
  address: string,
  balance: string,
  txCount: number,
  nfts: number,
  degenScore: number
): RoastResult {
  // Deterministic roast based on address + metrics
  const seed = parseInt(address.slice(-4), 16)
  
  if (degenScore > 80) {
    const roasts = [
      "Your wallet has more red flags than a Chinese parade",
      "You don't trade, you donate to the market",
      "Buying high, selling low - the strategy of legends (in their own mind)",
      "Your portfolio is like your dating life - constantly disappointing",
    ]
    return {
      type: 'Certified Degen',
      title: '💀 DEGEN ALERT',
      roast: roasts[seed % roasts.length],
      severity: 'savage',
      emoji: '💀🔥',
    }
  }
  
  if (parseFloat(balance) > 10) {
    const roasts = [
      "Big balance, small gains. Whales can be paper hands too",
      "You're rich but still can't pick a winning token",
      "All that ETH and you still check prices every 5 minutes",
    ]
    return {
      type: 'Anxious Whale',
      title: '🐋 SAD WHALE',
      roast: roasts[seed % roasts.length],
      severity: 'spicy',
      emoji: '🐋😢',
    }
  }
  
  if (txCount < 5) {
    const roasts = [
      "Your wallet is so empty, even dust bunnies moved out",
      "You call that a wallet? That's a participation trophy",
      "One transaction doesn't make you a crypto investor, Kevin",
    ]
    return {
      type: 'Paper Hands',
      title: '📝 PAPER HANDS',
      roast: roasts[seed % roasts.length],
      severity: 'mild',
      emoji: '📝😅',
    }
  }
  
  if (nfts > 20) {
    const roasts = [
      "Your JPEG collection is worth less than the gas you spent",
      "NFTs: The art of buying screenshots you could've saved",
      "Those monkeys aren't making you rich, they're just making you poor",
    ]
    return {
      type: 'JPEG Collector',
      title: '🖼️ JPEG DEGEN',
      roast: roasts[seed % roasts.length],
      severity: 'spicy',
      emoji: '🖼️💸',
    }
  }
  
  // Default roast
  const defaultRoasts = [
    "You're not early, you're just consistently wrong",
    "Your trading strategy? Hope and cope",
    "Web3 believer, Web2 salary",
    "You spent $50 in gas to buy $20 of tokens. Math genius",
  ]
  
  return {
    type: 'Average Degen',
    title: '🎯 MID DEGEN',
    roast: defaultRoasts[seed % defaultRoasts.length],
    severity: 'mild',
    emoji: '🎯😐',
  }
}

export function calculateDegenScore(
  txCount: number,
  nftTrades: number,
  failedTxs: number,
  balance: number
): number {
  let score = 0
  if (txCount > 100) score += 30
  if (nftTrades > 10) score += 25
  if (failedTxs > 5) score += 20
  if (balance < 0.1) score += 15
  return Math.min(100, score)
}
