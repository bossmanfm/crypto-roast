export interface RoastResult {
  type: string
  title: string
  roast: string
  severity: 'mild' | 'spicy' | 'savage'
  emoji: string
  degenScore: number
}

// Hash address to number (deterministic per wallet)
function hashAddress(address: string): number {
  let hash = 0
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Pick multiple seeds from different parts of address
function getSeeds(address: string) {
  const addr = address.toLowerCase().replace('0x', '')
  const s1 = parseInt(addr.slice(0, 8), 16) || 1
  const s2 = parseInt(addr.slice(8, 16), 16) || 1
  const s3 = parseInt(addr.slice(16, 24), 16) || 1
  const s4 = parseInt(addr.slice(24, 32), 16) || 1
  const s5 = parseInt(addr.slice(32, 40), 16) || 1
  return { s1, s2, s3, s4, s5 }
}

export function generateRoast(
  address: string,
  balance: string,
  _txCount: number,
  _nfts: number,
  _degenScore: number
): RoastResult {
  const { s1, s2, s3, s4, s5 } = getSeeds(address)
  const hash = hashAddress(address)
  const balNum = parseFloat(balance) || 0

  // Determine category from address hash (6 categories, distributed evenly)
  // Use s1 XOR s3 to pick category so it feels "unpredictable"
  const categoryRoll = ((s1 ^ s3) + s5) % 100
  const roastPick = s2 % 999  // for picking which line within category
  const degenScore = (hash % 60) + (s4 % 40) // 0-99, unique per wallet

  // Balance override: if truly rich wallet → Sad Whale
  if (balNum > 5) {
    const roasts = [
      "Big balance, small gains. Whales can be paper hands too",
      "You're rich but still can't pick a winning token",
      "All that ETH and you still check prices every 5 minutes",
      "50 ETH, 0 chill",
      "Your net worth is high, your IQ is low",
      "You're the whale that gets liquidated first",
      "Richest wallet, poorest decisions",
      "You could've just bought BTC and chilled, but no",
    ]
    return {
      type: 'Anxious Whale',
      title: '🐋 SAD WHALE',
      roast: roasts[roastPick % roasts.length],
      severity: 'spicy',
      emoji: '🐋😢',
      degenScore,
    }
  }

  // Category distribution based on address hash:
  // 0-19 → Certified Degen (20%)
  // 20-39 → JPEG Degen (20%)
  // 40-54 → Paper Hands (15%)
  // 55-74 → Mid Degen (20%)
  // 75-89 → Airdrop Hunter (15%)
  // 90-99 → Gas Waster (10%)

  if (categoryRoll < 20) {
    const roasts = [
      "Your wallet has more red flags than a Chinese parade",
      "You don't trade, you donate to the market",
      "Buying high, selling low - the strategy of legends (in their own mind)",
      "Your portfolio is like your dating life - constantly disappointing",
      "You've rugged yourself more times than actual scammers",
      "Your transaction history reads like a horror story",
      "Even your mom stopped asking about your 'investments'",
      "You've paid more in gas fees than your portfolio is worth",
      "Your DCA strategy: Disaster Continues Always",
      "You're the reason exchanges have 'are you sure?' popups",
      "Your wallet is a museum of bad decisions",
      "You've been 'early' to every project that died",
      "Your average buy price is higher than the all-time high",
      "You FOMO so hard, you buy the top and sell the bottom in the same day",
      "Your portfolio diversification is just different shades of red",
      "You've been rekt so many times, it's basically your personality",
      "Your stop-loss is 'close my eyes and hope'",
    ]
    return {
      type: 'Certified Degen',
      title: '💀 DEGEN ALERT',
      roast: roasts[roastPick % roasts.length],
      severity: 'savage',
      emoji: '💀🔥',
      degenScore,
    }
  }

  if (categoryRoll < 40) {
    const roasts = [
      "Your JPEG collection is worth less than the gas you spent",
      "NFTs: The art of buying screenshots you could've saved",
      "Those monkeys aren't making you rich, they're just making you poor",
      "Your NFT portfolio is just a gallery of regrets",
      "You spent 5 ETH on pictures my grandma could draw",
      "Your 'rare' NFTs are rare because nobody wants them",
      "You've been rugged more times than a Persian carpet store",
      "Your wallet is a graveyard of dead projects",
      "The only thing rare about your NFTs is finding a buyer",
      "You bought JPEGs, I bought food. We're not the same",
      "Your NFT strategy: buy high, pray, cry",
      "Those pixels cost more than your car payment",
    ]
    return {
      type: 'JPEG Collector',
      title: '🖼️ JPEG DEGEN',
      roast: roasts[roastPick % roasts.length],
      severity: 'spicy',
      emoji: '🖼️💸',
      degenScore,
    }
  }

  if (categoryRoll < 54) {
    const roasts = [
      "Your wallet is so empty, even dust bunnies moved out",
      "You call that a wallet? That's a participation trophy",
      "Your wallet has been sitting longer than your gym membership",
      "You're not holding, you're just forgotten",
      "Your crypto journey: downloaded MetaMask, got scared, left",
      "The only thing you're farming is disappointment",
      "You've been 'doing research' for 3 years with 0 trades",
      "Your wallet activity is as dead as your motivation",
      "You're not diamond hands, you're just hands",
      "Your last transaction was literally before COVID ended",
    ]
    return {
      type: 'Paper Hands',
      title: '📝 PAPER HANDS',
      roast: roasts[roastPick % roasts.length],
      severity: 'mild',
      emoji: '📝😅',
      degenScore,
    }
  }

  if (categoryRoll < 74) {
    const roasts = [
      "You're not early, you're just consistently wrong",
      "Your trading strategy? Hope and cope",
      "Web3 believer, Web2 salary",
      "You spent $50 in gas to buy $20 of tokens. Math genius",
      "Your portfolio is a perfect inverse of the market",
      "You're the reason 'not financial advice' exists",
      "Your due diligence is reading 3 tweets and a Discord message",
      "You've never met a shitcoin you didn't like",
      "You're one bad trade away from uninstalling MetaMask",
      "Your wallet summary: bought the hype, sold the news",
      "You're not investing, you're just burning money slower",
      "Your trading plan: YOLO → REKT → REPEAT",
      "You're the liquidity that smarter traders exit into",
    ]
    return {
      type: 'Average Degen',
      title: '🎯 MID DEGEN',
      roast: roasts[roastPick % roasts.length],
      severity: 'mild',
      emoji: '🎯😐',
      degenScore,
    }
  }

  if (categoryRoll < 89) {
    const roasts = [
      "Your wallet screams 'airdrop farmer' louder than a Discord notification",
      "10 different wallets, same IP. Very sneaky, not sneaky at all",
      "You interact with every protocol once and disappear",
      "Your 'portfolio' is 90% airdrop tokens worth $0.00001",
      "Sybil hunter's favorite target: you",
      "You've done 50 bridge transactions but never used a single dApp",
      "Your strategy: spam transactions, hope, repeat",
      "You're not a builder, you're a transaction factory",
      "Your wallet history looks like a checklist, not a life",
    ]
    return {
      type: 'Airdrop Farmer',
      title: '🌾 AIRDROP HUNTER',
      roast: roasts[roastPick % roasts.length],
      severity: 'spicy',
      emoji: '🌾💨',
      degenScore,
    }
  }

  // 90-99: Gas Waster
  const roasts = [
    "You've spent more on gas than on rent",
    "Your failed transactions could fund a small country",
    "You set gas to 1 gwei and wonder why nothing confirms",
    "Your gas optimization: none. Your wallet balance: gone.",
    "You've gifted more to miners than to your own portfolio",
    "Gas wasted: could've bought a Tesla. Didn't.",
    "You send 1 ETH and spend 0.5 ETH on gas. Sounds right.",
  ]
  return {
    type: 'Gas Waster',
    title: '⛽ GAS WASTER',
    roast: roasts[roastPick % roasts.length],
    severity: 'savage',
    emoji: '⛽💸',
    degenScore,
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
